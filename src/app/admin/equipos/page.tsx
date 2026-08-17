import { createClient } from "@/lib/supabase/server";
import { crearEquipo, actualizarEquipo, borrarEquipo } from "./actions";

export default async function EquiposPage() {
  const supabase = await createClient();
  const [{ data: equipos }, { data: categorias }, { data: clubes }] = await Promise.all([
    supabase
      .from("equipo")
      .select("id, nombre, categoria_id, club_sede_id, color, logo_url")
      .order("nombre"),
    supabase.from("categoria").select("id, nombre").order("nombre"),
    supabase.from("club").select("id, nombre").order("nombre"),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Equipos</h1>

      <div className="flex flex-col gap-3">
        {equipos?.map((equipo) => (
          <form
            key={equipo.id}
            action={actualizarEquipo}
            className="flex flex-wrap items-center gap-2 rounded border border-zinc-200 p-3"
          >
            <input type="hidden" name="id" value={equipo.id} />
            <input
              name="nombre"
              defaultValue={equipo.nombre}
              required
              className="rounded border border-zinc-300 px-2 py-1"
            />
            <select
              name="categoria_id"
              defaultValue={equipo.categoria_id}
              className="rounded border border-zinc-300 px-2 py-1"
            >
              {categorias?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            <select
              name="club_sede_id"
              defaultValue={equipo.club_sede_id}
              className="rounded border border-zinc-300 px-2 py-1"
            >
              {clubes?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            <input
              name="color"
              defaultValue={equipo.color ?? ""}
              placeholder="Color"
              className="w-24 rounded border border-zinc-300 px-2 py-1"
            />
            <button type="submit" className="rounded bg-naranja px-3 py-1 text-sm font-medium text-azul-noche">
              Guardar
            </button>
            <button
              type="submit"
              formAction={borrarEquipo}
              className="rounded border border-red-300 px-3 py-1 text-sm text-red-600"
            >
              Borrar
            </button>
          </form>
        ))}
      </div>

      <form
        action={crearEquipo}
        className="flex flex-wrap items-end gap-2 rounded border border-dashed border-zinc-300 p-3"
      >
        <label className="flex flex-col gap-1 text-sm">
          Nombre
          <input name="nombre" required className="rounded border border-zinc-300 px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Categoría
          <select name="categoria_id" required className="rounded border border-zinc-300 px-2 py-1">
            {categorias?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Club sede
          <select name="club_sede_id" required className="rounded border border-zinc-300 px-2 py-1">
            {clubes?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Color
          <input name="color" className="w-24 rounded border border-zinc-300 px-2 py-1" />
        </label>
        <button type="submit" className="rounded bg-naranja px-3 py-1 text-sm font-medium text-azul-noche">
          Agregar equipo
        </button>
      </form>
    </div>
  );
}
