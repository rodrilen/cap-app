import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 bg-azul-noche p-8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/isotipo-negativo.svg" alt="CAP" className="h-14" />
      <div className="flex w-full max-w-sm flex-col gap-4 rounded bg-hueso p-6">
        <h1 className="text-lg font-semibold text-azul-noche">Ingresar</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <form action={login} className="flex flex-col gap-4">
          <input type="hidden" name="next" value={next ?? ""} />
          <label className="flex flex-col gap-1 text-sm text-azul-noche">
            Email
            <input
              type="email"
              name="email"
              required
              className="rounded border border-azul-noche/20 bg-white px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-azul-noche">
            Contraseña
            <input
              type="password"
              name="password"
              required
              className="rounded border border-azul-noche/20 bg-white px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="rounded bg-naranja px-4 py-2 font-medium text-azul-noche hover:opacity-90"
          >
            Ingresar
          </button>
        </form>
      </div>
    </main>
  );
}
