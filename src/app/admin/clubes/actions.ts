"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function crearClub(formData: FormData) {
  const supabase = await createClient();
  await supabase.from("club").insert({
    nombre: String(formData.get("nombre") ?? ""),
    direccion: String(formData.get("direccion") ?? "") || null,
    es_anfitrion: formData.get("es_anfitrion") === "on",
    contacto: String(formData.get("contacto") ?? "") || null,
  });
  revalidatePath("/admin/clubes");
}

export async function actualizarClub(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase
    .from("club")
    .update({
      nombre: String(formData.get("nombre") ?? ""),
      direccion: String(formData.get("direccion") ?? "") || null,
      es_anfitrion: formData.get("es_anfitrion") === "on",
      contacto: String(formData.get("contacto") ?? "") || null,
    })
    .eq("id", id);
  revalidatePath("/admin/clubes");
}

export async function borrarClub(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("club").delete().eq("id", id);
  revalidatePath("/admin/clubes");
}
