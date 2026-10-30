// Qué secciones de la app pública están visibles. Se prenden de a una, a
// medida que tienen algo que mostrar: arrancamos sólo con el fixture y vamos
// sumando. Cada una es independiente de las demás.
//
// El panel de admin no se ve afectado por nada de esto: ahí se ve todo.

// Tabla de posiciones por categoría. Prendida desde la fecha 1, para que cada
// equipo vea los puntos que va sumando.
//
// Cuenta sólo los partidos confirmados: uno que está esperando la
// confirmación del visitante todavía no suma. La vista se recalcula en cada
// consulta, así que al confirmarse aparece solo, sin desplegar nada.
export const MOSTRAR_TABLA = true;

// Listado de clubes con su cancha y su dirección, para saber adónde ir.
export const MOSTRAR_CLUBES = true;

// Ranking de jugadores y de equipos. Apagado: el de equipos suma los puntos
// de posición final, así que recién tiene sentido con la temporada avanzada.
export const MOSTRAR_RANKINGS = false;

// Fichas de equipo con el plantel, y la lista de jugadores dentro de Clubes.
// Apagado hasta que los planteles estén confirmados: en Padel Generativo
// todavía hay nombres sin apellido.
//
// Mientras esté apagado, ningún nombre de equipo puede ser un link: llevaría
// a un 404. Afecta al fixture, a la tabla y a Clubes.
export const MOSTRAR_PLANTELES = false;
