import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col gap-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-azul-noche">
          CAP
        </h1>
        <p className="mt-2 text-azul-noche/70">
          Fixture, resultados y tabla de posiciones del Circuito Abierto de
          Pádel.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/fixture"
          className="rounded border border-azul-noche/10 bg-white p-4 transition-colors hover:border-naranja"
        >
          <h2 className="font-semibold text-azul-noche">Fixture y resultados</h2>
          <p className="mt-1 text-sm text-azul-noche/60">
            Partidos por fecha, con el club sede de cada uno.
          </p>
        </Link>
        <Link
          href="/tabla"
          className="rounded border border-azul-noche/10 bg-white p-4 transition-colors hover:border-naranja"
        >
          <h2 className="font-semibold text-azul-noche">Tabla de posiciones</h2>
          <p className="mt-1 text-sm text-azul-noche/60">
            Se actualiza sola con cada resultado confirmado.
          </p>
        </Link>
        <Link
          href="/ranking"
          className="rounded border border-azul-noche/10 bg-white p-4 transition-colors hover:border-naranja"
        >
          <h2 className="font-semibold text-azul-noche">Rankings</h2>
          <p className="mt-1 text-sm text-azul-noche/60">
            Puntos por jugador y ranking general de equipos.
          </p>
        </Link>
        <Link
          href="/clubes"
          className="rounded border border-azul-noche/10 bg-white p-4 transition-colors hover:border-naranja"
        >
          <h2 className="font-semibold text-azul-noche">Clubes anfitriones</h2>
          <p className="mt-1 text-sm text-azul-noche/60">
            Dónde juegan los equipos sin sede propia.
          </p>
        </Link>
      </div>
    </div>
  );
}
