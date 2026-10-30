import Link from "next/link";
import {
  MOSTRAR_CLUBES,
  MOSTRAR_PLANTELES,
  MOSTRAR_RANKINGS,
  MOSTRAR_TABLA,
} from "@/lib/secciones";

// Una tarjeta por sección prendida. Se arman desde una lista para que agregar
// o sacar una sea cambiar el interruptor en src/lib/secciones.ts y nada más.
const SECCIONES = [
  {
    visible: true,
    href: "/fixture",
    titulo: "Fixture y resultados",
    bajada: "Todas las fechas y los cruces, por categoría.",
  },
  {
    visible: MOSTRAR_TABLA,
    href: "/tabla",
    titulo: "Tabla de posiciones",
    bajada: "Se actualiza sola con cada resultado confirmado.",
  },
  {
    visible: MOSTRAR_RANKINGS,
    href: "/ranking",
    titulo: "Rankings",
    bajada: "Puntos por jugador y ranking general de equipos.",
  },
  {
    visible: MOSTRAR_CLUBES,
    href: "/clubes",
    titulo: MOSTRAR_PLANTELES ? "Clubes y jugadores" : "Clubes y canchas",
    bajada: MOSTRAR_PLANTELES
      ? "Qué equipos y jugadores representan a cada club."
      : "Dónde queda cada club y qué equipos presenta.",
  },
];

export default function HomePage() {
  const visibles = SECCIONES.filter((s) => s.visible);

  return (
    <div className="flex flex-1 flex-col gap-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-azul-noche">
          CAP
        </h1>
        <p className="mt-2 text-azul-noche/70">
          {MOSTRAR_TABLA
            ? "Fixture, resultados y tabla de posiciones del Circuito Abierto de Pádel."
            : "Fixture del Circuito Abierto de Pádel: las fechas y los cruces de la temporada 2026."}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {visibles.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded border border-azul-noche/10 bg-white p-4 transition-colors hover:border-naranja"
          >
            <h2 className="font-semibold text-azul-noche">{s.titulo}</h2>
            <p className="mt-1 text-sm text-azul-noche/70">{s.bajada}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
