// Lo que se ve mientras el servidor arma la página. Next lo muestra apenas se
// toca un link, sin esperar nada: es la diferencia entre "parece que no anda"
// y "está cargando".
//
// Imita la forma de la pantalla que viene (un título y una lista de tarjetas)
// para que el cambio no salte cuando llega el contenido real.
export function Esqueleto({ filas = 4 }: { filas?: number }) {
  return (
    <div className="flex animate-pulse flex-col gap-6" aria-busy="true">
      {/* Para lectores de pantalla, que no ven la animación. */}
      <span className="sr-only">Cargando…</span>
      <div className="h-7 w-56 rounded bg-azul-noche/10" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: filas }).map((_, i) => (
          <div
            key={i}
            className="h-16 rounded border border-azul-noche/10 bg-azul-noche/5"
          />
        ))}
      </div>
    </div>
  );
}
