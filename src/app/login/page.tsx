import Link from "next/link";
import TechnicalLoginForm from "@/components/TechnicalLoginForm";

const REASONS: Record<string, string> = {
  access_revoked: "Tu acceso a este gestor no está activo.",
  invalid_invitation:
    "El enlace de acceso venció o no es válido. Ábrelo nuevamente desde JuanSGuzman.",
  link_used: "Este enlace ya fue utilizado. Genera uno nuevo desde JuanSGuzman.",
  identity_conflict:
    "No pudimos vincular tu identidad automáticamente. Contacta a soporte.",
  access_error:
    "No pudimos iniciar la sesión. Inténtalo nuevamente desde JuanSGuzman.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const message = reason ? REASONS[reason] : null;
  const technicalLoginEnabled =
    process.env.ALLOW_TECHNICAL_LOGIN === "true" ||
    process.env.NODE_ENV !== "production";
  const accountUrl =
    process.env.JSG_ACCOUNT_URL ?? "https://juansguzman.com/mi-cuenta/";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="absolute inset-y-0 left-0 hidden w-[38%] bg-[var(--forest)] lg:block" aria-hidden="true" />
      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-[2rem] border border-[var(--line)] bg-white/90 shadow-[var(--shadow)] lg:grid-cols-[0.85fr_1.15fr]">
        <section className="hidden flex-col justify-between bg-[var(--forest)] p-10 text-white lg:flex">
          <div className="text-sm font-extrabold tracking-[0.18em] uppercase text-[var(--apricot)]">Juan S. Guzmán</div>
          <div>
            <p className="text-4xl font-extrabold leading-tight tracking-[-0.05em]">Menos pendientes.<br />Más claridad.</p>
            <p className="mt-4 max-w-xs text-sm leading-6 text-white/65">Un sistema sencillo para capturar, decidir y avanzar en lo que importa.</p>
          </div>
          <p className="text-xs text-white/50">Taller de calma digital</p>
        </section>
        <section className="space-y-6 p-6 sm:p-10 lg:p-12">
        <div className="space-y-2">
          <p className="jsg-kicker">Tu sistema personal</p>
          <h1 className="jsg-page-title">Gestor de tareas</h1>
          <p className="jsg-muted text-sm">
            Los miembros entran directamente desde su cuenta de JuanSGuzman.
          </p>
        </div>

        {message && (
          <p className="text-sm text-red-700" role="alert">
            {message}
          </p>
        )}

        <Link
          href={accountUrl}
          className="jsg-button-primary block w-full py-3 text-center"
        >
          Ir a JuanSGuzman
        </Link>

        {technicalLoginEnabled && (
          <details className="border-t border-[var(--line)] pt-4">
            <summary className="jsg-muted cursor-pointer text-sm font-bold">
              Acceso técnico
            </summary>
            <div className="pt-4">
              <TechnicalLoginForm />
            </div>
          </details>
        )}
        </section>
      </div>
    </main>
  );
}
