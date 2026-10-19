import Link from "next/link";
import { logout } from "@/app/login/actions";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-azul-noche px-6 py-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/isotipo-negativo.svg" alt="CAP" className="h-6" />
          <nav className="flex flex-wrap gap-x-3 gap-y-1 text-sm font-medium text-hueso">
            <Link href="/admin" className="hover:text-naranja">
              Inicio
            </Link>
            <Link href="/admin/clubes" className="hover:text-naranja">
              Clubes
            </Link>
            <Link href="/admin/categorias" className="hover:text-naranja">
              Categorías
            </Link>
            <Link href="/admin/equipos" className="hover:text-naranja">
              Equipos
            </Link>
            <Link href="/admin/jugadores" className="hover:text-naranja">
              Jugadores
            </Link>
            <Link href="/admin/fechas" className="hover:text-naranja">
              Fechas
            </Link>
            <Link href="/admin/usuarios" className="hover:text-naranja">
              Capitanes
            </Link>
            <Link href="/admin/partidos" className="hover:text-naranja">
              Partidos
            </Link>
            <Link href="/admin/ranking-equipos" className="hover:text-naranja">
              Ranking equipos
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <Link href="/" className="text-hueso/60 hover:text-naranja">
            Ver sitio público
          </Link>
          <Link href="/cuenta" className="text-hueso/60 hover:text-naranja">
            Cambiar contraseña
          </Link>
          <form action={logout}>
            <button type="submit" className="text-hueso/60 hover:text-naranja">
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>
      <main className="flex flex-1 flex-col p-6">{children}</main>
    </div>
  );
}
