"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function asignarPosicionFinal(formData: FormData) {
  const supabase = await createClient();
  const equipoId = String(formData.get("equipo_id"));
  const posicion = String(formData.get("posicion") ?? "");

  if (!posicion) {
    await supabase.from("posicion_final_equipo").delete().eq("equipo_id", equipoId);
  } else {
    await supabase
      .from("posicion_final_equipo")
      .upsert({ equipo_id: equipoId, posicion });
  }

  revalidatePath("/admin/ranking-equipos");
  revalidatePath("/ranking");
}
