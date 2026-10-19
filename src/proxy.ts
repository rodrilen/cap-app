import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export function proxy(request: NextRequest) {
  return updateSession(request);
}

// El token de Supabase se renueva acá: es el único lugar que puede escribir
// las cookies nuevas (un Server Component no puede). Si el middleware sólo
// corriera en las rutas privadas, al capitán que navega por el fixture se le
// vencería la sesión sin renovarse, y tendría que volver a loguearse.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
