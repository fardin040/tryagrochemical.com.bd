# Try Agro Chemical Ltd.

## Next.js / Cloudflare migration

The Next.js + TypeScript application provides the website. Public routes (`/`, `/about`, `/products`, `/product/[id]`,
`/dealers`, `/sales-officers`, `/careers`, and `/contact`) preserve the visible
navigation and design while using the migrated assets in `public/`.

## HTML/static output

The public pages are prerendered to HTML during `npm run build`, including the
checked-in product detail pages. They can be served as static Cloudflare Pages
assets without PHP. The contact form, job applications, admin panel, and any
content that must be read from or written to D1 remain JavaScript API/Worker
features because plain HTML cannot process forms or database operations.

If product or job data changes in D1, rebuild and redeploy to refresh the
prerendered HTML pages. Keep the API routes deployed for form submissions and
admin operations.

Install and run locally with `npm install && npm run dev`, lint with
`npm run lint`, or build with `npm run build`. Deploy through OpenNext using `npm run deploy` after replacing
`database_id` in `wrangler.toml` and authenticating Wrangler. Apply
the migrations to the D1 database with
`npx wrangler d1 migrations apply try-agrochemical --remote`.

The migration includes the original data entities (products, pages, settings,
certifications, jobs, applications, messages, dealers, sales officers, and
admins). `lib/data.ts` provides a safe static fallback for the public build;
connect server-side queries to the `DB` binding before enabling production
admin mutations. Protect `/admin` with Cloudflare Access or an application
session.

Public form endpoints are `/api/messages` and `/api/applications`; product
administration is available at `/api/admin/products` (GET/POST/DELETE) and
the `/admin` surface. `lib/db.ts` centralizes parameterized D1 queries and
uses the static catalog only when no binding exists. In a Cloudflare runtime,
wire the Wrangler `DB` binding into the adapter/runtime global (or replace
`getDb()` with the binding accessor supplied by your chosen OpenNext version).
File CV uploads intentionally are not written to local disk: use R2 and store
the object key in `job_applications.resume` for production.

### Media storage

The admin panel supports image uploads through the `MEDIA` R2 binding. Enable
R2 for the Cloudflare account, create the bucket, and deploy:

```bash
npx wrangler r2 bucket create try-agrochemical-media
npm run deploy
```

Uploads are limited to images up to 5 MB and are served through the protected
application media route.

### Admin API token

Set a strong `ADMIN_API_TOKEN` secret in the deployment environment (for
example, `npx wrangler secret put ADMIN_API_TOKEN`). `GET
/api/admin/products` remains public for the current admin UI, but `POST` and
`DELETE` require an exact `x-admin-token` request header matching that secret.
Missing configuration returns `503`; an absent or incorrect header returns
`401`. Never commit the token or expose it in client-side JavaScript.

### Full admin control panel

The `/admin` route provides a protected control panel for settings, pages,
products, categories, jobs, applications, messages, dealers, sales officers,
certifications, dealer applications, and dealer orders. Configure `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and
`ADMIN_SESSION_SECRET` as Cloudflare secrets before signing in. Also protect
`/admin` and `/api/admin/*` with Cloudflare Access; the application session is
the second protection layer.

Set the application credentials interactively:

```bash
npx wrangler secret put ADMIN_USERNAME
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put ADMIN_SESSION_SECRET
```

Use a long random value for `ADMIN_SESSION_SECRET`. In Cloudflare Zero Trust,
create an Access application for the Worker hostname and restrict both
`/admin` and `/api/admin/*` to your administrator email or identity group.

### Dealer ordering

`/login` is the combined administrator/dealer entry point. Dealers submit an
application there; only an administrator can approve it from **Dealer
applications** in `/admin`. Approved dealers sign in to `/dealer-portal` and
can submit orders from the product catalog with delivery address, district,
Upazila, notes, and cash-on-delivery. An unavailable SSLCommerz option is
shown explicitly but cannot be selected successfully. Cash on delivery works
without payment credentials. SSLCommerz is deliberately gated: set
`SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`, and (optionally)
`SSLCOMMERZ_SANDBOX` are reserved for a future integration. Online payment is
currently rejected explicitly; no order is created and no payment is reported
as successful. Use cash on delivery until the SSLCommerz initiation, callback,
and validation flow is added. Apply the new `0002_dealer_orders.sql` and
`0003_dealer_accounts.sql` migrations before using dealer features.
Applications remain review records; changing an
application’s status to `approved` through the admin API creates or reactivates
the separate `dealer_accounts` record using its stored password hash.
Pending/rejected applications never authenticate, and rejected applications
disable any previously created account.

## Requirements

- Node.js 20+
- Cloudflare account with Workers, D1, and optionally R2
- HTTPS through Cloudflare

## Configuration

Configure `ADMIN_API_TOKEN` with Wrangler:
`npx wrangler secret put ADMIN_API_TOKEN`. Never commit production secrets.

## Cloudflare deployment

Recommended settings:

- DNS record: proxy the origin hostname through Cloudflare.
- SSL/TLS mode: **Full (strict)** with a valid origin certificate.
- Always Use HTTPS: enabled.
- Automatic HTTPS Rewrites: enabled.
- Cache static assets such as `/css/*`, `/js/*`, `/images/*`, and `/uploads/*`.
- Do not cache admin routes, forms, or CV downloads.
- Keep CV objects private in R2.

## GitHub safety

Secrets, runtime files, generated uploads, and editor metadata are excluded by `.gitignore`. Never commit Wrangler secrets or production database identifiers.
