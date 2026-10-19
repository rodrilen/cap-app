"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notificarResultadoPendiente, notificarDisputa } from "@/lib/ghl";
import { linkWhatsapp } from "@/lib/contacto";

// Estas escrituras se hacen con el cliente autenticado del capitán (no
// admin), a propósito: la policy RLS "capitan local carga resultado" /
// "capitan visitante confirma o disputa" es la que realmente decide si el
// UPDATE está permitido. Si el capitán no es local/visitante del partido,
// Postgres simplemente no actualiza ninguna fila.

// Cada encuentro se juega en 2 partidos individuales, cada uno por una
// pareja distinta (no hay parejas fijas). Se cargan los 2 primero -- la
// policy RLS de partido_individual exige que el partido padre siga
// 'programado', así que el UPDATE que lo pasa a pendiente_confirmacion va
// después. sets_local/sets_visitante del encuentro quedan en 0-2 según
// cuántos de esos 2 partidos ganó cada equipo (no son sets de pádel).
export type EstadoCarga = { error?: string };

export async function cargarResultado(
  _prev: EstadoCarga,
  formData: FormData,
): Promise<EstadoCarga> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Se cerró tu sesión. Volvé a entrar e intentá de nuevo." };

  const partidoId = String(formData.get("partido_id"));

  const partidosIndividuales = [1, 2].map((numero) => {
    const num = (campo: string) => {
      const valor = formData.get(`p${numero}_${campo}`);
      return valor === null || valor === "" ? null : Number(valor);
    };

    const set1Local = num("set1_local");
    const set1Visitante = num("set1_visitante");
    const set2Local = num("set2_local");
    const set2Visitante = num("set2_visitante");
    const tbLocal = num("tb_local");
    const tbVisitante = num("tb_visitante");

    // El súper tiebreak reemplaza al tercer set: vale un set para quien lo
    // gana, y un solo game (no se suman sus puntos al total).
    const setsGanados = [
      [set1Local, set1Visitante],
      [set2Local, set2Visitante],
      [tbLocal, tbVisitante],
    ].reduce(
      (acc, [local, visitante]) => {
        if (local === null || visitante === null || local === visitante) return acc;
        return local > visitante
          ? { local: acc.local + 1, visitante: acc.visitante }
          : { local: acc.local, visitante: acc.visitante + 1 };
      },
      { local: 0, visitante: 0 },
    );

    const gamesLocal =
      (set1Local ?? 0) + (set2Local ?? 0) + (tbLocal !== null && tbVisitante !== null && tbLocal > tbVisitante ? 1 : 0);
    const gamesVisitante =
      (set1Visitante ?? 0) +
      (set2Visitante ?? 0) +
      (tbLocal !== null && tbVisitante !== null && tbVisitante > tbLocal ? 1 : 0);

    return {
      fila: {
        partido_id: partidoId,
        numero,
        jugador_local_1_id: String(formData.get(`p${numero}_jugador_local_1`)),
        jugador_local_2_id: String(formData.get(`p${numero}_jugador_local_2`)),
        jugador_visitante_1_id: String(formData.get(`p${numero}_jugador_visitante_1`)),
        jugador_visitante_2_id: String(formData.get(`p${numero}_jugador_visitante_2`)),
        sets_local: setsGanados.local,
        sets_visitante: setsGanados.visitante,
        set1_local: set1Local,
        set1_visitante: set1Visitante,
        set2_local: set2Local,
        set2_visitante: set2Visitante,
        tb_local: tbLocal,
        tb_visitante: tbVisitante,
      },
      gamesLocal,
      gamesVisitante,
    };
  });

  const { error } = await supabase
    .from("partido_individual")
    .insert(partidosIndividuales.map((p) => p.fila));

  // Antes esto volvía en silencio: el capitán tocaba el botón, no pasaba
  // nada y no había ninguna pista de por qué (pasó con Supabase pausado).
  if (error) {
    return {
      error:
        "No se pudo guardar el resultado. Probá de nuevo en un minuto; si sigue igual, avisanos por WhatsApp.",
    };
  }

  const setsLocal = partidosIndividuales.filter(
    (p) => p.fila.sets_local > p.fila.sets_visitante,
  ).length;

  const { error: updateError } = await supabase
    .from("partido")
    .update({
      sets_local: setsLocal,
      sets_visitante: 2 - setsLocal,
      games_local: partidosIndividuales.reduce((t, p) => t + p.gamesLocal, 0),
      games_visitante: partidosIndividuales.reduce((t, p) => t + p.gamesVisitante, 0),
      estado: "pendiente_confirmacion",
      cargado_por: user.id,
    })
    .eq("id", partidoId);

  if (updateError) {
    return {
      error:
        "Se guardaron los partidos pero no se pudo cerrar el encuentro. Avisanos por WhatsApp así lo revisamos.",
    };
  }

  await avisarCapitanVisitante(partidoId);

  revalidatePath("/capitan");
  // Sin esto el formulario desaparece y no queda ninguna señal de que la
  // carga salió bien: el partido simplemente se mueve de sección.
  redirect("/capitan?aviso=cargado");
}

// El capitán local no tiene permiso (por RLS) para leer el email del
// capitán visitante -- solo puede ver su propia fila de `usuario`. Se usa
// el cliente admin acá puntualmente para resolver ese email y mandar el
// aviso por mail vía GHL, además del aviso in-app que ya crea el trigger
// de Postgres.
async function avisarCapitanVisitante(partidoId: string) {
  const admin = createAdminClient();

  const { data: partido } = await admin
    .from("partido")
    .select(
      "equipo_local:equipo_local_id (nombre), equipo_visitante:equipo_visitante_id (id, nombre)",
    )
    .eq("id", partidoId)
    .single();

  const equipoVisitante = partido?.equipo_visitante as unknown as {
    id: string;
    nombre: string;
  } | null;
  if (!equipoVisitante) return;

  const { data: capitanVisitante } = await admin
    .from("usuario")
    .select("email")
    .eq("equipo_id", equipoVisitante.id)
    .eq("rol", "capitan")
    .maybeSingle();

  if (!capitanVisitante?.email) return;

  const equipoLocal = partido?.equipo_local as unknown as { nombre: string } | null;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  await notificarResultadoPendiente({
    email: capitanVisitante.email,
    equipoLocalNombre: equipoLocal?.nombre ?? "",
    equipoVisitanteNombre: equipoVisitante.nombre,
    urlPanel: `${siteUrl}/capitan`,
  });
}

export async function confirmarResultado(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const partidoId = String(formData.get("partido_id"));

  await supabase
    .from("partido")
    .update({ estado: "confirmado", confirmado_por: user.id })
    .eq("id", partidoId);

  revalidatePath("/capitan");
  redirect("/capitan?aviso=confirmado");
}

export async function disputarResultado(formData: FormData) {
  const supabase = await createClient();
  const partidoId = String(formData.get("partido_id"));

  await supabase.from("partido").update({ estado: "disputado" }).eq("id", partidoId);
  const partido = await datosDelPartido(partidoId);
  await avisarAdminDisputa(partido);

  revalidatePath("/capitan");

  // El mail al admin avisa que hay una disputa, pero no por qué. Mandamos al
  // capitán a WhatsApp para que cuente qué pasó sin tener que buscar el
  // contacto por su cuenta.
  redirect(
    linkWhatsapp(
      `Hola, disputo el resultado del partido Fecha ${partido?.fecha?.numero} — ` +
        `${partido?.equipoLocal?.nombre} vs ${partido?.equipoVisitante?.nombre}: `,
    ),
  );
}

// A diferencia de avisarCapitanVisitante, acá no hace falta el cliente
// admin: partido/equipo/fecha son de lectura pública, así que el cliente
// autenticado del capitán que disputa ya puede leerlos.
async function datosDelPartido(partidoId: string) {
  const supabase = await createClient();
  const { data: partido } = await supabase
    .from("partido")
    .select(
      "equipo_local:equipo_local_id (nombre), equipo_visitante:equipo_visitante_id (nombre), fecha:fecha_id (numero)",
    )
    .eq("id", partidoId)
    .single();

  if (!partido) return null;

  return {
    equipoLocal: partido.equipo_local as unknown as { nombre: string } | null,
    equipoVisitante: partido.equipo_visitante as unknown as { nombre: string } | null,
    fecha: partido.fecha as unknown as { numero: number } | null,
  };
}

async function avisarAdminDisputa(partido: Awaited<ReturnType<typeof datosDelPartido>>) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!adminEmail || !partido) return;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  await notificarDisputa({
    email: adminEmail,
    equipoLocalNombre: partido.equipoLocal?.nombre ?? "",
    equipoVisitanteNombre: partido.equipoVisitante?.nombre ?? "",
    fechaNumero: partido.fecha?.numero ?? 0,
    urlAdmin: `${siteUrl}/admin/partidos`,
  });
}

export async function marcarNotificacionLeida(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));

  await supabase.from("notificacion").update({ leida: true }).eq("id", id);

  revalidatePath("/capitan");
}
