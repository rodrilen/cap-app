-- CAP - Etapa 1: esquema base
-- Nota: RLS se define en Etapa 2 (junto con auth de admin/capitán).
-- Por ahora las tablas quedan sin RLS para poder seedear y probar libremente.

create extension if not exists "pgcrypto";

create type etapa_fecha as enum ('liga', 'semifinal', 'final');

create type estado_partido as enum (
  'programado',
  'pendiente_confirmacion',
  'confirmado',
  'disputado',
  'walkover'
);

create type rol_usuario as enum ('admin', 'capitan');

create type tipo_notificacion as enum ('pendiente_confirmacion');

create table club (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  direccion text,
  es_anfitrion boolean not null default false,
  contacto text
);

create table categoria (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  activa boolean not null default true
);

create table equipo (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria_id uuid not null references categoria (id),
  club_sede_id uuid not null references club (id),
  color text,
  logo_url text
);

create table jugador (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  equipo_id uuid not null references equipo (id)
);

create table fecha (
  id uuid primary key default gen_random_uuid(),
  numero int not null,
  categoria_id uuid not null references categoria (id),
  fecha_programada date not null,
  etapa etapa_fecha not null default 'liga'
);

-- usuario.id coincide con auth.users.id (se crea en Etapa 2, cuando exista auth).
create table usuario (
  id uuid primary key,
  email text not null,
  rol rol_usuario not null,
  equipo_id uuid references equipo (id)
);

create table partido (
  id uuid primary key default gen_random_uuid(),
  fecha_id uuid not null references fecha (id),
  equipo_local_id uuid not null references equipo (id),
  equipo_visitante_id uuid not null references equipo (id),
  club_sede_id uuid not null references club (id),
  sets_local int,
  sets_visitante int,
  -- Conteo agregado de games ganados por lado, para el 3er criterio de
  -- desempate (partidos ganados > sets > games) definido en la sección 6
  -- del spec. El spec original no incluía estos campos explícitamente.
  games_local int,
  games_visitante int,
  estado estado_partido not null default 'programado',
  cargado_por uuid references usuario (id),
  confirmado_por uuid references usuario (id),
  check (equipo_local_id <> equipo_visitante_id)
);

create table notificacion (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuario (id),
  partido_id uuid not null references partido (id),
  tipo tipo_notificacion not null default 'pendiente_confirmacion',
  leida boolean not null default false,
  creada_en timestamptz not null default now()
);

create index on equipo (categoria_id);
create index on equipo (club_sede_id);
create index on jugador (equipo_id);
create index on fecha (categoria_id);
create index on partido (fecha_id);
create index on partido (equipo_local_id);
create index on partido (equipo_visitante_id);
create index on partido (estado);
create index on notificacion (usuario_id, leida);

-- Tabla de posiciones: se calcula on-the-fly, no se persiste.
-- Considera partidos 'confirmado' y 'walkover' (el walkover ya define
-- ganador/perdedor vía sets_local/sets_visitante cargados por el admin
-- al resolverlo: 3-0 para el ganador, 0-3 para el que no se presentó,
-- de forma que entren en el cálculo de puntos sin contar en el promedio
-- de sets/games si se filtra por estado = 'confirmado' aparte).
create view vista_tabla_posiciones as
with partidos_validos as (
  select *
  from partido
  where estado in ('confirmado', 'walkover')
),
resultados as (
  select
    equipo_local_id as equipo_id,
    fecha_id,
    case when sets_local > sets_visitante then 1 else 0 end as ganados,
    case when sets_local = sets_visitante then 1 else 0 end as empatados,
    case when sets_local < sets_visitante then 1 else 0 end as perdidos,
    coalesce(sets_local, 0) as sets_favor,
    coalesce(sets_visitante, 0) as sets_contra,
    coalesce(games_local, 0) as games_favor,
    coalesce(games_visitante, 0) as games_contra
  from partidos_validos
  union all
  select
    equipo_visitante_id as equipo_id,
    fecha_id,
    case when sets_visitante > sets_local then 1 else 0 end as ganados,
    case when sets_visitante = sets_local then 1 else 0 end as empatados,
    case when sets_visitante < sets_local then 1 else 0 end as perdidos,
    coalesce(sets_visitante, 0) as sets_favor,
    coalesce(sets_local, 0) as sets_contra,
    coalesce(games_visitante, 0) as games_favor,
    coalesce(games_local, 0) as games_contra
  from partidos_validos
)
select
  e.id as equipo_id,
  e.nombre as equipo_nombre,
  e.categoria_id,
  count(*) as partidos_jugados,
  sum(r.ganados) as partidos_ganados,
  sum(r.empatados) as partidos_empatados,
  sum(r.perdidos) as partidos_perdidos,
  sum(r.ganados) * 3 + sum(r.empatados) * 1 as puntos,
  sum(r.sets_favor) as sets_favor,
  sum(r.sets_contra) as sets_contra,
  sum(r.sets_favor) - sum(r.sets_contra) as diferencia_sets,
  sum(r.games_favor) as games_favor,
  sum(r.games_contra) as games_contra,
  sum(r.games_favor) - sum(r.games_contra) as diferencia_games
from resultados r
join equipo e on e.id = r.equipo_id
group by e.id, e.nombre, e.categoria_id;
-- Orden sugerido en el query de consumo:
-- order by puntos desc, partidos_ganados desc, diferencia_sets desc, diferencia_games desc
