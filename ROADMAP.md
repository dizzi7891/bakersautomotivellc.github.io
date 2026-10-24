# Baker's Automotive + Garage OS — Master Roadmap

**Project owner:** Baker's Automotive Repair LLC
**Repository:** `dizzi7891/bakersautomotivellc.github.io`
**Last reviewed:** 2026-10-24

## North star — DO NOT LOSE THIS
Build **Baker's Automotive's own excellent, reliable, prestigious, fully functional website and business operating system first.** Garage OS can later become a product other independent repair shops license or hire Baker's to customize, but commercializing it must **not displace completing the original Baker's shop platform**.

### Priority order (work strictly top to bottom)

#### P0 — Complete the public Baker's website and branding
- [x] Replace fictional shop photos with custom Baker's, FleetCare, and Garage OS emblems.
- [x] Implement responsive black, gold, masculine heritage look with restrained filigree.
- [x] Publish homepage, FleetCare page, and a separate "For Repair Shops" inquiry page.
- [x] Link repair service calls-to-action to estimates, phone, and contact details.
- [ ] **Manual visual QA** on Android/iOS and desktop: verify imagery, contrast, menu, scrolling, layout, accessibility.
- [ ] Confirm accurate business info, actual services, repairs, opening hours and claims everywhere.
- [ ] Upgrade forms from `mailto:` draft to a reliable, anti-spam, permissioned submission/notification backend; capture real inquiry delivery and track new leads.
- [ ] Confirm public deployment and domain/SEO decisions.

**Public site:** https://dizzi7891.github.io/bakersautomotivellc.github.io/

#### P1 — Make Garage OS rock-solid for Baker's day-to-day shop work
- [x] Local-first prototype with customers, vehicles, estimates, inspections, work orders, reports and JSON backup.
- [x] Basic parts + labor + Michigan sales tax calculations, print-ready draft reports and documents.
- [ ] Test the full workflow end-to-end, including edits, deletes, bad inputs, backups, mobile print and PWA/offline behavior.
- [ ] Expand work-order lines and parts inventory: individual parts, quantities, cost, markup, labor operations, labor categories, taxes, discounts and totals.
- [ ] Build a proper repair lifecycle: quote → approval → repair → completed → invoiced → paid; protect against accidental approval/payment claims.
- [ ] Build shop-compliant MI estimate, work order, invoice, authorization, warranty and tax documents; confirm applicable disclosures and statutes before treating docs as legal final versions.
- [ ] Service history by VIN/vehicle, maintenance intervals, reminders, technician assignment and tracking.
- [ ] Real business KPI reporting; distinguish invoiced, approved, unpaid, paid and profit from estimates.

**Current local prototype:** https://dizzi7891.github.io/bakersautomotivellc.github.io/app/

#### P2 — Secure production backend / real cloud app
- [x] Stage initial PostgreSQL/Supabase schema at `backend/supabase-schema.sql` — **not deployed**.
- [ ] Connect a real Supabase or other protected backend account (owner authorization needed).
- [ ] Implement authenticated owner/staff roles, isolated tenant databases/data access controls, audit logs and tested row-level security.
- [ ] Migrate local data safely and offer multi-device synchronization and private cloud backups.
- [ ] Lock down customer records; public GitHub Pages by itself does not make localStorage confidential or cloud-safe.
- [ ] Protect file uploads, VIN/customer details, invoicing and approval audit trails; implement data retention and account recovery.
- [ ] Add payments and subscriptions **only after** safe account/tenant separation and shop billing workflows are reliable.
- [ ] Test with fictional data in staging before putting real customer records into production.

#### P3 — Customer and FleetCare portals
- [ ] Customer login, own-vehicle service history, quote review and secure approve/decline with recorded consent.
- [ ] Fleet dashboard: business organizations, vehicles, inspection schedules, service reminders and reporting.
- [ ] Real requests, bookings, customer communications and notifications.
- [ ] Pilot the proposed **$49/vehicle/month** FleetCare offering (5-vehicle concept) only after inclusions, terms, and online billing are confirmed. Price is **not** an active subscription.

#### P4 — Sell Garage OS / website builds to OTHER garages
- [x] Launch "For Repair Shops" information/lead page, clearly indicating early concept and prototype limitations.
- [ ] Create repeatable website templates with unique, shop-owned branding/assets; no fictional facilities.
- [ ] Build real onboarding and isolated data per customer garage.
- [ ] Write terms, support, maintenance, license/subscription plans, privacy/data handling and pricing.
- [ ] Start with a few invited pilot shops, improve from feedback, then scale.
- [ ] **Do not advertise unbuilt SaaS features as live.**

**Business landing page:** https://dizzi7891.github.io/bakersautomotivellc.github.io/garage-os-for-shops.html

## Operating principles
1. Functional correctness, record integrity and legal compliance beat surface polish.
2. Preserve and enhance the black/gold prestigious identity approved by the owner.
3. Keep every claim grounded in what Baker's actually offers; no invented shop photos or unsupported warranties.
4. Do not put passwords, payment secrets or confidential records into this public repository.
5. Mark work **done only after code is committed and tested**, and distinguish verified code from verified live deployment.
6. Do not assume GitHub Pages supports server-side authentication or secure customer data storage.
7. A third-party shop product is the **later commercialization track**, not the primary workstream.

## Next concrete milestone
**Finish P0 functional contact intake and mobile QA, then prioritize P1 production-grade work orders and P2 secure user accounts/backups.** Never skip to selling subscriptions while Baker's own business workflows are unfinished.
