-- CAP - Módulo de puntos y rankings (brief "Sistema de puntos - CAP")
--
-- Idea central: cada `partido` (encuentro entre 2 equipos en una fecha) en
-- realidad se juega en 2 partidos individuales, cada uno por una pareja
-- distinta (las parejas rotan fecha a fecha, no son fijas). Esta migración
-- agrega esa capa de detalle sin romper lo que ya existe:
--
-- - `partido.sets_local` / `partido.sets_visitante` pasan a representar
--   cuántos de los 2 partidos individuales ganó cada equipo (0, 1 o 2) --
--   se derivan automáticamente de `partido_individual` al cargar el
--   resultado. La vista `vista_tabla_posiciones` (puntos 3/1/0 por fecha)
--   no cambia: "2-0" sigue siendo victoria, "1-1" empate, exactamente
--   igual al brief.
-- - `games_local` / `games_visitante` en `partido` se siguen cargando como
--   total agregado del encuentro (no se lleva detalle set a set).
-- - El ranking de jugadores se calcula de `partido_individual` según la
--   tabla de puntos del brief. Walkover NO otorga ni resta puntos
--   individuales (decisión del organizador).
-- - El ranking de equipos (anual) combina una posición final que ingresa
--   el admin a mano al terminar la temporada (Campeón/Subcampeón/etc, ya
--   que el formato de playoffs todavía no está definido) con el bonus por
--   rendimiento en fase regular, que sí se calcula solo.

create table partido_individual (
  id uuid primary key default gen_random_uuid(),
  partido_id uuid not null references partido (id) on delete cascade,
  numero smallint not null check (numero in (1, 2)),
  jugador_local_1_id uuid not null references jugador (id),
  jugador_local_2_id uuid not null references jugador (id),
  jugador_visitante_1_id uuid not null references jugador (id),
  jugador_visitante_2_id uuid not null references jugador (id),
  sets_local smallint not null check (sets_local between 0 and 2),
  sets_visitante smallint not null check (sets_visitante between 0 and 2),
  check (sets_local <> sets_visitante),
  check (greatest(sets_local, sets_visitante) = 2),
  unique (partido_id, numero)
);

create index on partido_individual (partido_id);

alter table partido_individual enable row level security;

create policy "lectura publica" on partido_individual for select using (true);

create policy "admin gestiona partido_individual" on partido_individual
  for all using (is_admin()) with check (is_admin());

-- Mismo criterio que la policy de "cargar resultado" en partido: solo el
-- capitán del equipo local, y solo mientras el encuentro sigue
-- 'programado' (el server action inserta estas filas ANTES de pasar el
-- partido a pendiente_confirmacion).
create policy "capitan local carga partido_individual" on partido_individual
  for insert
  with check (
    exists (
      select 1 from partido p
      where p.id = partido_individual.partido_id
        and p.estado = 'programado'
        and p.equipo_local_id = mi_equipo_id()
    )
  );

create policy "capitan local edita partido_individual antes de confirmar" on partido_individual
  for update
  using (
    exists (
      select 1 from partido p
      where p.id = partido_individual.partido_id
        and p.estado = 'programado'
        and p.equipo_local_id = mi_equipo_id()
    )
  )
  with check (
    exists (
      select 1 from partido p
      where p.id = partido_individual.partido_id
        and p.estado = 'programado'
        and p.equipo_local_id = mi_equipo_id()
    )
  );

create policy "capitan local borra partido_individual antes de confirmar" on partido_individual
  for delete
  using (
    exists (
      select 1 from partido p
      where p.id = partido_individual.partido_id
        and p.estado = 'programado'
        and p.equipo_local_id = mi_equipo_id()
    )
  );

-- Ranking individual de jugadores ------------------------------------------

create view vista_ranking_jugadores as
with jugadas as (
  select
    pi.jugador_local_1_id as jugador_id,
    case
      when pi.sets_local = 2 and pi.sets_visitante = 0 then 100
      when pi.sets_local = 2 and pi.sets_visitante = 1 then 80
      when pi.sets_local = 1 and pi.sets_visitante = 2 then 30
      when pi.sets_local = 0 and pi.sets_visitante = 2 then 10
    end as puntos
  from partido_individual pi
  join partido p on p.id = pi.partido_id
  where p.estado = 'confirmado'
  union all
  select
    pi.jugador_local_2_id,
    case
      when pi.sets_local = 2 and pi.sets_visitante = 0 then 100
      when pi.sets_local = 2 and pi.sets_visitante = 1 then 80
      when pi.sets_local = 1 and pi.sets_visitante = 2 then 30
      when pi.sets_local = 0 and pi.sets_visitante = 2 then 10
    end
  from partido_individual pi
  join partido p on p.id = pi.partido_id
  where p.estado = 'confirmado'
  union all
  select
    pi.jugador_visitante_1_id,
    case
      when pi.sets_visitante = 2 and pi.sets_local = 0 then 100
      when pi.sets_visitante = 2 and pi.sets_local = 1 then 80
      when pi.sets_visitante = 1 and pi.sets_local = 2 then 30
      when pi.sets_visitante = 0 and pi.sets_local = 2 then 10
    end
  from partido_individual pi
  join partido p on p.id = pi.partido_id
  where p.estado = 'confirmado'
  union all
  select
    pi.jugador_visitante_2_id,
    case
      when pi.sets_visitante = 2 and pi.sets_local = 0 then 100
      when pi.sets_visitante = 2 and pi.sets_local = 1 then 80
      when pi.sets_visitante = 1 and pi.sets_local = 2 then 30
      when pi.sets_visitante = 0 and pi.sets_local = 2 then 10
    end
  from partido_individual pi
  join partido p on p.id = pi.partido_id
  where p.estado = 'confirmado'
)
select
  jg.id as jugador_id,
  jg.nombre as jugador_nombre,
  jg.equipo_id,
  eq.nombre as equipo_nombre,
  eq.categoria_id,
  count(j.puntos) as partidos_jugados,
  coalesce(sum(j.puntos), 0) as puntos_totales
from jugador jg
join equipo eq on eq.id = jg.equipo_id
left join jugadas j on j.jugador_id = jg.id
group by jg.id, jg.nombre, jg.equipo_id, eq.nombre, eq.categoria_id;

-- Ranking general de equipos (histórico / anual) ---------------------------

create table posicion_final_equipo (
  equipo_id uuid primary key references equipo (id) on delete cascade,
  posicion text not null check (
    posicion in ('campeon', 'subcampeon', 'semifinalista', 'tercero', 'cuarto', 'quinto')
  )
);

alter table posicion_final_equipo enable row level security;

create policy "lectura publica" on posicion_final_equipo for select using (true);

create policy "admin gestiona posicion_final_equipo" on posicion_final_equipo
  for all using (is_admin()) with check (is_admin());

create or replace function puntos_posicion_final(pos text)
returns int
language sql
immutable
as $$
  select case pos
    when 'campeon' then 1000
    when 'subcampeon' then 700
    when 'semifinalista' then 450
    when 'tercero' then 250
    when 'cuarto' then 150
    when 'quinto' then 100
    else 0
  end;
$$;

create view vista_ranking_equipos as
select
  t.equipo_id,
  t.equipo_nombre,
  t.categoria_id,
  pf.posicion as posicion_final,
  coalesce(puntos_posicion_final(pf.posicion), 0) as puntos_posicion,
  t.partidos_ganados * 20 + t.partidos_empatados * 10 as puntos_bonus,
  coalesce(puntos_posicion_final(pf.posicion), 0)
    + t.partidos_ganados * 20 + t.partidos_empatados * 10 as puntos_totales
from vista_tabla_posiciones t
left join posicion_final_equipo pf on pf.equipo_id = t.equipo_id;
