"use client";

import { useFormStatus } from "react-dom";

// Confirmar y disputar hablan con la base y mandan mails: en 4G eso tarda
// varios segundos sin ninguna señal, y el capitán vuelve a tocar.
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
