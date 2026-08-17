import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/auth/current-user";
import {
  cargarResultado,
  confirmarResultado,
  disputarResultado,
  marcarNotificacionLeida,
} from "./actions";

type EquipoRef = { nombre: string } | null;

type PartidoRow = {
  id: string;
  estado: string;
  sets_local: number | null;
  sets_visitante: number | null;
  games_local: number | null;
  games_visitante: number | null;
  equipo_local_id: string;
  equipo_visitante_id: string;
  fecha: { numero: number; fecha_programada: string } | null;
  club: EquipoRef;
  equipo_local: EquipoRef;
  equipo_visitante: EquipoRef;
};

export default async function CapitanHomePage() {
  const usuario = await getUsuarioActual();
  if (!usuario) return null;

  const supabase = await createClient();

  const { data: notificaciones } = await supabase
    .from("notificacion")
    .select(
      "id, partido:partido_id (equipo_local:equipo_local_id (nombre), equipo_visitante:equipo_visitante_id (nombre))",
    )
    .eq("usuario_id", usuario.id)
    .eq("leida", false)
    .order("creada_en", { ascending: false });

  const { data: partidosData } = await supabase
    .from("partido")
    .select(
      "id, estado, sets_local, sets_visitante, games_local, games_visitante, equipo_local_id, equipo_visitante_id, fecha:fecha_id (numero, fecha_programada), club:club_sede_id (nombre), equipo_local:equipo_local_id (nombre), equipo_visitante:equipo_visitante_id (nombre)",
    )
    .or(
      `equipo_local_id.eq.${usuario.equipo_id},equipo_visitante_id.eq.${usuario.equipo_id}`,
    );

  // El orden por columna de una tabla referenciada (fecha.numero) no ordena
  // las filas de partido en sí -- solo afecta filas anidadas en relaciones
  // "to-many". Con fecha_id siendo "to-one", hay que ordenar en JS.
  const partidos = (
    (partidosData ?? []) as unknown as PartidoRow[]
  ).sort((a, b) => (a.fecha?.numero ?? 0) - (b.fecha?.numero ?? 0));

  const paraCargar = partidos.filter(
    (p) => p.estado === "programado" && p.equipo_local_id === usuario.equipo_id,
  );
  const paraConfirmar = partidos.filter(
    (p) =>
      p.estado === "pendiente_confirmacion" &&
      p.equipo_visitante_id === usuario.equipo_id,
  );
  const resto = partidos.filter(
    (p) => !paraCargar.includes(p) && !paraConfirmar.includes(p),
  );

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-2xl font-semibold">Mis partidos</h1>

      {!!notificaciones?.length && (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-medium">Notificaciones</h2>
          {notificaciones.map((n) => {
            const partido = n.partido as unknown as {
              equipo_local: EquipoRef;
              equipo_visitante: EquipoRef;
            } | null;
            return (
              <form
                key={n.id}
                action={marcarNotificacionLeida}
                className="flex items-center justify-between gap-3 rounded border border-amber-200 bg-amber-50 p-3 text-sm"
              >
                <input type="hidden" name="id" value={n.id} />
                <span>
                  {partido?.equipo_local?.nombre} vs {partido?.equipo_visitante?.nombre}:
                  resultado cargado, esperando tu confirmación.
                </span>
                <button type="submit" className="text-amber-700 hover:underline">
                  Marcar como leída
                </button>
              </form>
            );
          })}
        </section>
      )}

      {!!paraCargar.length && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">Para cargar (jugás de local)</h2>
          {paraCargar.map((p) => (
            <form
              key={p.id}
              action={cargarResultado}
              className="flex flex-wrap items-end gap-2 rounded border border-zinc-200 p-3"
            >
              <input type="hidden" name="partido_id" value={p.id} />
              <span className="w-full text-sm text-zinc-600">
                Fecha {p.fecha?.numero} — {p.equipo_local?.nombre} vs{" "}
                {p.equipo_visitante?.nombre} ({p.club?.nombre})
              </span>
              <label className="flex flex-col gap-1 text-sm">
                Sets local
                <input
                  type="number"
                  name="sets_local"
                  min={0}
                  required
                  className="w-20 rounded border border-zinc-300 px-2 py-1"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Sets visitante
                <input
                  type="number"
                  name="sets_visitante"
                  min={0}
                  required
                  className="w-20 rounded border border-zinc-300 px-2 py-1"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Games local
                <input
                  type="number"
                  name="games_local"
                  min={0}
                  className="w-20 rounded border border-zinc-300 px-2 py-1"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Games visitante
                <input
                  type="number"
                  name="games_visitante"
                  min={0}
                  className="w-20 rounded border border-zinc-300 px-2 py-1"
                />
              </label>
              <button type="submit" className="rounded bg-naranja px-3 py-1 text-sm font-medium text-azul-noche">
                Cargar resultado
              </button>
            </form>
          ))}
        </section>
      )}

      {!!paraConfirmar.length && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">Para confirmar (jugás de visitante)</h2>
          {paraConfirmar.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center gap-3 rounded border border-zinc-200 p-3"
            >
              <span className="text-sm text-zinc-600">
                Fecha {p.fecha?.numero} — {p.equipo_local?.nombre} {p.sets_local} -{" "}
                {p.sets_visitante} {p.equipo_visitante?.nombre}
              </span>
              <form action={confirmarResultado}>
                <input type="hidden" name="partido_id" value={p.id} />
                <button
                  type="submit"
                  className="rounded bg-naranja px-3 py-1 text-sm font-medium text-azul-noche"
                >
                  Confirmar
                </button>
              </form>
              <form action={disputarResultado}>
                <input type="hidden" name="partido_id" value={p.id} />
                <button
                  type="submit"
                  className="rounded border border-red-300 px-3 py-1 text-sm text-red-600"
                >
                  Disputar
                </button>
              </form>
            </div>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Historial</h2>
        {resto.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded border border-zinc-200 p-3 text-sm text-zinc-600"
          >
            <span>
              Fecha {p.fecha?.numero} — {p.equipo_local?.nombre}{" "}
              {p.sets_local ?? "-"} - {p.sets_visitante ?? "-"} {p.equipo_visitante?.nombre}
            </span>
            <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs">{p.estado}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
