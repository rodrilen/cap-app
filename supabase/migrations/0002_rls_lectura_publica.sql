-- CAP - Etapa 1: lectura pública para las vistas sin login
-- Supabase habilita RLS por defecto en tablas nuevas; sin policies, la API
-- (rol anon/authenticated) no ve ninguna fila aunque los datos existan.
-- Estas tablas alimentan las vistas públicas del MVP (fixture, resultados,
-- tabla de posiciones, ficha de equipo, clubes anfitriones), así que se
-- habilita SELECT para cualquiera. Todavía no hay policies de
-- INSERT/UPDATE/DELETE: esas se agregan en la Etapa 2 junto con los roles
-- admin/capitán.
--
-- `usuario` y `notificacion` quedan sin policies (RLS habilitado, 0
-- policies = acceso denegado por completo vía API) porque son datos
-- privados ligados a auth, a definir en la Etapa 2.

alter table club enable row level security;
alter table categoria enable row level security;
alter table equipo enable row level security;
alter table jugador enable row level security;
alter table fecha enable row level security;
alter table partido enable row level security;
alter table usuario enable row level security;
alter table notificacion enable row level security;

create policy "lectura publica" on club for select using (true);
create policy "lectura publica" on categoria for select using (true);
create policy "lectura publica" on equipo for select using (true);
create policy "lectura publica" on jugador for select using (true);
create policy "lectura publica" on fecha for select using (true);
create policy "lectura publica" on partido for select using (true);
