// Envío de mail vía la API de GoHighLevel (Conversations), usando el CRM que
// ya usa la organización. GHL exige que el destinatario exista como contacto
// en la sub-cuenta, así que primero se hace upsert del contacto y recién
// después se manda el mensaje.
//
// Docs: https://marketplace.gohighlevel.com/docs/ghl/contacts/upsert-contact
//       https://marketplace.gohighlevel.com/docs/ghl/conversations/send-a-new-message

const GHL_BASE_URL = "https://services.leadconnectorhq.com";

function ghlHeaders() {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Version: "v3",
    Authorization: `Bearer ${process.env.GHL_API_KEY}`,
  };
}

async function upsertContacto(email: string) {
  const res = await fetch(`${GHL_BASE_URL}/contacts/upsert`, {
    method: "POST",
    headers: ghlHeaders(),
    body: JSON.stringify({
      email,
      locationId: process.env.GHL_LOCATION_ID,
      source: "CAP - app de fixture",
    }),
  });

  if (!res.ok) {
    throw new Error(`GHL upsert contact falló (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  return data.contact.id as string;
}

async function enviarEmail(contactId: string, subject: string, html: string) {
  const res = await fetch(`${GHL_BASE_URL}/conversations/messages`, {
    method: "POST",
    headers: ghlHeaders(),
    body: JSON.stringify({
      type: "Email",
      contactId,
      subject,
      html,
      status: "delivered",
      ...(process.env.GHL_EMAIL_FROM ? { emailFrom: process.env.GHL_EMAIL_FROM } : {}),
    }),
  });

  if (!res.ok) {
    throw new Error(`GHL send message falló (${res.status}): ${await res.text()}`);
  }
}

// No tira si falla -- el aviso in-app (tabla `notificacion`) ya cumple el
// requisito funcional; el mail es un plus, no puede trabar la carga del
// resultado si GHL está caído o mal configurado.
export async function notificarResultadoPendiente({
  email,
  equipoVisitanteNombre,
  equipoLocalNombre,
  urlPanel,
}: {
  email: string;
  equipoVisitanteNombre: string;
  equipoLocalNombre: string;
  urlPanel: string;
}) {
  try {
    const contactId = await upsertContacto(email);
    await enviarEmail(
      contactId,
      `CAP: ${equipoLocalNombre} vs ${equipoVisitanteNombre} — resultado para confirmar`,
      `<p>Hola,</p>
       <p>El equipo <strong>${equipoLocalNombre}</strong> cargó el resultado del partido contra
       <strong>${equipoVisitanteNombre}</strong>. Entrá a tu panel para confirmarlo o disputarlo:</p>
       <p><a href="${urlPanel}">${urlPanel}</a></p>
       <p>— CAP, Circuito Abierto de Pádel</p>`,
    );
  } catch (err) {
    console.error("No se pudo enviar el email de notificación vía GHL:", err);
  }
}

// Aviso al admin cuando un capitán visitante disputa un resultado. Mismo
// criterio que arriba: si GHL falla, no bloquea la disputa -- el partido ya
// quedó marcado "disputado" y visible en /admin/partidos de todas formas.
export async function notificarDisputa({
  email,
  equipoLocalNombre,
  equipoVisitanteNombre,
  fechaNumero,
  urlAdmin,
}: {
  email: string;
  equipoLocalNombre: string;
  equipoVisitanteNombre: string;
  fechaNumero: number;
  urlAdmin: string;
}) {
  try {
    const contactId = await upsertContacto(email);
    await enviarEmail(
      contactId,
      `CAP: disputa en Fecha ${fechaNumero} — ${equipoLocalNombre} vs ${equipoVisitanteNombre}`,
      `<p>Hola,</p>
       <p>El capitán de <strong>${equipoVisitanteNombre}</strong> disputó el resultado cargado por
       <strong>${equipoLocalNombre}</strong> en la Fecha ${fechaNumero}.</p>
       <p>Entrá al panel para resolverlo (forzar confirmación, corregir el resultado o marcar walkover):</p>
       <p><a href="${urlAdmin}">${urlAdmin}</a></p>
       <p>— CAP, Circuito Abierto de Pádel</p>`,
    );
  } catch (err) {
    console.error("No se pudo enviar el email de disputa vía GHL:", err);
  }
}
