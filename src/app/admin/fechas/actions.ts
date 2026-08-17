"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function crearFecha(formData: FormData) {
  const supabase = await createClient();
  await supabase.from("fecha").insert({
    numero: Number(formData.get("numero")),
    categoria_id: String(formData.get("categoria_id") ?? ""),
    fecha_programada: String(formData.get("fecha_programada") ?? ""),
    etapa: String(formData.get("etapa") ?? "liga"),
  });
  revalidatePath("/admin/fechas");
}

export async function actualizarFecha(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase
    .from("fecha")
    .update({
      numero: Number(formData.get("numero")),
      categoria_id: String(formData.get("categoria_id") ?? ""),
      fecha_programada: String(formData.get("fecha_programada") ?? ""),
      etapa: String(formData.get("etapa") ?? "liga"),
    })
    .eq("id", id);
  revalidatePath("/admin/fechas");
}

export async function borrarFecha(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("fecha").delete().eq("id", id);
  revalidatePath("/admin/fechas");
}
