import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/auth/current-user";
import { confirmarResultado, disputarResultado, marcarNotificacionLeida } from "./actions";
import { CargarResultadoForm } from "./cargar-resultado-form";
import { linkWhatsapp } from "@/lib/contacto";

type EquipoRef = { nombre: string } | null;

type IndividualRow = {
  partido_id: string;
  numero: number;
  sets_local: number;
  sets_visitante: number;
  set1_local: number | null;
  set1_visitante: number | null;
  set2_local: number | null;
  set2_visitante: number | null;
  tb_local: number | null;
  tb_visitante: number | null;
  local_1: EquipoRef;
  local_2: EquipoRef;
  visitante_1: EquipoRef;
  visitante_2: EquipoRef;
};

// Las filas cargadas antes de que existieran los parciales sólo tienen los
// sets; para esas se muestra el agregado como antes.
function marcador(ind: IndividualRow) {
  const parciales = [
    [ind.set1_local, ind.set1_visitante],
    [ind.set2_local, ind.set2_visitante],
    [ind.tb_local, ind.tb_visitante],
  ].filter(([l, v]) => l !== null && v !== null);

  if (!parciales.length) return `${ind.sets_local} - ${ind.sets_visitante}`;
  return parciales.map(([l, v]) => `${l}-${v}`).join("  ");
}

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

// El visitante confirma a ciegas si solo ve los sets: los games son el cuarto
// criterio de desempate de la tabla, así que tienen que estar a la vista antes
// de apretar Confirmar.
function LineaResultado({ p }: { p: PartidoRow }) {
  return (
    <span>
      Fecha {p.fecha?.numero} — {p.equipo_local?.nombre} {p.sets_local ?? "-"} -{" "}
      {p.sets_visitante ?? "-"} {p.equipo_visitante?.nombre}
      {p.games_local !== null && p.games_visitante !== null && (
        <span className="text-zinc-500">
          {" "}
          · {p.games_local} - {p.games_visitante} games
        </span>
      )}
    </span>
  );
}

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

  // Para confirmar con criterio (o para disputar) hace falta ver qué pareja
  // jugó cada partido y cómo salió, no sólo el agregado del encuentro.
  const { data: individualesData } = paraConfirmar.length
    ? await supabase
        .from("partido_individual")
        .select(
          "partido_id, numero, sets_local, sets_visitante, set1_local, set1_visitante, set2_local, set2_visitante, tb_local, tb_visitante, local_1:jugador_local_1_id (nombre), local_2:jugador_local_2_id (nombre), visitante_1:jugador_visitante_1_id (nombre), visitante_2:jugador_visitante_2_id (nombre)",
        )
        .in("partido_id", paraConfirmar.map((p) => p.id))
        .order("numero")
    : { data: [] };

  const individualesPorPartido = new Map<string, IndividualRow[]>();
  for (const ind of (individualesData ?? []) as unknown as IndividualRow[]) {
    const lista = individualesPorPartido.get(ind.partido_id) ?? [];
    lista.push(ind);
    individualesPorPartido.set(ind.partido_id, lista);
  }

  const equiposRivalesIds = [...new Set(paraCargar.map((p) => p.equipo_visitante_id))];
  const [{ data: jugadoresPropios }, { data: jugadoresRivalesData }] = await Promise.all([
    supabase
      .from("jugador")
      .select("id, nombre")
      .eq("equipo_id", usuario.equipo_id)
      .order("nombre"),
    equiposRivalesIds.length
      ? supabase
          .from("jugador")
          .select("id, nombre, equipo_id")
          .in("equipo_id", equiposRivalesIds)
          .order("nombre")
      : Promise.resolve({ data: [] as { id: string; nombre: string; equipo_id: string }[] }),
  ]);

  const jugadoresRivalesPorEquipo = new Map<string, { id: string; nombre: string }[]>();
  for (const j of jugadoresRivalesData ?? []) {
    const lista = jugadoresRivalesPorEquipo.get(j.equipo_id) ?? [];
    lista.push({ id: j.id, nombre: j.nombre });
    jugadoresRivalesPorEquipo.set(j.equipo_id, lista);
  }

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
          <p className="text-sm text-azul-noche/60">
            Cada encuentro se juega en 2 partidos, cada uno por una pareja distinta.
          </p>
          {paraCargar.map((p) => (
            <CargarResultadoForm
              key={p.id}
              partidoId={p.id}
              encabezado={`Fecha ${p.fecha?.numero} — ${p.equipo_local?.nombre} vs ${p.equipo_visitante?.nombre} (${p.club?.nombre})`}
              jugadoresPropios={jugadoresPropios ?? []}
              jugadoresRivales={jugadoresRivalesPorEquipo.get(p.equipo_visitante_id) ?? []}
              equipoLocalNombre={p.equipo_local?.nombre}
              equipoVisitanteNombre={p.equipo_visitante?.nombre}
            />
          ))}
        </section>
      )}

      {!!paraConfirmar.length && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">Para confirmar (jugás de visitante)</h2>
          {paraConfirmar.map((p) => (
            <div key={p.id} className="flex flex-col gap-3 rounded border border-zinc-200 p-3">
              <span className="text-sm text-zinc-600">
                <LineaResultado p={p} />
              </span>

              {!!individualesPorPartido.get(p.id)?.length && (
                <ul className="flex flex-col gap-1 text-sm text-zinc-500">
                  {individualesPorPartido.get(p.id)!.map((ind) => (
                    <li key={ind.numero}>
                      <span className="text-zinc-400">Partido {ind.numero}:</span>{" "}
                      {ind.local_1?.nombre} / {ind.local_2?.nombre}{" "}
                      <strong className="text-zinc-700">{marcador(ind)}</strong>{" "}
                      {ind.visitante_1?.nombre} / {ind.visitante_2?.nombre}
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex flex-wrap items-center gap-3">
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
              <span className="text-xs text-zinc-500">
                Al disputar te abrimos WhatsApp para que nos cuentes qué pasó.
              </span>
              </div>
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
              <LineaResultado p={p} />
            </span>
            <span className="flex items-center gap-3">
              <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs">{p.estado}</span>
              {p.estado === "disputado" && (
                <a
                  href={linkWhatsapp(
                    `Hola, quiero contarles sobre la disputa del partido Fecha ${p.fecha?.numero} — ${p.equipo_local?.nombre} vs ${p.equipo_visitante?.nombre}: `,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-azul-noche/60 underline hover:text-naranja"
                >
                  Avisar por WhatsApp
                </a>
              )}
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}
