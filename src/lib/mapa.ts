// Link a Google Maps para una cancha. En el teléfono abre la app de Maps
// directamente, que es lo que va a hacer la mayoría el domingo a la mañana.
//
// Se busca por nombre + dirección en vez de sólo la dirección: varias canchas
// son más fáciles de encontrar por su nombre comercial (por ejemplo "Sportium
// Alcorta") que por la calle, y si la dirección tuviera un error el nombre
// ayuda a que Maps igual caiga en el lugar correcto.
export function linkMapa(lugar: string, direccion: string | null) {
  if (!direccion) return null;
  const consulta = encodeURIComponent(`${lugar}, ${direccion}`);
  return `https://www.google.com/maps/search/?api=1&query=${consulta}`;
}
