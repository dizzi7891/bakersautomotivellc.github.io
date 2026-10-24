# Garage OS — Michigan Repair Documentation Matrix

**Review date:** October 24, 2026  
**Status:** Internal implementation checklist, **not** a legal opinion or certification of compliance.  
**Primary authority:** Michigan Secretary of State Repair Facility Manual (chapter revisions through 2026) and the Motor Vehicle Service and Repair Act.

Official starting points:
- https://www.michigan.gov/sos/industry-services/repair-facilities
- https://www.michigan.gov/sos/resources/forms/repair-facility-manual
- https://www.legislature.mi.gov/ — MCL 257.1332 (written estimates), MCL 257.1334 (final invoice)

## First pass implemented inside Garage OS

| Michigan record consideration | Current local app status | Next requirement |
|---|---|---|
| Facility registration number on documents | Editable Settings value; printed if entered; required-field warning if blank | Verify actual current valid registration and facility scope |
| Written pre-repair estimate for generally $50+ work | Itemized estimate and local staff-entered delivery date/method | Securely retain the original delivered copy, customer paper/electronic election, and proof of delivery |
| Labor time and hourly charges | Individual labor operations with hours/rates | Validate job-specific authorized scope and diagnostic/reassembly terms |
| Parts descriptions, prices and condition | Part lines with qty, price, tax, new OEM/aftermarket, OEM surplus, used, rebuilt or reconditioned condition | Ensure all required part classifications, returns and exceptions are documented |
| Separate shop supply / disposal fees | Fixed-dollar 'other' lines | Document applicable fees in original estimate and verify tax treatment |
| Written/verbal customer authorization | Staff-entered customer name, method, time, approved total | Verified customer identity and evidence trail; this local tool does not authenticate consent |
| Added charges exceeding lesser of 10%/$50 | Checklist comparison against staff-recorded approved total | Approved estimate snapshot, amended estimate and verification of additional consent |
| Electronic estimate acceptance | Consent checkbox and required-field warning | Actual retained consent and customer paper choice; no secure consent capture yet |
| Final invoice with mechanic name/certificate | Settings fields and printed labels | Real certification status validation; trainee/sublet handling |
| Final invoice work completed and facility certification | Work performed, facility designee name and separate signature line | Actual signed certification or written explanation of inability to complete; tamper-evident archive |
| Replaced parts return | Manual parts-return choice | Actual customer rights and component exceptions handling |
| Warranties and restrictions | Work-order warranty notes | Attach legally sound written warranty and exclusions |
| Record retention | Reminder only | Secured backups, access controls, retention policy for minimum required periods; no cloud archive exists |
| Fleet long-term estimate waivers | Not implemented | Signed dated customer waiver with amount ceiling/expiration, secure record retention |

## Important limitations

The app is a GitHub Pages static, local-first prototype. It cannot verify signatures, detect a current license, preserve legal evidence, secure confidential documents across users, or ensure statutory compliance by itself. Approval names and 'Paid' statuses are **manually entered** and must never be represented as independently verified authorization or payment. Do not use it as the only record system for your shop.

A vehicle record may be required for at least five years; estimates, invoices, waivers, warranty documents, receipts and other transaction records have at least three-year retention requirements (and longer for still-effective agreements/warranties). Confirm applicable rules before finalizing a retention system.

## VIN / plate identification

- VIN lookup queries NHTSA vPIC public API, for modern 17-character VINs. Year, make, model and specifications are **suggestions** and may be incomplete or inconsistent with the vehicle in the bay.
- License plate and plate state are manually recorded. Automatic plate-to-VIN decoding is **not enabled** until an authorized source and proper permitted-use terms are configured.
- Do not request or use Michigan DMV owner's protected personal information through a public lookup.

## Next milestones

1. Secure shop login, isolated customer records, tamper-evident authorizations and attached copies.
2. Legally reviewed estimate, final invoice, diagnostic/waiver templates and complete Michigan repair-facility disclosures.
3. Provider-backed plate decoding (vehicle specs only; no uncontrolled owner records), rate limits, audit trail and error handling.
4. Real mobile/device UI QA before using the workflows for customer transactions.
