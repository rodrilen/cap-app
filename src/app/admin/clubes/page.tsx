import { createClient } from "@/lib/supabase/server";
import { crearClub, actualizarClub, borrarClub } from "./actions";

export default async function ClubesPage() {
  const supabase = await createClient();
  const { data: clubes } = await supabase
    .from("club")
    .select("id, nombre, direccion, es_anfitrion, contacto")
    .order("nombre");

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Clubes</h1>

      <div className="flex flex-col gap-3">
        {clubes?.map((club) => (
          <form
            key={club.id}
            action={actualizarClub}
            className="flex flex-wrap items-center gap-2 rounded border border-zinc-200 p-3"
          >
            <input type="hidden" name="id" value={club.id} />
            <input
              name="nombre"
              defaultValue={club.nombre}
              required
              className="rounded border border-zinc-300 px-2 py-1"
            />
            <input
              name="direccion"
              defaultValue={club.direccion ?? ""}
              placeholder="Dirección"
              className="rounded border border-zinc-300 px-2 py-1"
            />
            <input
              name="contacto"
              defaultValue={club.contacto ?? ""}
              placeholder="Contacto"
              className="rounded border border-zinc-300 px-2 py-1"
            />
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                name="es_anfitrion"
                defaultChecked={club.es_anfitrion}
              />
              Anfitrión
            </label>
            <button
              type="submit"
              className="rounded bg-naranja px-3 py-1 text-sm font-medium text-azul-noche"
            >
              Guardar
            </button>
            <button
              type="submit"
              formAction={borrarClub}
              className="rounded border border-red-300 px-3 py-1 text-sm text-red-600"
            >
              Borrar
            </button>
          </form>
        ))}
      </div>

      <form
        action={crearClub}
        className="flex flex-wrap items-end gap-2 rounded border border-dashed border-zinc-300 p-3"
      >
        <label className="flex flex-col gap-1 text-sm">
          Nombre
          <input name="nombre" required className="rounded border border-zinc-300 px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Dirección
          <input name="direccion" className="rounded border border-zinc-300 px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Contacto
          <input name="contacto" className="rounded border border-zinc-300 px-2 py-1" />
        </label>
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" name="es_anfitrion" />
          Anfitrión
        </label>
        <button type="submit" className="rounded bg-naranja px-3 py-1 text-sm font-medium text-azul-noche">
          Agregar club
        </button>
      </form>
    </div>
  );
}
