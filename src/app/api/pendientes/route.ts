import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notificarPendientes } from "@/lib/ghl";

// Los lunes repasa los partidos cuya fecha ya pasó y siguen sin resultado, y
// se los manda al admin. Hace falta porque la app no le avisa al capitán local
// que le toca cargar: la cadena de mails arranca recién cuando él carga, así
// que un partido olvidado no le aparece a nadie.
//
// Lo llama el cron de Vercel (ver vercel.json). Sin partidos pendientes no
// manda nada, para no mandar un mail por semana diciendo que está todo bien.

type EquipoRef = { nombre: string } | null;

export async function GET(request: NextRequest) {
  if (process.env.CRON_SECRET) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!adminEmail) {
    return NextResponse.json({ ok: false, motivo: "sin ADMIN_NOTIFICATION_EMAIL" });
  }

  const admin = createAdminClient();
  const hoy = new Date().toISOString().slice(0, 10);

  // fecha!inner para poder filtrar por la fecha programada de la jornada.
  const { data: partidos, error } = await admin
    .from("partido")
    .select(
      "id, equipo_local_id, fecha:fecha_id!inner (numero, fecha_programada), local:equipo_local_id (nombre), visitante:equipo_visitante_id (nombre)",
    )
    .eq("estado", "programado")
    .lte("fecha.fecha_programada", hoy);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!partidos?.length) {
    return NextResponse.json({ ok: true, pendientes: 0 });
  }

  const { data: capitanes } = await admin
    .from("usuario")
    .select("email, equipo_id")
    .eq("rol", "capitan");

  const emailPorEquipo = new Map((capitanes ?? []).map((c) => [c.equipo_id, c.email]));
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const pendientes = partidos.map((p) => {
    const fecha = p.fecha as unknown as { numero: number; fecha_programada: string };
    return {
      fechaNumero: fecha.numero,
      jugadoEl: fecha.fecha_programada.split("-").reverse().join("/"),
      local: (p.local as unknown as EquipoRef)?.nombre ?? "",
      visitante: (p.visitante as unknown as EquipoRef)?.nombre ?? "",
      capitanLocal: emailPorEquipo.get(p.equipo_local_id) ?? "(sin capitán)",
    };
  });

  await notificarPendientes({
    email: adminEmail,
    pendientes,
    urlAdmin: `${siteUrl}/admin/partidos`,
  });

  return NextResponse.json({ ok: true, pendientes: pendientes.length });
}
