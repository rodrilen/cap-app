import { createClient } from "@/lib/supabase/server";
import { crearFecha, actualizarFecha, borrarFecha } from "./actions";

const ETAPAS = ["liga", "semifinal", "final"] as const;

export default async function FechasPage() {
  const supabase = await createClient();
  const [{ data: fechas }, { data: categorias }] = await Promise.all([
    supabase
      .from("fecha")
      .select("id, numero, categoria_id, fecha_programada, etapa")
      .order("numero"),
    supabase.from("categoria").select("id, nombre").order("nombre"),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Fechas</h1>

      <div className="flex flex-col gap-3">
        {fechas?.map((fecha) => (
          <form
            key={fecha.id}
            action={actualizarFecha}
            className="flex flex-wrap items-center gap-2 rounded border border-zinc-200 p-3"
          >
            <input type="hidden" name="id" value={fecha.id} />
            <input
              type="number"
              name="numero"
              defaultValue={fecha.numero}
              required
              className="w-16 rounded border border-zinc-300 px-2 py-1"
            />
            <select
              name="categoria_id"
              defaultValue={fecha.categoria_id}
              className="rounded border border-zinc-300 px-2 py-1"
            >
              {categorias?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            <input
              type="date"
              name="fecha_programada"
              defaultValue={fecha.fecha_programada}
              required
              className="rounded border border-zinc-300 px-2 py-1"
            />
            <select
              name="etapa"
              defaultValue={fecha.etapa}
              className="rounded border border-zinc-300 px-2 py-1"
            >
              {ETAPAS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded bg-naranja px-3 py-1 text-sm font-medium text-azul-noche">
              Guardar
            </button>
            <button
              type="submit"
              formAction={borrarFecha}
              className="rounded border border-red-300 px-3 py-1 text-sm text-red-600"
            >
              Borrar
            </button>
          </form>
        ))}
      </div>

      <form
        action={crearFecha}
        className="flex flex-wrap items-end gap-2 rounded border border-dashed border-zinc-300 p-3"
      >
        <label className="flex flex-col gap-1 text-sm">
          Número
          <input
            type="number"
            name="numero"
            required
            className="w-16 rounded border border-zinc-300 px-2 py-1"
          />
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
          Fecha
          <input
            type="date"
            name="fecha_programada"
            required
            className="rounded border border-zinc-300 px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Etapa
          <select name="etapa" defaultValue="liga" className="rounded border border-zinc-300 px-2 py-1">
            {ETAPAS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded bg-naranja px-3 py-1 text-sm font-medium text-azul-noche">
          Agregar fecha
        </button>
      </form>
    </div>
  );
}
