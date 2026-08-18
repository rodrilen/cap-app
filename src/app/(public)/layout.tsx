import Link from "next/link";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
          <Link href="/login" className="text-hueso/60 hover:text-naranja">
            Ingresar
          </Link>
        </nav>
      </header>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col p-6">
        {children}
      </main>
    </div>
  );
}
