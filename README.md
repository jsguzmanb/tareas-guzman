This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Captura con Siri y Atajos

La ruta `POST /api/shortcuts/tasks` permite crear tareas en Inbox desde un
Atajo de iPhone. Configura `SHORTCUTS_SECRET` con un valor largo y aleatorio en
las variables de entorno locales y de Vercel.

La solicitud debe incluir:

```http
Authorization: Bearer TU_SECRETO
Content-Type: application/json
```

Y un cuerpo JSON con el texto dictado:

```json
{
  "title": "Comprar leche"
}
```

## Recordatorios por correo

Vercel ejecuta dos cron jobs definidos en `vercel.json`:

- El top 5 diario de Next Actions a las 13:00 UTC.
- La revisión semanal los viernes a las 14:00 UTC.

Configura estas variables en el entorno de producción de Vercel:

- `CRON_SECRET`: secreto usado por Vercel para autenticar los cron jobs.
- `RESEND_API_KEY`: clave de la API de Resend.
- `REMINDER_EMAIL_TO`: dirección que recibirá los recordatorios.
- `REMINDER_EMAIL_FROM`: remitente verificado en Resend. Es opcional durante las pruebas.
- `APP_URL`: URL pública estable de la aplicación. Es opcional en Vercel.

Los destinatarios y horarios ya no son globales: cada usuario configura su
correo, zona horaria y preferencias desde `/settings`. Los cron se ejecutan
cada hora y solo envían cuando coincide la hora local del usuario. La clave de
idempotencia incluye `userId` y fecha local.

## Acceso desde JuanSGuzman

El recorrido normal es un POST firmado desde `/mi-cuenta/` en JuanSGuzman hacia
`POST /api/auth/jsg`. El JWT usa RS256, dura como máximo 60 segundos, lleva
`kid` y se consume una sola vez. Altas, bajas y reactivaciones llegan a
`POST /api/webhooks/jsg-membership` mediante el contrato HMAC de JSG.

Variables nuevas de servidor:

- `ADMIN_EMAIL`: enlaza el usuario técnico existente con el correo de WordPress.
- `ADMIN_TIME_ZONE`: zona IANA inicial del administrador; `UTC` si se omite.
- `ALLOW_TECHNICAL_LOGIN`: `true` únicamente donde deba mostrarse el login alternativo.
- `JSG_ACCOUNT_URL`: página de cuenta desde la que se abre el gestor.
- `JSG_ACCESS_PUBLIC_KEYS_JSON`: objeto JSON `kid -> clave pública PEM`.
- `JSG_MEMBERSHIP_WEBHOOK_SECRET`: secreto HMAC compartido con WordPress.
- `TEST_DATABASE_URL`: PostgreSQL desechable para las pruebas de aislamiento.

La clave privada RS256 nunca entra en esta aplicación. Para rotar claves:

1. Añadir la nueva clave pública con un `kid` nuevo a `JSG_ACCESS_PUBLIC_KEYS_JSON`.
2. Desplegar la aplicación.
3. Cambiar en WordPress la clave privada y `JSG_TASKS_KEY_ID`.
4. Esperar más de 60 segundos antes de retirar la clave pública anterior.

No ejecutes las pruebas de aislamiento contra producción. Prepara primero una
base desechable, aplica allí las migraciones y ejecuta:

```bash
TEST_DATABASE_URL='postgresql://...' npm run test:isolation
```

El envío diario es idempotente durante 24 horas para evitar duplicados si Vercel
repite una ejecución. Si no hay Next Actions activas, el correo se omite.
