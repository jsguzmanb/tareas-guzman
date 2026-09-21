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
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow p-6 space-y-5">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-neutral-900">Gestor de tareas</h1>
          <p className="text-sm text-neutral-600">
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
          className="block w-full text-center bg-neutral-900 text-white rounded-lg py-2 font-medium"
        >
          Ir a JuanSGuzman
        </Link>

        {technicalLoginEnabled && (
          <details className="border-t border-neutral-200 pt-4">
            <summary className="cursor-pointer text-sm text-neutral-500">
              Acceso técnico
            </summary>
            <div className="pt-4">
              <TechnicalLoginForm />
            </div>
          </details>
        )}
      </div>
    </main>
  );
}
