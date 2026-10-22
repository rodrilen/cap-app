// Qué partes de la app pública están visibles mientras el torneo arranca.
//
// El panel de admin no se ve afectado por nada de esto: ahí se sigue viendo y
// editando todo.

// Tabla de posiciones, rankings, fichas de equipo y planteles.
//
// Siguen apagados hasta que haya resultados: la tabla y los rankings estarían
// todos en cero, y los planteles no están confirmados (Black Padel A tiene
// jugadores de relleno y varios nombres llegaron incompletos del formulario).
//
// Poner esto en true los devuelve tal como estaban: vuelven los links del
// menú, las tarjetas de la home, los nombres de equipo clickeables en el
// fixture y la lista de jugadores de cada equipo en Clubes.
export const SECCIONES_COMPLETAS = false;

// Listado de clubes con su cancha y su dirección, para que cada uno sepa
// adónde tiene que ir a jugar. Va aparte de SECCIONES_COMPLETAS porque esto sí
// sirve desde el primer día, mientras que los planteles todavía no.
export const MOSTRAR_CLUBES = true;
