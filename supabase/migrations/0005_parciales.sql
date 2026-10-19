-- Parciales de cada partido individual.
--
-- Antes el capitán elegía el resultado en sets de una lista ("2-1") y aparte
-- tipeaba a mano el total de games del encuentro. Eso obligaba a sumar de
-- memoria un número que define posiciones en la tabla (games es el cuarto
-- criterio de desempate), y encima era opcional.
--
-- Ahora se cargan los parciales reales (6-4, 6-3) y tanto los sets como los
-- games salen derivados. El súper tiebreak reemplaza al tercer set y cuenta
-- como 1 game para quien lo gana.
--
-- Las columnas quedan nullable a propósito: las filas cargadas con el método
-- anterior no tienen parciales y se siguen mostrando por sus sets.

alter table partido_individual
  add column set1_local smallint,
  add column set1_visitante smallint,
  add column set2_local smallint,
  add column set2_visitante smallint,
  add column tb_local smallint,
  add column tb_visitante smallint;

alter table partido_individual
  add constraint parciales_no_negativos check (
    coalesce(set1_local, 0) >= 0
    and coalesce(set1_visitante, 0) >= 0
    and coalesce(set2_local, 0) >= 0
    and coalesce(set2_visitante, 0) >= 0
    and coalesce(tb_local, 0) >= 0
    and coalesce(tb_visitante, 0) >= 0
  );
