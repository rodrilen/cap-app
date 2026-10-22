// Hasta que el torneo arranque de verdad, la app pública muestra sólo el
// fixture. La tabla y los rankings estarían todos en cero, y las fichas de
// equipo mostrarían planteles que todavía no están confirmados (Black Padel A
// tiene jugadores de relleno y varios nombres llegaron incompletos desde el
// formulario).
//
// Poner esto en true devuelve tabla de posiciones, rankings, clubes y fichas
// de equipo tal como estaban: vuelven los links del menú, las tarjetas de la
// home y los nombres de equipo clickeables en el fixture. No hay que tocar
// nada más ni borrar código.
//
// El panel de admin no se ve afectado: ahí se sigue viendo y editando todo.
export const SECCIONES_COMPLETAS = false;
