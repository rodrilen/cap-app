import { createClient } from "@/lib/supabase/server";
import { crearCategoria, actualizarCategoria, borrarCategoria } from "./actions";

export default async function CategoriasPage() {
  const supabase = await createClient();
  const { data: categorias } = await supabase
    .from("categoria")
    .select("id, nombre, activa")
    .order("nombre");

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Categorías</h1>

      <div className="flex flex-col gap-3">
        {categorias?.map((categoria) => (
          <form
            key={categoria.id}
            action={actualizarCategoria}
            className="flex flex-wrap items-center gap-2 rounded border border-zinc-200 p-3"
          >
            <input type="hidden" name="id" value={categoria.id} />
            <input
              name="nombre"
              defaultValue={categoria.nombre}
              required
              className="rounded border border-zinc-300 px-2 py-1"
            />
            <label className="flex items-center gap-1 text-sm">
              <input type="checkbox" name="activa" defaultChecked={categoria.activa} />
              Activa
            </label>
            <button type="submit" className="rounded bg-naranja px-3 py-1 text-sm font-medium text-azul-noche">
              Guardar
            </button>
            <button
              type="submit"
              formAction={borrarCategoria}
              className="rounded border border-red-300 px-3 py-1 text-sm text-red-600"
            >
              Borrar
            </button>
          </form>
        ))}
      </div>

      <form
        action={crearCategoria}
        className="flex flex-wrap items-end gap-2 rounded border border-dashed border-zinc-300 p-3"
      >
        <label className="flex flex-col gap-1 text-sm">
          Nombre
          <input name="nombre" required className="rounded border border-zinc-300 px-2 py-1" />
        </label>
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" name="activa" defaultChecked />
          Activa
        </label>
        <button type="submit" className="rounded bg-naranja px-3 py-1 text-sm font-medium text-azul-noche">
          Agregar categoría
        </button>
      </form>
    </div>
  );
}
