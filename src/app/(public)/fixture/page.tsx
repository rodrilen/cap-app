import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ESTADO_LABEL, estadoClasses } from "@/lib/brand";
import { MOSTRAR_PLANTELES } from "@/lib/secciones";
import { linkMapa } from "@/lib/mapa";

type EquipoRef = { id: string; nombre: string } | null;

// El encabezado y cada partido comparten este reparto de columnas, que es lo
// que mantiene la cancha y el estado alineados de fila a fila. Antes era un
// flex con justify-between y cada fila caía en un lugar distinto según lo
// largo que fuera el nombre de los equipos.
//
// En el teléfono no hay columnas: se apila todo y cada dato lleva su etiqueta.
const COLUMNAS = "grid grid-cols-1 gap-x-4 sm:grid-cols-[1fr_11rem_7.5rem]";

// Con las fichas de equipo ocultas el nombre no puede ser un link: llevaría a
// un 404. Ver src/lib/secciones.ts.
function NombreEquipo({ equipo }: { equipo: EquipoRef }) {
  if (!equipo) return null;
  if (!MOSTRAR_PLANTELES) return <>{equipo.nombre}</>;
  return (
    <Link href={`/equipos/${equipo.id}`} className="hover:underline">
      {equipo.nombre}
    </Link>
  );
}

type PartidoRow = {
  id: string;
  estado: string;
  sets_local: number | null;
  sets_visitante: number | null;
  fecha_id: string;
  club: { nombre: string; sede: string | null; direccion: string | null } | null;
  equipo_local: EquipoRef;
  equipo_visitante: EquipoRef;
};

type IndividualRow = {
  partido_id: string;
  numero: number;
  set1_local: number | null;
  set1_visitante: number | null;
  set2_local: number | null;
  set2_visitante: number | null;
  tb_local: number | null;
  tb_visitante: number | null;
};

export default async function FixturePage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const supabase = await createClient();

  const { data: categorias } = await supabase
    .from("categoria")
    .select("id, nombre")
    .eq("activa", true)
    .order("nombre");

  const categoriaSeleccionada =
    categorias?.find((c) => c.id === categoria) ?? categorias?.[0] ?? null;

  if (!categoriaSeleccionada) {
    return <p className="text-zinc-600">Todavía no hay categorías activas.</p>;
  }

  // Fechas y partidos vienen juntos en una sola consulta. Antes eran dos
  // encadenadas (traer las fechas, sacar sus ids, pedir los partidos), y cada
  // ida y vuelta a Supabase cuesta ~300 ms desde la función de Vercel.
  const { data: fechas } = await supabase
    .from("fecha")
    .select(
      "id, numero, fecha_programada, etapa, partido:partido (id, estado, sets_local, sets_visitante, fecha_id, club:club_sede_id (nombre, sede, direccion), equipo_local:equipo_local_id (id, nombre), equipo_visitante:equipo_visitante_id (id, nombre))",
    )
    .eq("categoria_id", categoriaSeleccionada.id)
    .order("numero");

  const partidos = (fechas ?? []).flatMap(
    (f) => (f.partido ?? []) as unknown as PartidoRow[],
  );

  // El "2 - 0" del encuentro cuenta partidos individuales ganados, no games:
  // sin los parciales no se puede saber si fue una paliza o se definió en el
  // último punto. Sólo para los que ya están cerrados.
  const idsCerrados = partidos
    .filter((p) => p.estado === "confirmado" || p.estado === "walkover")
    .map((p) => p.id);

  const { data: individualesData } = idsCerrados.length
    ? await supabase
        .from("partido_individual")
        .select(
          "partido_id, numero, set1_local, set1_visitante, set2_local, set2_visitante, tb_local, tb_visitante",
        )
        .in("partido_id", idsCerrados)
        .order("numero")
    : { data: [] };

  const parcialesPorPartido = new Map<string, string[]>();
  for (const ind of (individualesData ?? []) as IndividualRow[]) {
    const marcador = [
      [ind.set1_local, ind.set1_visitante],
      [ind.set2_local, ind.set2_visitante],
      [ind.tb_local, ind.tb_visitante],
    ]
      .filter(([l, v]) => l !== null && v !== null)
      .map(([l, v]) => `${l}-${v}`)
      .join(" ");

    if (!marcador) continue;
    parcialesPorPartido.set(ind.partido_id, [
      ...(parcialesPorPartido.get(ind.partido_id) ?? []),
      marcador,
    ]);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black uppercase tracking-tight text-azul-noche">
          Fixture y resultados
        </h1>
        {categorias && categorias.length > 1 && (
          <div className="flex gap-2 text-sm">
            {categorias.map((c) => (
              <Link
                key={c.id}
                href={`/fixture?categoria=${c.id}`}
                className={`rounded px-3 py-1 font-medium ${
                  c.id === categoriaSeleccionada.id
                    ? "bg-naranja text-azul-noche"
                    : "border border-azul-noche/20 text-azul-noche/70"
                }`}
              >
                {c.nombre}
              </Link>
            ))}
          </div>
        )}
      </div>

      <p className="-mt-4 text-sm text-azul-noche/70">
        En cada cruce, el primero es el <strong className="font-semibold">local</strong>:
        es el que pone la cancha y el que carga el resultado. La cancha puede no
        ser la suya — la fecha 1 se juega entera en Punto de Oro.
      </p>

      {fechas?.map((fecha) => {
        const partidosFecha = partidos.filter((p) => p.fecha_id === fecha.id);
        return (
          <section key={fecha.id} className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-azul-noche">
              Fecha {fecha.numero}
              <span className="ml-2 text-sm font-normal text-azul-noche/70">
                {new Date(`${fecha.fecha_programada}T00:00:00`).toLocaleDateString(
                  "es-AR",
                  { day: "2-digit", month: "2-digit", year: "numeric" },
                )}
                {fecha.etapa !== "liga" && ` — ${fecha.etapa}`}
              </span>
            </h2>

            {/* Encabezado de columnas, sólo de tablet para arriba: en el
                teléfono cada partido se apila y lleva su propia etiqueta. */}
            {!!partidosFecha.length && (
              <div className={`${COLUMNAS} hidden px-3 text-xs font-medium uppercase tracking-wide text-azul-noche/40 sm:grid`}>
                <span>Local vs Visitante</span>
                <span>Dónde se juega</span>
                <span>Estado</span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {partidosFecha.map((p) => (
                <div
                  key={p.id}
                  className={`${COLUMNAS} gap-1 rounded border border-azul-noche/10 bg-white p-3 text-sm sm:items-center`}
                >
                  <span>
                    <NombreEquipo equipo={p.equipo_local} />{" "}
                    {p.estado === "confirmado" || p.estado === "walkover" ? (
                      <strong>
                        {p.sets_local} - {p.sets_visitante}
                      </strong>
                    ) : (
                      "vs"
                    )}{" "}
                    <NombreEquipo equipo={p.equipo_visitante} />
                  </span>

                  {/* La cancha, no el club del local: Pintados juega en Punta de
                      Oro y los tres equipos de Padel Generativo en Life Padel. */}
                  <span className="text-azul-noche/70">
                    <span className="sm:hidden">Se juega en: </span>
                    {(() => {
                      const cancha = p.club?.sede || p.club?.nombre || "";
                      const mapa = linkMapa(cancha, p.club?.direccion ?? null);
                      return mapa ? (
                        <a
                          href={mapa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline decoration-azul-noche/20 underline-offset-2 hover:text-naranja hover:decoration-naranja"
                        >
                          {cancha}
                        </a>
                      ) : (
                        cancha
                      );
                    })()}
                  </span>

                  <span
                    className={`w-fit rounded px-2 py-0.5 text-xs ${estadoClasses(p.estado)}`}
                  >
                    {ESTADO_LABEL[p.estado] ?? p.estado}
                  </span>

                  {!!parcialesPorPartido.get(p.id)?.length && (
                    <span className="text-xs text-azul-noche/70 sm:col-span-3">
                      {parcialesPorPartido.get(p.id)!.join("  ·  ")}
                    </span>
                  )}
                </div>
              ))}
              {!partidosFecha.length && (
                <p className="text-sm text-azul-noche/40">Sin partidos cargados.</p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
