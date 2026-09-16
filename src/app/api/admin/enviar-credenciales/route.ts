import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notificarCredencialesCapitan } from "@/lib/ghl";

// Envío masivo de credenciales a los capitanes, para correr una vez cerrada la
// inscripción: el alta por formulario crea la cuenta pero no manda nada, así
// que todos los capitanes reciben su acceso el mismo día.
//
// Genera una contraseña nueva en el momento (la del alta era descartable y
// nunca se guardó en ningún lado).
//
// Por defecto simula: hay que pasar ?enviar=1 para que mande los mails.

function generarPassword() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.GHL_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const enviar = request.nextUrl.searchParams.get("enviar") === "1";
  const admin = createAdminClient();

  const { data: capitanes, error } = await admin
    .from("usuario")
    .select("id, email, equipo_id")
    .eq("rol", "capitan");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: equipos, error: equiposError } = await admin
    .from("equipo")
    .select("id, nombre");

  if (equiposError) {
    return NextResponse.json({ error: equiposError.message }, { status: 500 });
  }

  const nombrePorEquipo = new Map((equipos ?? []).map((e) => [e.id, e.nombre]));
  const destinatarios = (capitanes ?? []).filter((c) => c.equipo_id);

  if (!enviar) {
    return NextResponse.json({
      dryRun: true,
      total: destinatarios.length,
      destinatarios: destinatarios.map((c) => ({
        email: c.email,
        equipo: nombrePorEquipo.get(c.equipo_id!),
      })),
    });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const enviados: string[] = [];
  const fallidos: { email: string; motivo: string }[] = [];

  for (const capitan of destinatarios) {
    const equipoNombre = nombrePorEquipo.get(capitan.equipo_id!) ?? "";
    const password = generarPassword();

    const { error: updateError } = await admin.auth.admin.updateUserById(capitan.id, {
      password,
    });

    if (updateError) {
      fallidos.push({ email: capitan.email, motivo: updateError.message });
      continue;
    }

    await notificarCredencialesCapitan({
      email: capitan.email,
      password,
      equipoNombre,
      urlLogin: `${siteUrl}/login`,
    });

    enviados.push(capitan.email);
  }

  return NextResponse.json({ ok: true, enviados, fallidos });
}
