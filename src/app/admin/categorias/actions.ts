"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function crearCategoria(formData: FormData) {
  const supabase = await createClient();
  await supabase.from("categoria").insert({
    nombre: String(formData.get("nombre") ?? ""),
    activa: formData.get("activa") === "on",
  });
  revalidatePath("/admin/categorias");
}

export async function actualizarCategoria(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase
    .from("categoria")
    .update({
      nombre: String(formData.get("nombre") ?? ""),
      activa: formData.get("activa") === "on",
    })
    .eq("id", id);
  revalidatePath("/admin/categorias");
}

export async function borrarCategoria(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("categoria").delete().eq("id", id);
  revalidatePath("/admin/categorias");
}
