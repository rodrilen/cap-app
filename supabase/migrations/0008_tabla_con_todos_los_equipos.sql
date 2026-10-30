-- La tabla de posiciones salteaba a los equipos sin partidos confirmados.
-- El join con `resultados` era interno, así que un equipo que todavía no jugó
-- —o cuyo único resultado está esperando confirmación— directamente no
-- aparecía, en vez de figurar con 0 puntos.
--
-- Se vio el 2026-10-30: de la fecha 1 había 3 resultados confirmados y 1 sin
-- confirmar, y la tabla de C5-C6 mostraba 2 equipos de 4. CH Padel A parecía
-- no estar en el torneo.
--
-- Ahora el join sale desde `equipo`, así que están siempre los 4 de cada
-- categoría desde el primer día. `vista_ranking_equipos` se construye sobre
-- esta vista, así que se arregla sola.

create or replace view vista_tabla_posiciones as
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
  -- count(r.equipo_id) y no count(*): con el left join, un equipo sin
  -- resultados trae una fila de nulos y count(*) le contaría 1 partido.
  count(r.equipo_id) as partidos_jugados,
  coalesce(sum(r.ganados), 0) as partidos_ganados,
  coalesce(sum(r.empatados), 0) as partidos_empatados,
  coalesce(sum(r.perdidos), 0) as partidos_perdidos,
  coalesce(sum(r.ganados), 0) * 3 + coalesce(sum(r.empatados), 0) * 1 as puntos,
  coalesce(sum(r.sets_favor), 0) as sets_favor,
  coalesce(sum(r.sets_contra), 0) as sets_contra,
  coalesce(sum(r.sets_favor), 0) - coalesce(sum(r.sets_contra), 0) as diferencia_sets,
  coalesce(sum(r.games_favor), 0) as games_favor,
  coalesce(sum(r.games_contra), 0) as games_contra,
  coalesce(sum(r.games_favor), 0) - coalesce(sum(r.games_contra), 0) as diferencia_games
from equipo e
left join resultados r on r.equipo_id = e.id
group by e.id, e.nombre, e.categoria_id;
