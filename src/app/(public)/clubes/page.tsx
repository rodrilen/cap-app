import { createClient } from "@/lib/supabase/server";

export default async function ClubesPage() {
  const supabase = await createClient();
  const { data: clubes } = await supabase
    .from("club")
    .select("id, nombre, direccion, contacto")
    .eq("es_anfitrion", true)
    .order("nombre");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-azul-noche">
          Clubes anfitriones
        </h1>
        <p className="mt-1 text-sm text-azul-noche/60">
          Reciben a los equipos que todavía no tienen sede propia.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {clubes?.map((club) => (
          <div key={club.id} className="rounded border border-azul-noche/10 bg-white p-4">
            <h2 className="font-semibold text-azul-noche">{club.nombre}</h2>
            {club.direccion && (
              <p className="mt-1 text-sm text-azul-noche/60">{club.direccion}</p>
            )}
            {club.contacto && (
              <p className="mt-1 text-sm text-azul-noche/60">{club.contacto}</p>
            )}
          </div>
        ))}
        {!clubes?.length && (
          <p className="text-sm text-azul-noche/40">No hay clubes anfitriones cargados.</p>
        )}
      </div>
    </div>
  );
}
