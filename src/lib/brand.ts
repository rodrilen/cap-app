// Codificación de color por categoría y por estado de partido, según el
// Manual de Marca CAP v1.0: C5-C6 (categoría principal 2026) va en Naranja
// Circuito, C7-C8 en Cian Cancha. El manual deja margen para una tercera
// categoría con violeta o amarillo -- de ahí el fallback en Azul Profundo.

export function colorCategoria(nombre: string) {
  if (nombre.includes("C5") || nombre.includes("C6")) {
    return "bg-naranja text-azul-noche";
  }
  if (nombre.includes("C7") || nombre.includes("C8")) {
    return "bg-cian text-azul-noche";
  }
  return "bg-azul-profundo text-hueso";
}

export const ESTADO_LABEL: Record<string, string> = {
  programado: "Programado",
  pendiente_confirmacion: "Sin confirmar",
  confirmado: "Confirmado",
  disputado: "En revisión",
  walkover: "Walkover",
};

export function estadoClasses(estado: string) {
  switch (estado) {
    case "confirmado":
    case "walkover":
      return "bg-azul-profundo text-hueso";
    case "disputado":
      return "bg-red-100 text-red-700";
    default:
      return "bg-black/5 text-azul-noche/70";
  }
}
