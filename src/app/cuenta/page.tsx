import { ChangePasswordForm } from "./change-password-form";

export default async function CuentaPage({
  searchParams,
}: {
  searchParams: Promise<{ recuperacion?: string }>;
}) {
  const { recuperacion } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-black uppercase tracking-tight text-azul-noche">
        Mi cuenta
      </h1>
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
