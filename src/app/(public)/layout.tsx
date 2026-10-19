import Link from "next/link";
import { getUsuarioActual } from "@/lib/auth/current-user";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Sin esto el capitán que entra al fixture queda sin camino de vuelta a su
  // panel: el header público mostraba "Ingresar" incluso con la sesión abierta.
  const usuario = await getUsuarioActual();
  const panel =
    usuario?.rol === "admin"
      ? { href: "/admin", label: "Panel admin" }
      : usuario
        ? { href: "/capitan", label: "Mis partidos" }
        : null;

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4 bg-azul-noche px-6 py-4">
        <Link href="/" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-horizontal-negativo.svg" alt="CAP" className="h-8" />
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium text-hueso">
          <Link href="/fixture" className="hover:text-naranja">
            Fixture
          </Link>
          <Link href="/tabla" className="hover:text-naranja">
            Tabla de posiciones
          </Link>
          <Link href="/ranking" className="hover:text-naranja">
            Rankings
          </Link>
          <Link href="/clubes" className="hover:text-naranja">
            Clubes
          </Link>
          {panel ? (
            <Link href={panel.href} className="font-semibold hover:text-naranja">
              {panel.label}
            </Link>
          ) : (
            <Link href="/login" className="text-hueso/60 hover:text-naranja">
              Ingresar
            </Link>
          )}
        </nav>
      </header>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col p-6">
        {children}
      </main>
    </div>
  );
}
