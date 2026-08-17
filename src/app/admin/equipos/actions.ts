"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function crearEquipo(formData: FormData) {
  const supabase = await createClient();
  await supabase.from("equipo").insert({
    nombre: String(formData.get("nombre") ?? ""),
    categoria_id: String(formData.get("categoria_id") ?? ""),
    club_sede_id: String(formData.get("club_sede_id") ?? ""),
    color: String(formData.get("color") ?? "") || null,
    logo_url: String(formData.get("logo_url") ?? "") || null,
  });
  revalidatePath("/admin/equipos");
}

export async function actualizarEquipo(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase
    .from("equipo")
    .update({
      nombre: String(formData.get("nombre") ?? ""),
      categoria_id: String(formData.get("categoria_id") ?? ""),
      club_sede_id: String(formData.get("club_sede_id") ?? ""),
      color: String(formData.get("color") ?? "") || null,
      logo_url: String(formData.get("logo_url") ?? "") || null,
    })
    .eq("id", id);
  revalidatePath("/admin/equipos");
}

export async function borrarEquipo(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("equipo").delete().eq("id", id);
  revalidatePath("/admin/equipos");
}
