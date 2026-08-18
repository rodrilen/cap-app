"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notificarResultadoPendiente } from "@/lib/ghl";

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
export async function cargarResultado(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const partidoId = String(formData.get("partido_id"));

  const partidosIndividuales = [1, 2].map((numero) => {
    const [setsLocal, setsVisitante] = String(formData.get(`p${numero}_resultado`))
      .split("-")
      .map(Number);
    return {
      partido_id: partidoId,
      numero,
      jugador_local_1_id: String(formData.get(`p${numero}_jugador_local_1`)),
      jugador_local_2_id: String(formData.get(`p${numero}_jugador_local_2`)),
      jugador_visitante_1_id: String(formData.get(`p${numero}_jugador_visitante_1`)),
      jugador_visitante_2_id: String(formData.get(`p${numero}_jugador_visitante_2`)),
      sets_local: setsLocal,
      sets_visitante: setsVisitante,
    };
  });

  const { error } = await supabase.from("partido_individual").insert(partidosIndividuales);
  if (error) return;

  const setsLocal = partidosIndividuales.filter((p) => p.sets_local > p.sets_visitante).length;

  const { error: updateError } = await supabase
    .from("partido")
    .update({
      sets_local: setsLocal,
      sets_visitante: 2 - setsLocal,
      games_local: formData.get("games_local")
        ? Number(formData.get("games_local"))
        : null,
      games_visitante: formData.get("games_visitante")
        ? Number(formData.get("games_visitante"))
        : null,
      estado: "pendiente_confirmacion",
      cargado_por: user.id,
    })
    .eq("id", partidoId);

  if (!updateError) {
    await avisarCapitanVisitante(partidoId);
  }

  revalidatePath("/capitan");
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
}

export async function disputarResultado(formData: FormData) {
  const supabase = await createClient();
  const partidoId = String(formData.get("partido_id"));

  await supabase.from("partido").update({ estado: "disputado" }).eq("id", partidoId);

  revalidatePath("/capitan");
}

export async function marcarNotificacionLeida(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));

  await supabase.from("notificacion").update({ leida: true }).eq("id", id);

  revalidatePath("/capitan");
}
