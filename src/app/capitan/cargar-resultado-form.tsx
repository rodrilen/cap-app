import { cargarResultado } from "./actions";

type Jugador = { id: string; nombre: string };

const RESULTADOS = [
  { value: "2-0", label: "2 - 0 (sets corridos)" },
  { value: "2-1", label: "2 - 1 (súper tiebreak)" },
  { value: "1-2", label: "1 - 2 (súper tiebreak)" },
  { value: "0-2", label: "0 - 2 (sets corridos)" },
];

function SelectJugador({
  name,
  jugadores,
}: {
  name: string;
  jugadores: Jugador[];
}) {
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

function BloquePartido({
  numero,
  jugadoresPropios,
  jugadoresRivales,
  equipoLocalNombre,
  equipoVisitanteNombre,
}: {
  numero: 1 | 2;
  jugadoresPropios: Jugador[];
  jugadoresRivales: Jugador[];
  equipoLocalNombre?: string;
  equipoVisitanteNombre?: string;
}) {
  return (
    <fieldset className="flex flex-col gap-2 rounded border border-zinc-200 p-3">
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
        <label className="flex flex-col gap-1 text-sm">
          Resultado
          <select
            name={`p${numero}_resultado`}
            required
            className="rounded border border-zinc-300 px-2 py-1"
          >
            <option value="">Elegir…</option>
            {RESULTADOS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
      </div>
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
      />
      <BloquePartido
        numero={2}
        jugadoresPropios={jugadoresPropios}
        jugadoresRivales={jugadoresRivales}
        equipoLocalNombre={equipoLocalNombre}
        equipoVisitanteNombre={equipoVisitanteNombre}
      />

      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-sm">
          Games local (total del encuentro)
          <input
            type="number"
            name="games_local"
            min={0}
            className="w-24 rounded border border-zinc-300 px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Games visitante (total del encuentro)
          <input
            type="number"
            name="games_visitante"
            min={0}
            className="w-24 rounded border border-zinc-300 px-2 py-1"
          />
        </label>
        <button
          type="submit"
          className="rounded bg-naranja px-3 py-1 text-sm font-medium text-azul-noche"
        >
          Cargar resultado
        </button>
      </div>
    </form>
  );
}
