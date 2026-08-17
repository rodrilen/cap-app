import { createClient } from "@supabase/supabase-js";

// Cliente con la service role key: bypassa RLS por completo. Solo se usa
// del lado del servidor, para operaciones que la API pública de Supabase
// Auth no permite (crear/borrar usuarios de auth). Cada función que lo usa
// debe verificar el rol del actor ANTES de llamarlo.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
