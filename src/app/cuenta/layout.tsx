import Link from "next/link";
import { logout } from "@/app/login/actions";
import { getUsuarioActual } from "@/lib/auth/current-user";

export default async function CuentaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await getUsuarioActual();
  const volverA = usuario?.rol === "admin" ? "/admin" : "/capitan";

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between gap-3 bg-azul-noche px-6 py-4">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/isotipo-negativo.svg" alt="CAP" className="h-6" />
          <Link href={volverA} className="text-sm text-hueso hover:text-naranja">
            Volver al panel
          </Link>
        </div>
        <form action={logout}>
          <button type="submit" className="text-sm text-hueso/60 hover:text-naranja">
            Cerrar sesión
          </button>
        </form>
      </header>
      <main className="flex flex-1 flex-col p-6">{children}</main>
    </div>
  );
}
