import { ChangePasswordForm } from "./change-password-form";

export default async function CuentaPage({
  searchParams,
}: {
  searchParams: Promise<{ recuperacion?: string; inicial?: string }>;
}) {
  const { recuperacion, inicial } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-black uppercase tracking-tight text-azul-noche">
        Mi cuenta
      </h1>
      {inicial && (
        <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Estás usando la contraseña que te mandamos por mail. Como se arma con
          el nombre de tu club, cualquiera podría adivinarla: elegí una propia
          para seguir.
        </p>
      )}
      {recuperacion && (
        <p className="rounded border border-green-300 bg-green-50 p-3 text-sm text-green-800">
          Entraste con el link de recuperación. Elegí una contraseña nueva para
          terminar.
        </p>
      )}
      <ChangePasswordForm />
    </div>
  );
}
