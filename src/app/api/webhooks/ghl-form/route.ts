import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notificarAltaEquipo } from "@/lib/ghl";

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
  // GHL manda lo configurado en "Custom Data" del Webhook adentro de un
  // objeto anidado `customData`, no en la raíz del payload -- el resto del
  // body son los campos estándar del contacto (first_name, email, etc.)
  // que no usamos porque ya pedimos todo explícito vía custom data.
  const data = body.customData ?? body;

  const email = String(data.captain_email ?? "").trim().toLowerCase();
  const capitanNombre = String(data.capitan_nombre ?? "").trim();
  const clubNombre = String(data.club ?? "").trim();
  const categoriaNombre = String(data.categoria ?? "").trim();

  const jugadoresNombres = [1, 2, 3, 4, 5, 6, 7]
    .map((i) => String(data[`jugador_${i}`] ?? "").trim())
    .filter(Boolean);

  // El formulario pide al capitán que se anote a sí mismo como jugador 1, pero
  // no todos lo hacen -- sumarlo sólo si todavía no figura, para no duplicarlo.
  const capitanYaAnotado = jugadoresNombres.some(
    (nombre) => nombre.toLowerCase() === capitanNombre.toLowerCase(),
  );
  if (capitanNombre && !capitanYaAnotado) jugadoresNombres.unshift(capitanNombre);

  const admin = createAdminClient();

  if (!email || !clubNombre || !categoriaNombre || jugadoresNombres.length === 0) {
    await notificarAltaEquipo({
      exito: false,
      motivo: "Faltan campos obligatorios en el envío (email, club, categoría o jugadores).",
      datosCrudos: body,
    });
    return NextResponse.json({ ok: true, skipped: "campos_faltantes" });
  }

  // Si alguna de estas consultas falla por un problema de conexión (por
  // ejemplo el proyecto de Supabase pausado por inactividad), Postgrest/el
  // cliente devuelven data=null igual que un "no encontrado" real -- sin
  // chequear `error` por separado, el mail terminaba diciendo "categoría
  // no encontrada" para un problema completamente distinto (pasó una vez).
  function esErrorDeConexion(error: { message?: string } | null) {
    return !!error;
  }

  // No duplicar si ya existe una cuenta con este email -- se avisa al admin
  // para que lo revise a mano en vez de intentar adivinar qué hacer.
  const { data: yaExiste, error: usuarioError } = await admin
    .from("usuario")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (esErrorDeConexion(usuarioError)) {
    await notificarAltaEquipo({
      exito: false,
      motivo: `No se pudo consultar la base de datos (¿proyecto de Supabase pausado?): ${usuarioError?.message}`,
      datosCrudos: body,
    });
    return NextResponse.json({ ok: false, skipped: "error_conexion" });
  }

  if (yaExiste) {
    await notificarAltaEquipo({
      exito: false,
      motivo: `Ya existe una cuenta con el email ${email}.`,
      datosCrudos: body,
    });
    return NextResponse.json({ ok: true, skipped: "email_duplicado" });
  }

  const { data: categoria, error: categoriaError } = await admin
    .from("categoria")
    .select("id")
    .ilike("nombre", categoriaNombre)
    .maybeSingle();

  if (esErrorDeConexion(categoriaError)) {
    await notificarAltaEquipo({
      exito: false,
      motivo: `No se pudo consultar la base de datos (¿proyecto de Supabase pausado?): ${categoriaError?.message}`,
      datosCrudos: body,
    });
    return NextResponse.json({ ok: false, skipped: "error_conexion" });
  }

  if (!categoria) {
    await notificarAltaEquipo({
      exito: false,
      motivo: `No se encontró la categoría "${categoriaNombre}".`,
      datosCrudos: body,
    });
    return NextResponse.json({ ok: true, skipped: "categoria_no_encontrada" });
  }

  let { data: club, error: clubError } = await admin
    .from("club")
    .select("id, nombre")
    .ilike("nombre", clubNombre)
    .maybeSingle();

  if (esErrorDeConexion(clubError)) {
    await notificarAltaEquipo({
      exito: false,
      motivo: `No se pudo consultar la base de datos (¿proyecto de Supabase pausado?): ${clubError?.message}`,
      datosCrudos: body,
    });
    return NextResponse.json({ ok: false, skipped: "error_conexion" });
  }

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

  // Contraseña descartable: el capitán todavía no recibe nada. Las credenciales
  // se mandan todas juntas cuando cierra la inscripción, y ahí se genera una
  // contraseña nueva (ver /api/admin/enviar-credenciales).
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password: generarPassword(),
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
