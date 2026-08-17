"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUsuarioActual } from "@/lib/auth/current-user";

export type CrearCapitanState = {
  error?: string;
  success?: { email: string; password: string };
};

function generarPassword() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

export async function crearCapitan(
  _prevState: CrearCapitanState,
  formData: FormData,
): Promise<CrearCapitanState> {
  const actor = await getUsuarioActual();
  if (actor?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  const email = String(formData.get("email") ?? "").trim();
  const equipoId = String(formData.get("equipo_id") ?? "");
  if (!email || !equipoId) {
    return { error: "Completá email y equipo" };
  }

  const password = generarPassword();
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    return { error: error?.message ?? "No se pudo crear el usuario" };
  }

  const { error: insertError } = await admin.from("usuario").insert({
    id: data.user.id,
    email,
    rol: "capitan",
    equipo_id: equipoId,
  });

  if (insertError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: insertError.message };
  }

  revalidatePath("/admin/usuarios");
  return { success: { email, password } };
}

export async function borrarCapitan(formData: FormData) {
  const actor = await getUsuarioActual();
  if (actor?.rol !== "admin") return;

  const id = String(formData.get("id"));
  const admin = createAdminClient();
  await admin.from("usuario").delete().eq("id", id);
  await admin.auth.admin.deleteUser(id);
  revalidatePath("/admin/usuarios");
}
