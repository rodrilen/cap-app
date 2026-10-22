import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notificarCredencialesCapitan } from "@/lib/ghl";

// Envío masivo de credenciales a los capitanes, para correr una vez cerrada la
// inscripción: el alta por formulario crea la cuenta pero no manda nada, así
// que todos los capitanes reciben su acceso el mismo día.
//
// La contraseña se deriva del nombre del club para que el capitán la pueda
// tipear sin equivocarse. Como los nombres de los clubes son públicos, esa
// clave la puede deducir cualquiera: por eso la cuenta queda marcada con
// debe_cambiar_password y la app no deja hacer nada hasta cambiarla.
//
// Por defecto simula: hay que pasar ?enviar=1 para que mande los mails.

function passwordDelClub(club: string) {
  const limpio = club
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // saca los acentos: Cañas -> Canas
    .replace(/[^A-Za-z0-9]/g, ""); // y los espacios y símbolos
  return `${limpio}.CAP.2026`;
}

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.GHL_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const enviar = request.nextUrl.searchParams.get("enviar") === "1";
  // ?email= limita el envío a un capitán puntual (un equipo que se anotó tarde,
  // o uno de prueba) sin volver a mandarle el acceso a todos los demás.
  const soloEmail = request.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  const admin = createAdminClient();

  let consulta = admin.from("usuario").select("id, email, equipo_id").eq("rol", "capitan");
  if (soloEmail) consulta = consulta.eq("email", soloEmail);

  const { data: capitanes, error } = await consulta;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: equipos, error: equiposError } = await admin
    .from("equipo")
    .select("id, nombre, club:club_sede_id (nombre)");

  if (equiposError) {
    return NextResponse.json({ error: equiposError.message }, { status: 500 });
  }

  const porEquipo = new Map(
    (equipos ?? []).map((e) => [
      e.id,
      {
        equipo: e.nombre,
        club: (e.club as unknown as { nombre: string } | null)?.nombre ?? e.nombre,
      },
    ]),
  );
  const destinatarios = (capitanes ?? []).filter((c) => c.equipo_id);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  if (!enviar) {
    return NextResponse.json({
      dryRun: true,
      total: destinatarios.length,
      // El link que va a llevar el mail. Se muestra acá porque sale de una
      // variable de entorno: si quedó la URL vieja, esto lo canta antes de
      // mandar 8 mails con un link equivocado.
      urlLogin: `${siteUrl}/login`,
      destinatarios: destinatarios.map((c) => {
        const d = porEquipo.get(c.equipo_id!);
        return {
          email: c.email,
          equipo: d?.equipo,
          password: d ? passwordDelClub(d.club) : null,
        };
      }),
    });
  }

  const enviados: string[] = [];
  const fallidos: { email: string; motivo: string }[] = [];

  for (const capitan of destinatarios) {
    const datos = porEquipo.get(capitan.equipo_id!);
    const equipoNombre = datos?.equipo ?? "";
    const password = passwordDelClub(datos?.club ?? equipoNombre);

    const { error: updateError } = await admin.auth.admin.updateUserById(capitan.id, {
      password,
    });

    if (updateError) {
      fallidos.push({ email: capitan.email, motivo: updateError.message });
      continue;
    }

    await admin
      .from("usuario")
      .update({ debe_cambiar_password: true })
      .eq("id", capitan.id);

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
