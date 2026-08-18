import { createClient } from "@/lib/supabase/server";
import { asignarPosicionFinal } from "./actions";

const POSICIONES = [
  { value: "", label: "— Sin definir —" },
  { value: "campeon", label: "Campeón (1000 pts)" },
  { value: "subcampeon", label: "Subcampeón (700 pts)" },
  { value: "semifinalista", label: "Semifinalista (450 pts)" },
  { value: "tercero", label: "3° (250 pts)" },
  { value: "cuarto", label: "4° (150 pts)" },
  { value: "quinto", label: "5° (100 pts)" },
] as const;

export default async function RankingEquiposAdminPage() {
  const supabase = await createClient();
  const [{ data: equipos }, { data: posiciones }] = await Promise.all([
    supabase.from("equipo").select("id, nombre, categoria:categoria_id (nombre)").order("nombre"),
    supabase.from("posicion_final_equipo").select("equipo_id, posicion"),
  ]);

  const posicionPorEquipo = new Map(
    (posiciones ?? []).map((p) => [p.equipo_id, p.posicion]),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Ranking de equipos — posición final</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Se asigna al terminar la temporada completa (fase regular + playoffs).
          El bonus por rendimiento en la fase regular se calcula solo.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {equipos?.map((equipo) => (
          <form
            key={equipo.id}
            action={asignarPosicionFinal}
            className="flex flex-wrap items-center gap-3 rounded border border-zinc-200 p-3"
          >
            <input type="hidden" name="equipo_id" value={equipo.id} />
            <span className="flex-1">
              {equipo.nombre}{" "}
              <span className="text-sm text-zinc-500">
                ({(equipo.categoria as unknown as { nombre: string } | null)?.nombre})
              </span>
            </span>
            <select
              name="posicion"
              defaultValue={posicionPorEquipo.get(equipo.id) ?? ""}
              className="rounded border border-zinc-300 px-2 py-1"
            >
              {POSICIONES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded bg-naranja px-3 py-1 text-sm font-medium text-azul-noche"
            >
              Guardar
            </button>
          </form>
        ))}
        {!equipos?.length && (
          <p className="text-sm text-zinc-400">Todavía no hay equipos cargados.</p>
        )}
      </div>
    </div>
  );
}
