import { createClient } from "@/lib/supabase/server";

export async function getUsuarioActual() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: usuario } = await supabase
    .from("usuario")
    .select("id, email, rol, equipo_id")
    .eq("id", user.id)
    .single();

  return usuario;
}
