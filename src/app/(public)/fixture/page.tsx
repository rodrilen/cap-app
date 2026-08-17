import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ESTADO_LABEL, estadoClasses } from "@/lib/brand";

type EquipoRef = { id: string; nombre: string } | null;

type PartidoRow = {
  id: string;
  estado: string;
  sets_local: number | null;
  sets_visitante: number | null;
  fecha_id: string;
  club: { nombre: string } | null;
  equipo_local: EquipoRef;
  equipo_visitante: EquipoRef;
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

  const { data: fechas } = await supabase
    .from("fecha")
    .select("id, numero, fecha_programada, etapa")
    .eq("categoria_id", categoriaSeleccionada.id)
    .order("numero");

  const fechaIds = fechas?.map((f) => f.id) ?? [];

  const { data: partidosData } = fechaIds.length
    ? await supabase
        .from("partido")
        .select(
          "id, estado, sets_local, sets_visitante, fecha_id, club:club_sede_id (nombre), equipo_local:equipo_local_id (id, nombre), equipo_visitante:equipo_visitante_id (id, nombre)",
        )
        .in("fecha_id", fechaIds)
    : { data: [] as PartidoRow[] };

  const partidos = (partidosData ?? []) as unknown as PartidoRow[];

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

      {fechas?.map((fecha) => {
        const partidosFecha = partidos.filter((p) => p.fecha_id === fecha.id);
        return (
          <section key={fecha.id} className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-azul-noche">
              Fecha {fecha.numero}
              <span className="ml-2 text-sm font-normal text-azul-noche/50">
                {new Date(`${fecha.fecha_programada}T00:00:00`).toLocaleDateString(
                  "es-AR",
                  { day: "2-digit", month: "2-digit", year: "numeric" },
                )}
                {fecha.etapa !== "liga" && ` — ${fecha.etapa}`}
              </span>
            </h2>
            <div className="flex flex-col gap-2">
              {partidosFecha.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-azul-noche/10 bg-white p-3 text-sm"
                >
                  <span>
                    <Link href={`/equipos/${p.equipo_local?.id}`} className="hover:underline">
                      {p.equipo_local?.nombre}
                    </Link>{" "}
                    {p.estado === "confirmado" || p.estado === "walkover" ? (
                      <strong>
                        {p.sets_local} - {p.sets_visitante}
                      </strong>
                    ) : (
                      "vs"
                    )}{" "}
                    <Link
                      href={`/equipos/${p.equipo_visitante?.id}`}
                      className="hover:underline"
                    >
                      {p.equipo_visitante?.nombre}
                    </Link>
                  </span>
                  <span className="text-azul-noche/50">{p.club?.nombre}</span>
                  <span className={`rounded px-2 py-0.5 text-xs ${estadoClasses(p.estado)}`}>
                    {ESTADO_LABEL[p.estado] ?? p.estado}
                  </span>
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
