import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type FilaTabla = {
  equipo_id: string;
  equipo_nombre: string;
  partidos_jugados: number;
  partidos_ganados: number;
  partidos_empatados: number;
  partidos_perdidos: number;
  puntos: number;
  diferencia_sets: number;
  diferencia_games: number;
};

export default async function TablaPage({
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

  const { data: tablaData } = await supabase
    .from("vista_tabla_posiciones")
    .select(
      "equipo_id, equipo_nombre, partidos_jugados, partidos_ganados, partidos_empatados, partidos_perdidos, puntos, diferencia_sets, diferencia_games",
    )
    .eq("categoria_id", categoriaSeleccionada.id)
    .order("puntos", { ascending: false })
    .order("partidos_ganados", { ascending: false })
    .order("diferencia_sets", { ascending: false })
    .order("diferencia_games", { ascending: false });

  const tabla = (tablaData ?? []) as FilaTabla[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black uppercase tracking-tight text-azul-noche">
          Tabla de posiciones
        </h1>
        {categorias && categorias.length > 1 && (
          <div className="flex gap-2 text-sm">
            {categorias.map((c) => (
              <Link
                key={c.id}
                href={`/tabla?categoria=${c.id}`}
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

      <div className="overflow-x-auto rounded border border-azul-noche/10">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="bg-azul-noche text-left text-hueso">
              <th className="py-2 pr-2 pl-3">#</th>
              <th className="py-2 pr-2">Equipo</th>
              <th className="py-2 pr-2 text-right">PJ</th>
              <th className="py-2 pr-2 text-right">PG</th>
              <th className="py-2 pr-2 text-right">PE</th>
              <th className="py-2 pr-2 text-right">PP</th>
              <th className="py-2 pr-2 text-right">Dif. sets</th>
              <th className="py-2 pr-2 text-right">Dif. games</th>
              <th className="py-2 pr-3 text-right">Pts</th>
            </tr>
          </thead>
          <tbody>
            {tabla.map((fila, i) => (
              <tr
                key={fila.equipo_id}
                className="border-b border-azul-noche/10 bg-white odd:bg-hueso/60"
              >
                <td className="py-2 pr-2 pl-3 text-azul-noche/50">{i + 1}</td>
                <td className="py-2 pr-2">
                  <Link href={`/equipos/${fila.equipo_id}`} className="hover:underline">
                    {fila.equipo_nombre}
                  </Link>
                </td>
                <td className="py-2 pr-2 text-right">{fila.partidos_jugados}</td>
                <td className="py-2 pr-2 text-right">{fila.partidos_ganados}</td>
                <td className="py-2 pr-2 text-right">{fila.partidos_empatados}</td>
                <td className="py-2 pr-2 text-right">{fila.partidos_perdidos}</td>
                <td className="py-2 pr-2 text-right">{fila.diferencia_sets}</td>
                <td className="py-2 pr-2 text-right">{fila.diferencia_games}</td>
                <td className="py-2 pr-3 text-right font-semibold">{fila.puntos}</td>
              </tr>
            ))}
            {!tabla.length && (
              <tr>
                <td colSpan={9} className="py-4 text-center text-azul-noche/40">
                  Todavía no hay partidos confirmados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
