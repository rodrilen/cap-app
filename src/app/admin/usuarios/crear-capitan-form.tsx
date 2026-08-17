"use client";

import { useActionState } from "react";
import { crearCapitan, type CrearCapitanState } from "./actions";

const initialState: CrearCapitanState = {};

export function CrearCapitanForm({
  equipos,
}: {
  equipos: { id: string; nombre: string }[];
}) {
  const [state, formAction, pending] = useActionState(crearCapitan, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-2 rounded border border-dashed border-zinc-300 p-3"
    >
      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          type="email"
          name="email"
          required
          className="rounded border border-zinc-300 px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Equipo
        <select name="equipo_id" required className="rounded border border-zinc-300 px-2 py-1">
          {equipos.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-naranja px-3 py-1 text-sm font-medium text-azul-noche disabled:opacity-50"
      >
        {pending ? "Creando…" : "Crear capitán"}
      </button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
      {state.success && (
        <p className="w-full text-sm text-green-700">
          Capitán creado: {state.success.email} — contraseña temporal:{" "}
          <code className="rounded bg-black/[.06] px-1.5 py-0.5">
            {state.success.password}
          </code>{" "}
          (copiala y pasásela vos mismo, no se vuelve a mostrar).
        </p>
      )}
    </form>
  );
}
