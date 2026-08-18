import Link from "next/link";
import { logout } from "@/app/login/actions";

export default function CapitanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 bg-azul-noche px-6 py-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/isotipo-negativo.svg" alt="CAP" className="h-6" />
          <nav className="flex flex-wrap gap-4 text-sm font-medium text-hueso">
            <Link href="/capitan" className="hover:text-naranja">
              Mis partidos
            </Link>
            <Link href="/fixture" className="hover:text-naranja">
              Fixture
            </Link>
            <Link href="/tabla" className="hover:text-naranja">
              Tabla
            </Link>
            <Link href="/ranking" className="hover:text-naranja">
              Rankings
            </Link>
            <Link href="/clubes" className="hover:text-naranja">
              Clubes
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/cuenta" className="text-sm text-hueso/60 hover:text-naranja">
            Cambiar contraseña
          </Link>
          <form action={logout}>
            <button type="submit" className="text-sm text-hueso/60 hover:text-naranja">
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>
      <main className="flex flex-1 flex-col p-6">{children}</main>
    </div>
  );
}
