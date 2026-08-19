import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notificarAltaEquipo, notificarCredencialesCapitan } from "@/lib/ghl";

// Webhook que dispara un Workflow de GHL ("Form Submitted" -> acción
// Webhook) cuando un capitán completa el formulario de alta de equipo.
// Crea el equipo (y el club, si todavía no existe), los jugadores y la
// cuenta de capitán, sin intervención del admin.
//
// Seguridad: GHL no firma sus webhooks salientes, así que el secreto va en
// la propia URL configurada en el Workflow (?secret=...).

function generarPassword() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.GHL_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const email = String(body.captain_email ?? "").trim().toLowerCase();
  const capitanNombre = String(body.capitan_nombre ?? "").trim();
  const clubNombre = String(body.club ?? "").trim();
  const categoriaNombre = String(body.categoria ?? "").trim();

  const jugadoresNombres = [1, 2, 3, 4, 5, 6, 7]
    .map((i) => String(body[`jugador_${i}`] ?? "").trim())
    .filter(Boolean);
  if (capitanNombre) jugadoresNombres.unshift(capitanNombre);

  const admin = createAdminClient();

  if (!email || !clubNombre || !categoriaNombre || jugadoresNombres.length === 0) {
    await notificarAltaEquipo({
      exito: false,
      motivo: "Faltan campos obligatorios en el envío (email, club, categoría o jugadores).",
      datosCrudos: body,
    });
    return NextResponse.json({ ok: true, skipped: "campos_faltantes" });
  }

  // No duplicar si ya existe una cuenta con este email -- se avisa al admin
  // para que lo revise a mano en vez de intentar adivinar qué hacer.
  const { data: yaExiste } = await admin
    .from("usuario")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (yaExiste) {
    await notificarAltaEquipo({
      exito: false,
      motivo: `Ya existe una cuenta con el email ${email}.`,
      datosCrudos: body,
    });
    return NextResponse.json({ ok: true, skipped: "email_duplicado" });
  }

  const { data: categoria } = await admin
    .from("categoria")
    .select("id")
    .ilike("nombre", categoriaNombre)
    .maybeSingle();

  if (!categoria) {
    await notificarAltaEquipo({
      exito: false,
      motivo: `No se encontró la categoría "${categoriaNombre}".`,
      datosCrudos: body,
    });
    return NextResponse.json({ ok: true, skipped: "categoria_no_encontrada" });
  }

  let { data: club } = await admin
    .from("club")
    .select("id, nombre")
    .ilike("nombre", clubNombre)
    .maybeSingle();

  if (!club) {
    const { data: nuevoClub } = await admin
      .from("club")
      .insert({ nombre: clubNombre, es_anfitrion: false })
      .select("id, nombre")
      .single();
    club = nuevoClub;
  }

  if (!club) {
    await notificarAltaEquipo({
      exito: false,
      motivo: `No se pudo crear ni encontrar el club "${clubNombre}".`,
      datosCrudos: body,
    });
    return NextResponse.json({ ok: true, skipped: "club_no_resuelto" });
  }

  // Letra según cuántos equipos de ese club ya juegan en esa categoría
  // (mismo criterio que se usó al armar el seed: "Club X A", "Club X B"...).
  const { count } = await admin
    .from("equipo")
    .select("id", { count: "exact", head: true })
    .eq("club_sede_id", club.id)
    .eq("categoria_id", categoria.id);

  const letra = String.fromCharCode(65 + (count ?? 0));
  const equipoNombre = `${club.nombre} ${letra}`;

  const { data: equipo, error: equipoError } = await admin
    .from("equipo")
    .insert({ nombre: equipoNombre, categoria_id: categoria.id, club_sede_id: club.id })
    .select("id")
    .single();

  if (equipoError || !equipo) {
    await notificarAltaEquipo({
      exito: false,
      motivo: `No se pudo crear el equipo: ${equipoError?.message}`,
      datosCrudos: body,
    });
    return NextResponse.json({ ok: true, skipped: "equipo_no_creado" });
  }

  await admin
    .from("jugador")
    .insert(jugadoresNombres.map((nombre) => ({ nombre, equipo_id: equipo.id })));

  const password = generarPassword();
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authUser.user) {
    await notificarAltaEquipo({
      exito: false,
      motivo: `Equipo "${equipoNombre}" creado, pero falló la cuenta del capitán: ${authError?.message}`,
      datosCrudos: body,
    });
    return NextResponse.json({ ok: true, skipped: "usuario_no_creado" });
  }

  await admin.from("usuario").insert({
    id: authUser.user.id,
    email,
    rol: "capitan",
    equipo_id: equipo.id,
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  await notificarCredencialesCapitan({
    email,
    password,
    equipoNombre,
    urlLogin: `${siteUrl}/login`,
  });

  await notificarAltaEquipo({
    exito: true,
    equipoNombre,
    clubNombre: club.nombre,
    categoriaNombre,
    jugadores: jugadoresNombres,
    email,
  });

  return NextResponse.json({ ok: true, equipoId: equipo.id });
}
