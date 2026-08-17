-- CAP - Etapa 2: roles (admin/capitán), escritura vía RLS y notificaciones
--
-- Resumen de las reglas de escritura que quedan codificadas acá:
-- - club/categoria/equipo/jugador/fecha: solo admin puede insert/update/delete
--   (la lectura pública ya existía desde la Etapa 1).
-- - usuario: cada quien ve su propia fila; admin ve y gestiona todas.
-- - partido: admin tiene control total. Un capitán solo puede:
--     * cargar el resultado (estado programado -> pendiente_confirmacion)
--       si su equipo es el LOCAL de ese partido.
--     * confirmar o disputar (estado pendiente_confirmacion -> confirmado/disputado)
--       si su equipo es el VISITANTE de ese partido.
--   En ningún caso puede escribir sobre un partido donde su equipo no
--   participa como local o visitante.
-- - notificacion: se crea automáticamente (trigger) cuando un partido pasa
--   a pendiente_confirmacion, dirigida al capitán del equipo visitante.
--   Cada usuario solo ve y marca como leídas sus propias notificaciones.

alter table usuario
  add constraint usuario_id_fkey foreign key (id) references auth.users (id) on delete cascade;

-- Funciones auxiliares (security definer): evitan que las policies de
-- `usuario` tengan que auto-consultarse a sí mismas con RLS activo, y
-- centralizan el chequeo de rol/equipo para el resto de las tablas.

create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from usuario where id = auth.uid() and rol = 'admin'
  );
$$;

create or replace function mi_equipo_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select equipo_id from usuario where id = auth.uid();
$$;

-- usuario ------------------------------------------------------------

create policy "ver propio usuario o admin ve todos" on usuario
  for select using (id = auth.uid() or is_admin());

create policy "admin crea usuarios" on usuario
  for insert with check (is_admin());

create policy "admin actualiza usuarios" on usuario
  for update using (is_admin()) with check (is_admin());

create policy "admin elimina usuarios" on usuario
  for delete using (is_admin());

-- club / categoria / equipo / jugador / fecha: escritura solo admin ---

create policy "admin escribe club" on club for insert with check (is_admin());
create policy "admin actualiza club" on club for update using (is_admin()) with check (is_admin());
create policy "admin borra club" on club for delete using (is_admin());

create policy "admin escribe categoria" on categoria for insert with check (is_admin());
create policy "admin actualiza categoria" on categoria for update using (is_admin()) with check (is_admin());
create policy "admin borra categoria" on categoria for delete using (is_admin());

create policy "admin escribe equipo" on equipo for insert with check (is_admin());
create policy "admin actualiza equipo" on equipo for update using (is_admin()) with check (is_admin());
create policy "admin borra equipo" on equipo for delete using (is_admin());

create policy "admin escribe jugador" on jugador for insert with check (is_admin());
create policy "admin actualiza jugador" on jugador for update using (is_admin()) with check (is_admin());
create policy "admin borra jugador" on jugador for delete using (is_admin());

create policy "admin escribe fecha" on fecha for insert with check (is_admin());
create policy "admin actualiza fecha" on fecha for update using (is_admin()) with check (is_admin());
create policy "admin borra fecha" on fecha for delete using (is_admin());

-- partido --------------------------------------------------------------

create policy "admin gestiona partidos" on partido
  for all using (is_admin()) with check (is_admin());

create policy "capitan local carga resultado" on partido
  for update
  using (
    estado = 'programado'
    and equipo_local_id = mi_equipo_id()
  )
  with check (
    estado = 'pendiente_confirmacion'
    and cargado_por = auth.uid()
  );

create policy "capitan visitante confirma o disputa" on partido
  for update
  using (
    estado = 'pendiente_confirmacion'
    and equipo_visitante_id = mi_equipo_id()
  )
  with check (
    estado in ('confirmado', 'disputado')
    and (estado <> 'confirmado' or confirmado_por = auth.uid())
  );

-- notificacion -----------------------------------------------------------

create policy "ver propias notificaciones o admin" on notificacion
  for select using (usuario_id = auth.uid() or is_admin());

create policy "marcar propia notificacion leida" on notificacion
  for update using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- Trigger: al confirmar la carga de un resultado (estado ->
-- pendiente_confirmacion), se notifica al capitán del equipo visitante.
-- security definer para poder insertar en notificacion sin necesidad de
-- darle policy de insert a los capitanes.

create or replace function crear_notificacion_pendiente_confirmacion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario_visitante uuid;
begin
  if new.estado = 'pendiente_confirmacion' and old.estado is distinct from new.estado then
    select id into v_usuario_visitante
    from usuario
    where equipo_id = new.equipo_visitante_id and rol = 'capitan'
    limit 1;

    if v_usuario_visitante is not null then
      insert into notificacion (usuario_id, partido_id, tipo)
      values (v_usuario_visitante, new.id, 'pendiente_confirmacion');
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_notificacion_pendiente_confirmacion
  after update on partido
  for each row
  execute function crear_notificacion_pendiente_confirmacion();
