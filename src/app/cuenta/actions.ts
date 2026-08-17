"use server";

import { createClient } from "@/lib/supabase/server";

export type CambiarPasswordState = {
  error?: string;
  success?: boolean;
};

export async function cambiarPassword(
  _prevState: CambiarPasswordState,
  formData: FormData,
): Promise<CambiarPasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirmacion = String(formData.get("confirmacion") ?? "");

  if (password.length < 8) {
    return { error: "La contraseña tiene que tener al menos 8 caracteres." };
  }
  if (password !== confirmacion) {
    return { error: "Las contraseñas no coinciden." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
