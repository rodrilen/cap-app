import Link from "next/link";
import { logout } from "@/app/login/actions";

export default function CapitanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between gap-3 bg-azul-noche px-6 py-4">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/isotipo-negativo.svg" alt="CAP" className="h-6" />
          <span className="text-sm font-medium text-hueso">Panel del capitán</span>
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
