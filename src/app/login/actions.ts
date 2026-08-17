"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function destinoValido(next: string | null) {
  if (next && (next.startsWith("/admin") || next.startsWith("/capitan"))) {
    return next;
  }
  return null;
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = destinoValido(String(formData.get("next") ?? ""));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    redirect(`/login?error=${encodeURIComponent("Email o contraseña incorrectos")}`);
  }

  if (next) {
    redirect(next);
  }

  const { data: usuario } = await supabase
    .from("usuario")
    .select("rol")
    .eq("id", data.user.id)
    .single();

  redirect(usuario?.rol === "admin" ? "/admin" : "/capitan");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
