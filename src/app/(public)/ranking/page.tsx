import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type FilaJugador = {
  jugador_id: string;
  jugador_nombre: string;
  equipo_id: string;
  equipo_nombre: string;
  partidos_jugados: number;
  puntos_totales: number;
};

type FilaEquipo = {
  equipo_id: string;
  equipo_nombre: string;
  posicion_final: string | null;
  puntos_posicion: number;
  puntos_bonus: number;
  puntos_totales: number;
};

const POSICION_LABEL: Record<string, string> = {
  campeon: "Campeón",
  subcampeon: "Subcampeón",
  semifinalista: "Semifinalista",
  tercero: "3°",
  cuarto: "4°",
  quinto: "5°",
};

export default async function RankingPage({
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

  const [{ data: jugadoresData }, { data: equiposData }] = await Promise.all([
    supabase
      .from("vista_ranking_jugadores")
      .select("jugador_id, jugador_nombre, equipo_id, equipo_nombre, partidos_jugados, puntos_totales")
      .eq("categoria_id", categoriaSeleccionada.id)
      .order("puntos_totales", { ascending: false }),
    supabase
      .from("vista_ranking_equipos")
      .select("equipo_id, equipo_nombre, posicion_final, puntos_posicion, puntos_bonus, puntos_totales")
      .eq("categoria_id", categoriaSeleccionada.id)
      .order("puntos_totales", { ascending: false }),
  ]);

  const jugadores = (jugadoresData ?? []) as FilaJugador[];
  const equipos = (equiposData ?? []) as FilaEquipo[];

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black uppercase tracking-tight text-azul-noche">
          Rankings
        </h1>
        {categorias && categorias.length > 1 && (
          <div className="flex gap-2 text-sm">
            {categorias.map((c) => (
              <Link
                key={c.id}
                href={`/ranking?categoria=${c.id}`}
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

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-azul-noche">Ranking de jugadores</h2>
        <div className="overflow-x-auto rounded border border-azul-noche/10">
          <table className="w-full min-w-[420px] border-collapse text-sm">
            <thead>
              <tr className="bg-azul-noche text-left text-hueso">
                <th className="py-2 pr-2 pl-3">#</th>
                <th className="py-2 pr-2">Jugador</th>
                <th className="py-2 pr-2">Equipo</th>
                <th className="py-2 pr-2 text-right">Partidos</th>
                <th className="py-2 pr-3 text-right">Puntos</th>
              </tr>
            </thead>
            <tbody>
              {jugadores.map((j, i) => (
                <tr key={j.jugador_id} className="border-b border-azul-noche/10 bg-white odd:bg-hueso/60">
                  <td className="py-2 pr-2 pl-3 text-azul-noche/50">{i + 1}</td>
                  <td className="py-2 pr-2">{j.jugador_nombre}</td>
                  <td className="py-2 pr-2">
                    <Link href={`/equipos/${j.equipo_id}`} className="hover:underline">
                      {j.equipo_nombre}
                    </Link>
                  </td>
                  <td className="py-2 pr-2 text-right">{j.partidos_jugados}</td>
                  <td className="py-2 pr-3 text-right font-semibold">{j.puntos_totales}</td>
                </tr>
              ))}
              {!jugadores.length && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-azul-noche/40">
                    Todavía no hay partidos confirmados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-azul-noche">Ranking de equipos</h2>
        <p className="text-sm text-azul-noche/60">
          El puntaje por posición final se asigna al terminar la temporada completa.
        </p>
        <div className="overflow-x-auto rounded border border-azul-noche/10">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead>
              <tr className="bg-azul-noche text-left text-hueso">
                <th className="py-2 pr-2 pl-3">#</th>
                <th className="py-2 pr-2">Equipo</th>
                <th className="py-2 pr-2">Posición final</th>
                <th className="py-2 pr-2 text-right">Bonus fase regular</th>
                <th className="py-2 pr-3 text-right">Puntos</th>
              </tr>
            </thead>
            <tbody>
              {equipos.map((e, i) => (
                <tr key={e.equipo_id} className="border-b border-azul-noche/10 bg-white odd:bg-hueso/60">
                  <td className="py-2 pr-2 pl-3 text-azul-noche/50">{i + 1}</td>
                  <td className="py-2 pr-2">
                    <Link href={`/equipos/${e.equipo_id}`} className="hover:underline">
                      {e.equipo_nombre}
                    </Link>
                  </td>
                  <td className="py-2 pr-2">
                    {e.posicion_final ? POSICION_LABEL[e.posicion_final] ?? e.posicion_final : "—"}
                  </td>
                  <td className="py-2 pr-2 text-right">{e.puntos_bonus}</td>
                  <td className="py-2 pr-3 text-right font-semibold">{e.puntos_totales}</td>
                </tr>
              ))}
              {!equipos.length && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-azul-noche/40">
                    Todavía no hay equipos en esta categoría.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
