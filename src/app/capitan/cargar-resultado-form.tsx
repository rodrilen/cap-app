"use client";

import { useState } from "react";
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

function tieneSetEmpatado(sets: Sets) {
  return (
    ganadorDeSet(sets.s1l, sets.s1v) === "empate" ||
    ganadorDeSet(sets.s2l, sets.s2v) === "empate"
  );
}

function SelectJugador({ name, jugadores }: { name: string; jugadores: Jugador[] }) {
  return (
    <select name={name} required className="rounded border border-zinc-300 px-2 py-1">
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
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      min={0}
      max={99}
      className="w-14 rounded border border-zinc-300 px-2 py-1 text-center"
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
}: {
  numero: 1 | 2;
  jugadoresPropios: Jugador[];
  jugadoresRivales: Jugador[];
  equipoLocalNombre?: string;
  equipoVisitanteNombre?: string;
  sets: Sets;
  onSetsChange: (sets: Sets) => void;
}) {
  const conTiebreak = necesitaTiebreak(sets);
  const empatado = tieneSetEmpatado(sets);

  return (
    <fieldset className="flex flex-col gap-3 rounded border border-zinc-200 p-3">
      <legend className="text-sm font-medium text-azul-noche">Partido {numero}</legend>

      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-sm">
          {equipoLocalNombre ?? "Local"} — jugador 1
          <SelectJugador name={`p${numero}_jugador_local_1`} jugadores={jugadoresPropios} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {equipoLocalNombre ?? "Local"} — jugador 2
          <SelectJugador name={`p${numero}_jugador_local_2`} jugadores={jugadoresPropios} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {equipoVisitanteNombre ?? "Visitante"} — jugador 1
          <SelectJugador name={`p${numero}_jugador_visitante_1`} jugadores={jugadoresRivales} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {equipoVisitanteNombre ?? "Visitante"} — jugador 2
          <SelectJugador name={`p${numero}_jugador_visitante_2`} jugadores={jugadoresRivales} />
        </label>
      </div>

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
            <span className="text-zinc-400">-</span>
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
            <span className="text-zinc-400">-</span>
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
              <span className="text-zinc-400">-</span>
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
          Un set no puede terminar empatado. Revisá los games.
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
  const [sets1, setSets1] = useState<Sets>(SETS_VACIOS);
  const [sets2, setSets2] = useState<Sets>(SETS_VACIOS);

  const hayEmpate = tieneSetEmpatado(sets1) || tieneSetEmpatado(sets2);

  return (
    <form
      action={cargarResultado}
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
      />
      <BloquePartido
        numero={2}
        jugadoresPropios={jugadoresPropios}
        jugadoresRivales={jugadoresRivales}
        equipoLocalNombre={equipoLocalNombre}
        equipoVisitanteNombre={equipoVisitanteNombre}
        sets={sets2}
        onSetsChange={setSets2}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={hayEmpate}
          className="rounded bg-naranja px-3 py-1 text-sm font-medium text-azul-noche disabled:opacity-40"
        >
          Cargar resultado
        </button>
        <span className="text-xs text-zinc-500">
          Los sets y los games se calculan solos a partir de los parciales.
        </span>
      </div>
    </form>
  );
}
