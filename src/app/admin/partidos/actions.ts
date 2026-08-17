"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// El admin escribe con su propio cliente autenticado: la policy RLS
// "admin gestiona partidos" (is_admin()) es la que permite el UPDATE/INSERT
// sin las restricciones que aplican a los capitanes.

export async function crearPartido(formData: FormData) {
  const supabase = await createClient();
  await supabase.from("partido").insert({
    fecha_id: String(formData.get("fecha_id")),
    equipo_local_id: String(formData.get("equipo_local_id")),
    equipo_visitante_id: String(formData.get("equipo_visitante_id")),
    club_sede_id: String(formData.get("club_sede_id")),
    estado: "programado",
  });
  revalidatePath("/admin/partidos");
}

export async function actualizarPartido(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));

  const setsLocal = formData.get("sets_local");
  const setsVisitante = formData.get("sets_visitante");
  const gamesLocal = formData.get("games_local");
  const gamesVisitante = formData.get("games_visitante");

  await supabase
    .from("partido")
    .update({
      estado: String(formData.get("estado")),
      sets_local: setsLocal ? Number(setsLocal) : null,
      sets_visitante: setsVisitante ? Number(setsVisitante) : null,
      games_local: gamesLocal ? Number(gamesLocal) : null,
      games_visitante: gamesVisitante ? Number(gamesVisitante) : null,
    })
    .eq("id", id);

  revalidatePath("/admin/partidos");
}

export async function borrarPartido(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("partido").delete().eq("id", id);
  revalidatePath("/admin/partidos");
}
