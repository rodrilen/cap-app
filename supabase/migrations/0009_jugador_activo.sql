-- Un jugador no se podía dar de baja. La tabla `jugador` servía para dos
-- cosas a la vez: quiénes están hoy en el plantel y quiénes jugaron cada
-- partido. Como `partido_individual` referencia a `jugador` sin `on delete`,
-- borrar a alguien que ya jugó lo rechaza la base -- y está bien que lo
-- rechace: su nombre tiene que seguir figurando en el partido que jugó.
--
-- Pasó el 2026-11-27: Black Padel quiso reemplazar a Alejo Zerbo, que ya
-- había jugado la fecha 2, y el equipo estaba en el tope de 8 del
-- reglamento, así que tampoco se podía sumar a nadie más.
--
-- Con esta columna, dar de baja a un jugador es marcarlo inactivo: sale de
-- los desplegables de carga y deja de contar para el tope de 8, pero sigue
-- apareciendo en los partidos que jugó.

alter table jugador
  add column activo boolean not null default true;

comment on column jugador.activo is
  'false = dado de baja del plantel. No se puede elegir para cargar resultados ni cuenta para el máximo de 8 del reglamento, pero sigue figurando en los partidos que ya jugó.';
