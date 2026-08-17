import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ESTADO_LABEL, colorCategoria, estadoClasses } from "@/lib/brand";

type EquipoRef = { id: string; nombre: string } | null;

type PartidoRow = {
  id: string;
  estado: string;
  sets_local: number | null;
  sets_visitante: number | null;
  fecha: { numero: number } | null;
  club: { nombre: string } | null;
  equipo_local: EquipoRef;
  equipo_visitante: EquipoRef;
};

export default async function FichaEquipoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: equipo } = await supabase
    .from("equipo")
    .select(
      "id, nombre, color, categoria:categoria_id (nombre), club_sede:club_sede_id (nombre, direccion)",
    )
    .eq("id", id)
    .single();

  if (!equipo) notFound();

  const { data: jugadores } = await supabase
    .from("jugador")
    .select("id, nombre")
    .eq("equipo_id", id)
    .order("nombre");

  const { data: historialData } = await supabase
    .from("partido")
    .select(
      "id, estado, sets_local, sets_visitante, fecha:fecha_id (numero), club:club_sede_id (nombre), equipo_local:equipo_local_id (id, nombre), equipo_visitante:equipo_visitante_id (id, nombre)",
    )
    .or(`equipo_local_id.eq.${id},equipo_visitante_id.eq.${id}`);

  // El orden por columna de una tabla referenciada (fecha.numero) no ordena
  // las filas de partido en sí -- solo afecta filas anidadas en relaciones
  // "to-many". Con fecha_id siendo "to-one", hay que ordenar en JS.
  const historial = (
    (historialData ?? []) as unknown as PartidoRow[]
  ).sort((a, b) => (a.fecha?.numero ?? 0) - (b.fecha?.numero ?? 0));
  const categoriaNombre = (
    equipo.categoria as unknown as { nombre: string } | null
  )?.nombre;
  const clubSede = equipo.club_sede as unknown as {
    nombre: string;
    direccion: string | null;
  } | null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-black uppercase tracking-tight text-azul-noche">
          {equipo.nombre}
        </h1>
        {categoriaNombre && (
          <span
            className={`rounded px-2 py-0.5 text-xs font-medium ${colorCategoria(categoriaNombre)}`}
          >
            {categoriaNombre}
          </span>
        )}
      </div>
      <p className="-mt-6 text-sm text-azul-noche/60">
        Sede: {clubSede?.nombre}
        {clubSede?.direccion && ` (${clubSede.direccion})`}
      </p>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-azul-noche">Plantel</h2>
        {jugadores?.length ? (
          <ul className="flex flex-col gap-1 text-sm">
            {jugadores.map((j) => (
              <li key={j.id}>{j.nombre}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-azul-noche/40">Sin jugadores cargados.</p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-azul-noche">Historial</h2>
        <div className="flex flex-col gap-2">
          {historial.map((p) => {
            const esLocal = p.equipo_local?.id === id;
            const rival = esLocal ? p.equipo_visitante : p.equipo_local;
            return (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-azul-noche/10 bg-white p-3 text-sm"
              >
                <span>
                  Fecha {p.fecha?.numero} — {esLocal ? "vs" : "en"}{" "}
                  <Link href={`/equipos/${rival?.id}`} className="hover:underline">
                    {rival?.nombre}
                  </Link>{" "}
                  ({p.club?.nombre})
                </span>
                <span>
                  {p.estado === "confirmado" || p.estado === "walkover" ? (
                    <strong>
                      {p.sets_local} - {p.sets_visitante}
                    </strong>
                  ) : (
                    <span className={`rounded px-2 py-0.5 text-xs ${estadoClasses(p.estado)}`}>
                      {ESTADO_LABEL[p.estado] ?? p.estado}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
          {!historial.length && (
            <p className="text-sm text-azul-noche/40">Todavía no jugó ningún partido.</p>
          )}
        </div>
      </section>
    </div>
  );
}
