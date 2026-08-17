"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function crearJugador(formData: FormData) {
  const supabase = await createClient();
  await supabase.from("jugador").insert({
    nombre: String(formData.get("nombre") ?? ""),
    equipo_id: String(formData.get("equipo_id") ?? ""),
  });
  revalidatePath("/admin/jugadores");
}

export async function actualizarJugador(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase
    .from("jugador")
    .update({
      nombre: String(formData.get("nombre") ?? ""),
      equipo_id: String(formData.get("equipo_id") ?? ""),
    })
    .eq("id", id);
  revalidatePath("/admin/jugadores");
}

export async function borrarJugador(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("jugador").delete().eq("id", id);
  revalidatePath("/admin/jugadores");
}
