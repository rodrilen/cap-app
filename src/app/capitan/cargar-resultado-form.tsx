"use client";

import { useActionState, useState } from "react";
import { cargarResultado } from "./actions";

type Jugador = { id: string; nombre: string };
type Sets = {
  s1l: string;
  s1v: string;
  s2l: string;
  s2v: string;
  tbl: string;
  tbv: string;
};

const SETS_VACIOS: Sets = { s1l: "", s1v: "", s2l: "", s2v: "", tbl: "", tbv: "" };

// Los cuatro jugadores de un partido individual. Un jugador sí puede repetirse
// entre el Partido 1 y el 2 (hay equipos de sólo 3 jugadores), pero no puede
// ser los dos integrantes de la misma pareja.
type Pareja = { l1: string; l2: string; v1: string; v2: string };

const PAREJA_VACIA: Pareja = { l1: "", l2: "", v1: "", v2: "" };

function hayRepetido(a: string, b: string) {
  return a !== "" && a === b;
}

function ganadorDeSet(local: string, visitante: string) {
  if (local === "" || visitante === "") return null;
  const l = Number(local);
  const v = Number(visitante);
  if (l === v) return "empate" as const;
  return l > v ? ("local" as const) : ("visitante" as const);
}

// El súper tiebreak sólo se juega cuando cada equipo ganó un set.
function necesitaTiebreak(sets: Sets) {
  const g1 = ganadorDeSet(sets.s1l, sets.s1v);
  const g2 = ganadorDeSet(sets.s2l, sets.s2v);
  if (!g1 || !g2 || g1 === "empate" || g2 === "empate") return false;
  return g1 !== g2;
}

// El súper tiebreak entra en esta cuenta igual que los sets: si queda
// empatado, el partido individual no tiene ganador y el servidor terminaría
// adjudicándoselo al visitante sin avisar.
function tieneSetEmpatado(sets: Sets) {
  return (
    ganadorDeSet(sets.s1l, sets.s1v) === "empate" ||
    ganadorDeSet(sets.s2l, sets.s2v) === "empate" ||
    ganadorDeSet(sets.tbl, sets.tbv) === "empate"
  );
}

// text-base (16px) no es decorativo: con una fuente menor, Safari en iPhone
// hace zoom al enfocar el campo y descoloca toda la pantalla. El min-h-11
// (44px) es el mínimo recomendado para tocar con el pulgar.
function SelectJugador({
  name,
  jugadores,
  value,
  onChange,
}: {
  name: string;
  jugadores: Jugador[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      name={name}
      required
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="min-h-11 w-full rounded border border-zinc-300 px-2 text-base"
    >
      <option value="">Elegir…</option>
      {jugadores.map((j) => (
        <option key={j.id} value={j.id}>
          {j.nombre}
        </option>
      ))}
    </select>
  );
}

function InputGames({
  name,
  value,
  onChange,
  required,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  required: boolean;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      min={0}
      max={99}
      className="min-h-11 w-16 rounded border border-zinc-300 px-2 text-center text-base"
    />
  );
}

function BloquePartido({
  numero,
  jugadoresPropios,
  jugadoresRivales,
  equipoLocalNombre,
  equipoVisitanteNombre,
  sets,
  onSetsChange,
  pareja,
  onParejaChange,
}: {
  numero: 1 | 2;
  jugadoresPropios: Jugador[];
  jugadoresRivales: Jugador[];
  equipoLocalNombre?: string;
  equipoVisitanteNombre?: string;
  sets: Sets;
  onSetsChange: (sets: Sets) => void;
  pareja: Pareja;
  onParejaChange: (pareja: Pareja) => void;
}) {
  const conTiebreak = necesitaTiebreak(sets);
  const empatado = tieneSetEmpatado(sets);
  const localRepetido = hayRepetido(pareja.l1, pareja.l2);
  const visitanteRepetido = hayRepetido(pareja.v1, pareja.v2);

  return (
    <fieldset className="flex flex-col gap-3 rounded border border-zinc-200 p-3">
      <legend className="text-sm font-medium text-azul-noche">Partido {numero}</legend>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          {equipoLocalNombre ?? "Local"} — jugador 1
          <SelectJugador
            name={`p${numero}_jugador_local_1`}
            jugadores={jugadoresPropios}
            value={pareja.l1}
            onChange={(v) => onParejaChange({ ...pareja, l1: v })}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {equipoLocalNombre ?? "Local"} — jugador 2
          <SelectJugador
            name={`p${numero}_jugador_local_2`}
            jugadores={jugadoresPropios}
            value={pareja.l2}
            onChange={(v) => onParejaChange({ ...pareja, l2: v })}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {equipoVisitanteNombre ?? "Visitante"} — jugador 1
          <SelectJugador
            name={`p${numero}_jugador_visitante_1`}
            jugadores={jugadoresRivales}
            value={pareja.v1}
            onChange={(v) => onParejaChange({ ...pareja, v1: v })}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {equipoVisitanteNombre ?? "Visitante"} — jugador 2
          <SelectJugador
            name={`p${numero}_jugador_visitante_2`}
            jugadores={jugadoresRivales}
            value={pareja.v2}
            onChange={(v) => onParejaChange({ ...pareja, v2: v })}
          />
        </label>
      </div>

      {(localRepetido || visitanteRepetido) && (
        <p className="text-sm text-red-600">
          {localRepetido ? equipoLocalNombre ?? "El local" : equipoVisitanteNombre ?? "El visitante"}{" "}
          tiene el mismo jugador dos veces en esta pareja.
        </p>
      )}

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1 text-sm">
          <span>Set 1</span>
          <div className="flex items-center gap-1">
            <InputGames
              name={`p${numero}_set1_local`}
              value={sets.s1l}
              onChange={(v) => onSetsChange({ ...sets, s1l: v })}
              required
            />
            <span className="text-zinc-500">-</span>
            <InputGames
              name={`p${numero}_set1_visitante`}
              value={sets.s1v}
              onChange={(v) => onSetsChange({ ...sets, s1v: v })}
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-1 text-sm">
          <span>Set 2</span>
          <div className="flex items-center gap-1">
            <InputGames
              name={`p${numero}_set2_local`}
              value={sets.s2l}
              onChange={(v) => onSetsChange({ ...sets, s2l: v })}
              required
            />
            <span className="text-zinc-500">-</span>
            <InputGames
              name={`p${numero}_set2_visitante`}
              value={sets.s2v}
              onChange={(v) => onSetsChange({ ...sets, s2v: v })}
              required
            />
          </div>
        </div>

        {conTiebreak && (
          <div className="flex flex-col gap-1 text-sm">
            <span>Súper tiebreak</span>
            <div className="flex items-center gap-1">
              <InputGames
                name={`p${numero}_tb_local`}
                value={sets.tbl}
                onChange={(v) => onSetsChange({ ...sets, tbl: v })}
                required
              />
              <span className="text-zinc-500">-</span>
              <InputGames
                name={`p${numero}_tb_visitante`}
                value={sets.tbv}
                onChange={(v) => onSetsChange({ ...sets, tbv: v })}
                required
              />
            </div>
          </div>
        )}
      </div>

      {empatado && (
        <p className="text-sm text-red-600">
          Ni un set ni el súper tiebreak pueden terminar empatados. Revisá los
          números.
        </p>
      )}
    </fieldset>
  );
}

export function CargarResultadoForm({
  partidoId,
  encabezado,
  jugadoresPropios,
  jugadoresRivales,
  equipoLocalNombre,
  equipoVisitanteNombre,
}: {
  partidoId: string;
  encabezado: string;
  jugadoresPropios: Jugador[];
  jugadoresRivales: Jugador[];
  equipoLocalNombre?: string;
  equipoVisitanteNombre?: string;
}) {
  const [estado, formAction, enviando] = useActionState(cargarResultado, {});
  const [sets1, setSets1] = useState<Sets>(SETS_VACIOS);
  const [sets2, setSets2] = useState<Sets>(SETS_VACIOS);
  const [pareja1, setPareja1] = useState<Pareja>(PAREJA_VACIA);
  const [pareja2, setPareja2] = useState<Pareja>(PAREJA_VACIA);

  const hayEmpate = tieneSetEmpatado(sets1) || tieneSetEmpatado(sets2);
  const hayJugadorRepetido = [pareja1, pareja2].some(
    (p) => hayRepetido(p.l1, p.l2) || hayRepetido(p.v1, p.v2),
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded border border-zinc-200 p-3"
    >
      <input type="hidden" name="partido_id" value={partidoId} />
      <span className="text-sm text-azul-noche/70">{encabezado}</span>

      <BloquePartido
        numero={1}
        jugadoresPropios={jugadoresPropios}
        jugadoresRivales={jugadoresRivales}
        equipoLocalNombre={equipoLocalNombre}
        equipoVisitanteNombre={equipoVisitanteNombre}
        sets={sets1}
        onSetsChange={setSets1}
        pareja={pareja1}
        onParejaChange={setPareja1}
      />
      <BloquePartido
        numero={2}
        jugadoresPropios={jugadoresPropios}
        jugadoresRivales={jugadoresRivales}
        equipoLocalNombre={equipoLocalNombre}
        equipoVisitanteNombre={equipoVisitanteNombre}
        sets={sets2}
        onSetsChange={setSets2}
        pareja={pareja2}
        onParejaChange={setPareja2}
      />

      {estado.error && (
        <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {estado.error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={hayEmpate || hayJugadorRepetido || enviando}
          className="min-h-11 w-full rounded bg-naranja px-4 text-base font-medium text-azul-noche disabled:opacity-40 sm:w-auto"
        >
          {enviando ? "Guardando…" : "Cargar resultado"}
        </button>
        <span className="text-xs text-zinc-600">
          Los sets y los games se calculan solos a partir de los parciales.
        </span>
      </div>
    </form>
  );
}
