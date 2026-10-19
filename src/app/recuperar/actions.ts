"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { notificarRecuperacion } from "@/lib/ghl";

export async function pedirRecuperacion(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (email) {
    const admin = createAdminClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    // generateLink devuelve el token sin mandar nada: el mail sale por GHL,
    // que es el canal que ya usa la app.
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
    });

    if (!error && data.properties?.hashed_token) {
      await notificarRecuperacion({
        email,
        urlRecuperacion: `${siteUrl}/recuperar/confirmar?token=${data.properties.hashed_token}`,
      });
    }
  }

  // Siempre la misma respuesta, exista o no la cuenta: si dijéramos "ese mail
  // no está registrado", cualquiera podría averiguar quiénes son capitanes.
  redirect("/recuperar?enviado=1");
}
