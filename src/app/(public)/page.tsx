import Link from "next/link";
import { MOSTRAR_CLUBES, SECCIONES_COMPLETAS } from "@/lib/secciones";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col gap-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-azul-noche">
          CAP
        </h1>
        <p className="mt-2 text-azul-noche/70">
          {SECCIONES_COMPLETAS
            ? "Fixture, resultados y tabla de posiciones del Circuito Abierto de Pádel."
            : "Fixture del Circuito Abierto de Pádel: las fechas y los cruces de la temporada 2026."}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/fixture"
          className="rounded border border-azul-noche/10 bg-white p-4 transition-colors hover:border-naranja"
        >
          <h2 className="font-semibold text-azul-noche">
            {SECCIONES_COMPLETAS ? "Fixture y resultados" : "Fixture"}
          </h2>
          <p className="mt-1 text-sm text-azul-noche/70">
            {SECCIONES_COMPLETAS
              ? "Partidos por fecha, con el club sede de cada uno."
              : "Todas las fechas y los cruces, por categoría."}
          </p>
        </Link>
        {SECCIONES_COMPLETAS && (
          <>
            <Link
              href="/tabla"
              className="rounded border border-azul-noche/10 bg-white p-4 transition-colors hover:border-naranja"
            >
              <h2 className="font-semibold text-azul-noche">
                Tabla de posiciones
              </h2>
              <p className="mt-1 text-sm text-azul-noche/70">
                Se actualiza sola con cada resultado confirmado.
              </p>
            </Link>
            <Link
              href="/ranking"
              className="rounded border border-azul-noche/10 bg-white p-4 transition-colors hover:border-naranja"
            >
              <h2 className="font-semibold text-azul-noche">Rankings</h2>
              <p className="mt-1 text-sm text-azul-noche/70">
                Puntos por jugador y ranking general de equipos.
              </p>
            </Link>
          </>
        )}
        {MOSTRAR_CLUBES && (
          <Link
            href="/clubes"
            className="rounded border border-azul-noche/10 bg-white p-4 transition-colors hover:border-naranja"
          >
            <h2 className="font-semibold text-azul-noche">
              {SECCIONES_COMPLETAS ? "Clubes y jugadores" : "Clubes y canchas"}
            </h2>
            <p className="mt-1 text-sm text-azul-noche/70">
              {SECCIONES_COMPLETAS
                ? "Qué equipos y jugadores representan a cada club."
                : "Dónde queda cada club y qué equipos presenta."}
            </p>
          </Link>
        )}
      </div>
    </div>
  );
}
