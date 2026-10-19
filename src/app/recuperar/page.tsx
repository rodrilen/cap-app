import Link from "next/link";
import { pedirRecuperacion } from "./actions";
import { linkWhatsapp } from "@/lib/contacto";

export default async function RecuperarPage({
  searchParams,
}: {
  searchParams: Promise<{ enviado?: string; error?: string }>;
}) {
  const { enviado, error } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 bg-azul-noche p-8">
      <Link href="/" className="flex flex-col items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/isotipo-negativo.svg" alt="CAP" className="h-14" />
      </Link>
      <div className="flex w-full max-w-sm flex-col gap-4 rounded bg-hueso p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-azul-noche">Recuperar acceso</h1>
          <Link href="/login" className="text-sm text-azul-noche/70 hover:text-naranja">
            ‹ Volver
          </Link>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {enviado ? (
          <>
            <p className="text-sm text-azul-noche">
              Si ese email corresponde a una cuenta de capitán, te llega un mail con un
              link para elegir una contraseña nueva. Revisá también el correo no deseado.
            </p>
            <Link
              href="/login"
              className="min-h-11 rounded bg-naranja px-4 text-center text-base font-medium leading-[2.75rem] text-azul-noche hover:opacity-90"
            >
              Volver a ingresar
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-azul-noche/70">
              Poné el email con el que te anotaste y te mandamos un link para elegir una
              contraseña nueva.
            </p>
            <form action={pedirRecuperacion} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1 text-sm text-azul-noche">
                Email
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  className="min-h-11 rounded border border-azul-noche/20 bg-white px-3 text-base"
                />
              </label>
              <button
                type="submit"
                className="min-h-11 rounded bg-naranja px-4 font-medium text-azul-noche hover:opacity-90"
              >
                Mandarme el link
              </button>
            </form>
          </>
        )}

        <a
          href={linkWhatsapp(
            "Hola, soy capitán y no puedo entrar a la app de CAP. ¿Me ayudan?",
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="text-center text-sm text-azul-noche/70 underline hover:text-naranja"
        >
          Prefiero escribirles por WhatsApp
        </a>
      </div>
    </main>
  );
}
