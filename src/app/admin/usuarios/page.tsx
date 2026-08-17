import { createClient } from "@/lib/supabase/server";
import { borrarCapitan } from "./actions";
import { CrearCapitanForm } from "./crear-capitan-form";

export default async function UsuariosPage() {
  const supabase = await createClient();
  const [{ data: capitanes }, { data: equipos }] = await Promise.all([
    supabase
      .from("usuario")
      .select("id, email, equipo:equipo_id (nombre)")
      .eq("rol", "capitan")
      .order("email"),
    supabase.from("equipo").select("id, nombre").order("nombre"),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Capitanes</h1>

      <div className="flex flex-col gap-3">
        {capitanes?.map((capitan) => (
          <div
            key={capitan.id}
            className="flex flex-wrap items-center gap-3 rounded border border-zinc-200 p-3"
          >
            <span className="flex-1">{capitan.email}</span>
            <span className="text-sm text-zinc-500">
              {(capitan.equipo as unknown as { nombre: string } | null)?.nombre}
            </span>
            <form action={borrarCapitan}>
              <input type="hidden" name="id" value={capitan.id} />
              <button
                type="submit"
                className="rounded border border-red-300 px-3 py-1 text-sm text-red-600"
              >
                Borrar
              </button>
            </form>
          </div>
        ))}
      </div>

      <CrearCapitanForm equipos={equipos ?? []} />
    </div>
  );
}
