import { createClient } from "@/lib/supabase/server";
import { crearPartido, actualizarPartido, borrarPartido } from "./actions";

const ESTADOS = [
  "programado",
  "pendiente_confirmacion",
  "confirmado",
  "disputado",
  "walkover",
] as const;

type NombreRef = { nombre: string } | null;

type PartidoRow = {
  id: string;
  estado: string;
  sets_local: number | null;
  sets_visitante: number | null;
  games_local: number | null;
  games_visitante: number | null;
  fecha: { numero: number } | null;
  club: NombreRef;
  equipo_local: NombreRef;
  equipo_visitante: NombreRef;
};

export default async function AdminPartidosPage() {
  const supabase = await createClient();

  const [{ data: partidosData }, { data: fechas }, { data: equipos }, { data: clubes }] =
    await Promise.all([
      supabase
        .from("partido")
        .select(
          "id, estado, sets_local, sets_visitante, games_local, games_visitante, fecha:fecha_id (numero), club:club_sede_id (nombre), equipo_local:equipo_local_id (nombre), equipo_visitante:equipo_visitante_id (nombre)",
        ),
      supabase.from("fecha").select("id, numero").order("numero"),
      supabase.from("equipo").select("id, nombre").order("nombre"),
      supabase.from("club").select("id, nombre").order("nombre"),
    ]);

  // El orden por columna de una tabla referenciada (fecha.numero) no ordena
  // las filas de partido en sí -- solo afecta filas anidadas en relaciones
  // "to-many". Con fecha_id siendo "to-one", hay que ordenar en JS.
  const partidos = (
    (partidosData ?? []) as unknown as (PartidoRow & { id: string })[]
  ).sort((a, b) => (a.fecha?.numero ?? 0) - (b.fecha?.numero ?? 0));

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Partidos</h1>
      <p className="text-sm text-zinc-600">
        Cambiar el estado acá pisa lo que haya cargado el capitán — usalo para
        forzar una confirmación, resolver una disputa o marcar un walkover.
      </p>

      <div className="flex flex-col gap-3">
        {partidos.map((p) => (
          <form
            key={p.id}
            action={actualizarPartido}
            className="flex flex-wrap items-center gap-2 rounded border border-zinc-200 p-3"
          >
            <input type="hidden" name="id" value={p.id} />
            <span className="w-full text-sm text-zinc-600 sm:w-auto">
              Fecha {p.fecha?.numero} — {p.equipo_local?.nombre} vs{" "}
              {p.equipo_visitante?.nombre} ({p.club?.nombre})
            </span>
            <input
              type="number"
              name="sets_local"
              defaultValue={p.sets_local ?? ""}
              placeholder="Sets L"
              className="w-20 rounded border border-zinc-300 px-2 py-1"
            />
            <input
              type="number"
              name="sets_visitante"
              defaultValue={p.sets_visitante ?? ""}
              placeholder="Sets V"
              className="w-20 rounded border border-zinc-300 px-2 py-1"
            />
            <input
              type="number"
              name="games_local"
              defaultValue={p.games_local ?? ""}
              placeholder="Games L"
              className="w-24 rounded border border-zinc-300 px-2 py-1"
            />
            <input
              type="number"
              name="games_visitante"
              defaultValue={p.games_visitante ?? ""}
              placeholder="Games V"
              className="w-24 rounded border border-zinc-300 px-2 py-1"
            />
            <select
              name="estado"
              defaultValue={p.estado}
              className="rounded border border-zinc-300 px-2 py-1"
            >
              {ESTADOS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded bg-naranja px-3 py-1 text-sm font-medium text-azul-noche">
              Guardar
            </button>
            <button
              type="submit"
              formAction={borrarPartido}
              className="rounded border border-red-300 px-3 py-1 text-sm text-red-600"
            >
              Borrar
            </button>
          </form>
        ))}
      </div>

      <form
        action={crearPartido}
        className="flex flex-wrap items-end gap-2 rounded border border-dashed border-zinc-300 p-3"
      >
        <label className="flex flex-col gap-1 text-sm">
          Fecha
          <select name="fecha_id" required className="rounded border border-zinc-300 px-2 py-1">
            {fechas?.map((f) => (
              <option key={f.id} value={f.id}>
                Fecha {f.numero}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Local
          <select
            name="equipo_local_id"
            required
            className="rounded border border-zinc-300 px-2 py-1"
          >
            {equipos?.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Visitante
          <select
            name="equipo_visitante_id"
            required
            className="rounded border border-zinc-300 px-2 py-1"
          >
            {equipos?.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Club sede
          <select
            name="club_sede_id"
            required
            className="rounded border border-zinc-300 px-2 py-1"
          >
            {clubes?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded bg-naranja px-3 py-1 text-sm font-medium text-azul-noche">
          Agregar partido
        </button>
      </form>
    </div>
  );
}
