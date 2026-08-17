import { createClient } from "@/lib/supabase/server";
import { crearJugador, actualizarJugador, borrarJugador } from "./actions";

export default async function JugadoresPage() {
  const supabase = await createClient();
  const [{ data: jugadores }, { data: equipos }] = await Promise.all([
    supabase.from("jugador").select("id, nombre, equipo_id").order("nombre"),
    supabase.from("equipo").select("id, nombre").order("nombre"),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Jugadores</h1>

      <div className="flex flex-col gap-3">
        {jugadores?.map((jugador) => (
          <form
            key={jugador.id}
            action={actualizarJugador}
            className="flex flex-wrap items-center gap-2 rounded border border-zinc-200 p-3"
          >
            <input type="hidden" name="id" value={jugador.id} />
            <input
              name="nombre"
              defaultValue={jugador.nombre}
              required
              className="rounded border border-zinc-300 px-2 py-1"
            />
            <select
              name="equipo_id"
              defaultValue={jugador.equipo_id}
              className="rounded border border-zinc-300 px-2 py-1"
            >
              {equipos?.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded bg-naranja px-3 py-1 text-sm font-medium text-azul-noche">
              Guardar
            </button>
            <button
              type="submit"
              formAction={borrarJugador}
              className="rounded border border-red-300 px-3 py-1 text-sm text-red-600"
            >
              Borrar
            </button>
          </form>
        ))}
      </div>

      <form
        action={crearJugador}
        className="flex flex-wrap items-end gap-2 rounded border border-dashed border-zinc-300 p-3"
      >
        <label className="flex flex-col gap-1 text-sm">
          Nombre
          <input name="nombre" required className="rounded border border-zinc-300 px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Equipo
          <select name="equipo_id" required className="rounded border border-zinc-300 px-2 py-1">
            {equipos?.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded bg-naranja px-3 py-1 text-sm font-medium text-azul-noche">
          Agregar jugador
        </button>
      </form>
    </div>
  );
}
