import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { colorCategoria } from "@/lib/brand";
import { linkMapa } from "@/lib/mapa";
import { MOSTRAR_CLUBES, SECCIONES_COMPLETAS } from "@/lib/secciones";

type Jugador = { id: string; nombre: string };
type Equipo = {
  id: string;
  nombre: string;
  categoria: { nombre: string } | null;
  jugador: Jugador[];
};
type Club = {
  id: string;
  nombre: string;
  sede: string | null;
  direccion: string | null;
  equipo: Equipo[];
};

export default async function ClubesPage() {
  // Oculta mientras MOSTRAR_CLUBES esté en false (ver src/lib/secciones.ts).
  if (!MOSTRAR_CLUBES) notFound();

  const supabase = await createClient();
  const { data: clubesData } = await supabase
    .from("club")
    .select(
      "id, nombre, sede, direccion, equipo:equipo (id, nombre, categoria:categoria_id (nombre), jugador:jugador (id, nombre))",
    )
    .order("nombre");

  const clubes = (clubesData ?? []) as unknown as Club[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-azul-noche">
          {SECCIONES_COMPLETAS ? "Clubes y jugadores" : "Clubes y canchas"}
        </h1>
        <p className="mt-1 text-sm text-azul-noche/70">
          {SECCIONES_COMPLETAS
            ? "Los equipos y jugadores que representan a cada club."
            : "Dónde juega de local cada club y qué equipos presenta."}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {clubes.map((club) => (
          <div key={club.id} className="rounded border border-azul-noche/10 bg-white p-4">
            <h2 className="font-semibold text-azul-noche">{club.nombre}</h2>

            {/* La cancha sólo se aclara cuando no se llama igual que el club,
                para no repetir "Pintados — Pintados". */}
            {club.sede && (
              <p className="mt-1 text-sm text-azul-noche">
                Juega en <strong className="font-semibold">{club.sede}</strong>
              </p>
            )}
            <p className="mt-0.5 text-sm text-azul-noche/70">
              {club.direccion ? (
                <a
                  href={linkMapa(club.sede ?? club.nombre, club.direccion)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-azul-noche/20 underline-offset-2 hover:text-naranja hover:decoration-naranja"
                >
                  {club.direccion}
                </a>
              ) : (
                <span className="text-azul-noche/40">Dirección a confirmar</span>
              )}
            </p>

            <div className="mt-3 flex flex-col gap-2">
              {club.equipo.map((equipo) => (
                <div key={equipo.id} className="flex flex-col gap-1 border-t border-azul-noche/10 pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {SECCIONES_COMPLETAS ? (
                      <Link
                        href={`/equipos/${equipo.id}`}
                        className="text-sm font-medium text-azul-noche hover:underline"
                      >
                        {equipo.nombre}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium text-azul-noche">
                        {equipo.nombre}
                      </span>
                    )}
                    {equipo.categoria && (
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${colorCategoria(equipo.categoria.nombre)}`}
                      >
                        {equipo.categoria.nombre}
                      </span>
                    )}
                  </div>
                  {SECCIONES_COMPLETAS && (
                    <p className="text-sm text-azul-noche/70">
                      {equipo.jugador.length
                        ? equipo.jugador.map((j) => j.nombre).join(", ")
                        : "Sin jugadores cargados."}
                    </p>
                  )}
                </div>
              ))}
              {!club.equipo.length && (
                <p className="text-sm text-azul-noche/40">Sin equipos cargados todavía.</p>
              )}
            </div>
          </div>
        ))}
        {!clubes.length && (
          <p className="text-sm text-azul-noche/40">No hay clubes cargados.</p>
        )}
      </div>
    </div>
  );
}
