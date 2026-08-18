const WHATSAPP_NUMERO = "5491137584264";

export function linkWhatsapp(mensaje: string) {
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`;
}
