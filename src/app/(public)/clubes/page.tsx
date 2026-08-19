import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { colorCategoria } from "@/lib/brand";

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
  direccion: string | null;
  equipo: Equipo[];
};

export default async function ClubesPage() {
  const supabase = await createClient();
  const { data: clubesData } = await supabase
    .from("club")
    .select(
      "id, nombre, direccion, equipo:equipo (id, nombre, categoria:categoria_id (nombre), jugador:jugador (id, nombre))",
    )
    .order("nombre");

  const clubes = (clubesData ?? []) as unknown as Club[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-azul-noche">
          Clubes y jugadores
        </h1>
        <p className="mt-1 text-sm text-azul-noche/60">
          Los equipos y jugadores que representan a cada club.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {clubes.map((club) => (
          <div key={club.id} className="rounded border border-azul-noche/10 bg-white p-4">
            <h2 className="font-semibold text-azul-noche">{club.nombre}</h2>
            {club.direccion && (
              <p className="mt-1 text-sm text-azul-noche/60">{club.direccion}</p>
            )}

            <div className="mt-3 flex flex-col gap-2">
              {club.equipo.map((equipo) => (
                <div key={equipo.id} className="flex flex-col gap-1 border-t border-azul-noche/10 pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/equipos/${equipo.id}`}
                      className="text-sm font-medium text-azul-noche hover:underline"
                    >
                      {equipo.nombre}
                    </Link>
                    {equipo.categoria && (
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${colorCategoria(equipo.categoria.nombre)}`}
                      >
                        {equipo.categoria.nombre}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-azul-noche/60">
                    {equipo.jugador.length
                      ? equipo.jugador.map((j) => j.nombre).join(", ")
                      : "Sin jugadores cargados."}
                  </p>
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
