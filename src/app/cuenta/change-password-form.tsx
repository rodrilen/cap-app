"use client";

import { useActionState } from "react";
import { cambiarPassword, type CambiarPasswordState } from "./actions";

const initialState: CambiarPasswordState = {};

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(cambiarPassword, initialState);

  if (state.success) {
    return (
      <p className="text-sm text-green-700">
        Contraseña actualizada. La próxima vez que entres, usá la nueva.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Nueva contraseña
        <input
          type="password"
          name="password"
          required
          minLength={8}
          className="rounded border border-azul-noche/20 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Confirmar contraseña
        <input
          type="password"
          name="confirmacion"
          required
          minLength={8}
          className="rounded border border-azul-noche/20 px-3 py-2"
        />
      </label>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-naranja px-4 py-2 font-medium text-azul-noche disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar contraseña"}
      </button>
    </form>
  );
}
