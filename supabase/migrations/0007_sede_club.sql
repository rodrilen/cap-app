-- Hasta ahora la app daba por hecho que el club y la cancha donde juega son
-- la misma cosa: el fixture mostraba el nombre del club como sede. No siempre
-- es así -- Pintados juega en Punto de Oro, chpadel en Sportium y los tres
-- equipos de Padel Generativo en Life Padel.
--
-- El caso más confuso era la fecha 1: se juega entera en Punto de Oro, así que
-- los cuatro partidos aparecían con sede "Pintados", como si Pintados fuera
-- local en todos.
--
-- Esta columna guarda el nombre de la cancha. Queda vacía en los clubes que
-- juegan en la propia: ahí el fixture sigue mostrando el nombre del club.

alter table club
  add column sede text;

comment on column club.sede is
  'Nombre de la cancha donde el club juega de local, cuando no coincide con el nombre del club. Si está vacía, se muestra el nombre del club.';

-- Canchas de la temporada 2026, según el relevamiento del organizador.
-- Las Cañas, Aura padel y Black Padel juegan en la propia: quedan en null.
update club set sede = 'Punto de Oro' where nombre = 'Pintados';
update club set sede = 'Sportium'     where nombre = 'chpadel';
update club set sede = 'Life Padel'   where nombre = 'Padel Generativo';
