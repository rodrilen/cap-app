-- La contraseña que se manda por mail ahora se deriva del nombre del club
-- ("LasCanas.CAP.2026") para que el capitán la pueda tipear sin errores.
-- El problema es que los nombres de los clubes están publicados en la página
-- de Clubes, así que esa clave la puede deducir cualquiera.
--
-- Por eso vale una sola vez: al entrar, la app obliga a elegir una propia y
-- no deja usar nada más hasta que se cambie. Esta columna es la que marca
-- quién todavía está usando la clave inicial.

alter table usuario
  add column debe_cambiar_password boolean not null default false;

-- El capitán tiene que poder marcar su propia fila como ya cambiada. La
-- policy existente de lectura no alcanza: hace falta el update acotado a
-- la fila propia.
create policy "usuario actualiza su propia fila"
  on usuario for update
  using (id = auth.uid())
  with check (id = auth.uid());
