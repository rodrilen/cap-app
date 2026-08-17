"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Estas escrituras se hacen con el cliente autenticado del capitán (no
// admin), a propósito: la policy RLS "capitan local carga resultado" /
// "capitan visitante confirma o disputa" es la que realmente decide si el
// UPDATE está permitido. Si el capitán no es local/visitante del partido,
// Postgres simplemente no actualiza ninguna fila.

export async function cargarResultado(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const partidoId = String(formData.get("partido_id"));

  await supabase
    .from("partido")
    .update({
      sets_local: Number(formData.get("sets_local")),
      sets_visitante: Number(formData.get("sets_visitante")),
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

  revalidatePath("/capitan");
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
