import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Canjea el token del mail por una sesión y manda al capitán a elegir su
// contraseña. Es un route handler y no una página porque acá sí se pueden
// escribir las cookies de sesión.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/recuperar", request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type: "recovery",
    token_hash: token,
  });

  if (error) {
    const url = new URL("/recuperar", request.url);
    url.searchParams.set(
      "error",
      "El link venció o ya se usó. Pedí uno nuevo.",
    );
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(new URL("/cuenta?recuperacion=1", request.url));
}
