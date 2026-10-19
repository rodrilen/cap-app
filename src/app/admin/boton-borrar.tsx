"use client";

// Los borrados del admin son definitivos y el botón vive dentro del mismo
// formulario que "Guardar", así que un toque de más (sobre todo en el
// teléfono) se lleva puesto un club o un partido sin aviso.
export function BotonBorrar({
  formAction,
  confirmacion,
}: {
  // Opcional: en algunas pantallas el borrado es el action del formulario y
  // en otras convive con "Guardar" y hay que apuntarlo con formAction.
  formAction?: (formData: FormData) => void | Promise<void>;
  confirmacion: string;
}) {
  return (
    <button
      type="submit"
      formAction={formAction}
      onClick={(e) => {
        if (!window.confirm(`${confirmacion}\n\nEsta acción no se puede deshacer.`)) {
          e.preventDefault();
        }
      }}
      className="min-h-11 rounded border border-red-300 px-3 text-sm text-red-600"
    >
      Borrar
    </button>
  );
}
