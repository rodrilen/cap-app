"use client";

import { useFormStatus } from "react-dom";

// Todo formulario que habla con el servidor tarda: en 4G eso son varios
// segundos sin ninguna señal, y la reacción natural es volver a tocar el
// botón. Esto lo deshabilita mientras va y avisa qué está pasando.
export function BotonEnviar({
  children,
  textoPendiente,
  className,
}: {
  children: React.ReactNode;
  textoPendiente: string;
  className: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={`${className} disabled:opacity-50`}>
      {pending ? textoPendiente : children}
    </button>
  );
}
