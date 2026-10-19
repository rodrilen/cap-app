import Link from "next/link";

const SECCIONES = [
  { href: "/admin/partidos", titulo: "Partidos", detalle: "Cargar, corregir o forzar resultados." },
  { href: "/admin/fechas", titulo: "Fechas", detalle: "Las jornadas de cada categoría." },
  { href: "/admin/equipos", titulo: "Equipos", detalle: "Qué equipo juega en qué categoría." },
  { href: "/admin/jugadores", titulo: "Jugadores", detalle: "El plantel de cada equipo." },
  { href: "/admin/clubes", titulo: "Clubes", detalle: "Sedes y datos de contacto." },
  { href: "/admin/usuarios", titulo: "Capitanes", detalle: "Las cuentas que cargan resultados." },
  { href: "/admin/categorias", titulo: "Categorías", detalle: "Cuáles están activas en el torneo." },
  { href: "/admin/ranking-equipos", titulo: "Ranking de equipos", detalle: "Posiciones finales y bonus." },
];

export default function AdminHomePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Panel de administración</h1>

      {/* Antes esta pantalla sólo decía "elegí una sección del menú", que en el
          teléfono queda debajo de un header de cuatro filas. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SECCIONES.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded border border-zinc-200 bg-white p-4 hover:border-naranja"
          >
            <span className="block font-medium text-azul-noche">{s.titulo}</span>
            <span className="block text-sm text-zinc-600">{s.detalle}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
