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

El envío diario es idempotente durante 24 horas para evitar duplicados si Vercel
repite una ejecución. Si no hay Next Actions activas, el correo se omite.
