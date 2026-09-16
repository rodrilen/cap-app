import { NextRequest, NextResponse } from "next/server";

// Supabase en plan gratuito pausa el proyecto por inactividad, y eso deja la
// app entera sin base de datos (el síntoma es que el dominio de Supabase deja
// de resolver por DNS). Ya pasó dos veces, una de ellas se comió el alta de un
// club real.
//
// Este endpoint le hace una consulta mínima para que cuente como actividad. Lo
// llama el cron de Vercel una vez por día (ver vercel.json). Corre desde la
// infraestructura de Vercel, que es la misma que ya le habla a Supabase en
// producción, así que no hay proxies de por medio que bloqueen la salida.
//
// Si falla devuelve 500 a propósito, para que la corrida figure como fallida
// en el panel de Vercel en vez de pasar en silencio.

export async function GET(request: NextRequest) {
  // Vercel manda este header automáticamente si existe la variable de entorno
  // CRON_SECRET. Si no está definida, el endpoint queda abierto -- no expone
  // nada, sólo lee una fila con la misma anon key que ya es pública.
  if (process.env.CRON_SECRET) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/categoria?select=id&limit=1`,
    {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    return NextResponse.json(
      { ok: false, status: res.status, detalle: await res.text() },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
