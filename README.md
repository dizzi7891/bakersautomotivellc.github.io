# Baker's Automotive Repair LLC — Website + Garage OS

Live site: https://dizzi7891.github.io/bakersautomotivellc.github.io/

FleetCare: https://dizzi7891.github.io/bakersautomotivellc.github.io/fleet-services.html

Garage OS: https://dizzi7891.github.io/bakersautomotivellc.github.io/app/

## Architecture
- Root `index.html` is the main public repair-services site.
- `fleet-services.html` is the public FleetCare marketing page and illustrative pricing calculator.
- `assets/site.css` and `assets/site.js` provide a shared responsive site design and mailto-based inquiry forms.
- `app/` is a local-first mobile-friendly single-page shop tool, with customer records, vehicle registry, work orders, parts/labor estimate calculations, inspection checklists, reporting, browser printing, SMS message preparation, backup export/import and fictional demo data.
- `app/manifest.webmanifest` and `app/sw.js` support offline use / Add to Home Screen in browsers that support those features.

## Garage OS estimate upgrade (October 2026)
- Itemized labor operations, parts, and other charges with editable quantities and unit prices.
- Automated Michigan parts-tax calculations on designated taxable part rows, separate from untaxed labor, plus optional after-subtotal discounts.
- Live estimate breakdown and printable draft estimates/invoices with all job lines and tax breakdown.
- Vehicle service and inspection history, upcoming service and approval review queues.
- CSV export of locally recorded work orders, JSON backups, and integrity checks on restore.
- Automated calculation and workflow regression tests in `.github/workflows/garage-os-ci.yml` (Node.js test runner).
- Responsive pro-work-order editor in `app/pro-workorders.css` and estimate calculations in `app/estimate-engine.js`.
- **Existing backup compatibility:** legacy jobs without `lineItems` are still calculated from their old labor and parts summary fields; editing a job converts it into itemized data.

## Important limitations
This is a public GitHub Pages static deployment. It cannot securely provide server-side user logins, private multi-device accounts, cloud file storage, paid subscriptions, automatic message sending, or real online appointment submission without backend services. The shop app stores data only in the current browser's localStorage. Do not regard it as a secure multi-user production CRM. Use regular JSON backup exports and never rely on it as the sole source of sensitive repair records. Customer forms open email drafts but do not send automatically.

Labor rate defaults: standard $150/hr, foreign $175/hr. Parts sales tax defaults to 6%; labor is not taxed in the illustrative calculator. Always confirm Michigan compliance, vehicle repair authorization, disclosures, warranties, invoicing and real tax treatment before issuing final shop documents.

Membership pricing $49/vehicle/month is an illustrative pilot proposal, not active payment processing or promised enrollment.

## Future secure production deployment
Connect a protected auth/database service (e.g. Supabase with row-level security), server-side forms, file attachments, digital authorization audit trail, and a payment provider. Do not store API secrets in these public GitHub Pages assets. Replace local data sync logic only after account security and private tables are configured.
