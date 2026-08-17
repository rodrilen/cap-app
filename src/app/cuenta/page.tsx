import { ChangePasswordForm } from "./change-password-form";

export default function CuentaPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-black uppercase tracking-tight text-azul-noche">
        Mi cuenta
      </h1>
      <ChangePasswordForm />
    </div>
  );
}
