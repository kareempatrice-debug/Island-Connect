# Trans Island Logistics: requirement traceability (final)

Every section of the Application Improvement Brief and all reference images, against what is built.
**Delivered** = built and tested. **Delivered, with limit** = built as far as the app's records allow; the limit is stated.

| Ref | Requirement | Status | How it is met |
|---|---|---|---|
| A2 | Preserve records, processes, palette, logo, bottom bar | Delivered | All changes additive; every report figure identical to the baseline before changes |
| A3.1 | Build on the deployed app; previous-session items | Delivered | Needs Attention, driver-fee rule, partner and driver ledgers, search, receipt photos built here |
| A3.2 | Only the driver fee mandatory; other job costs optional | Delivered | Required driver fee; optional costs added only when paid; per-job contribution |
| A3.3 | 50/50; who paid; partner transaction history; no outstanding-distribution widget | Delivered | Partner Transactions; Record transfer to Kareem (50% of job profit); payout widgets removed |
| A3.4 | No part-payments; one set of calculations; no double counting | Delivered | Full-balance payments; one calculation layer; transfers never costs; service records saved once |
| A3.5 | Keep historical capital; show discrepancies; audit trail | Delivered | EC$3,656.51 difference shown, not corrected; every change in Activity Log |
| A3.6 | Manage tab; no Customers in Manage | Delivered | Customers via Reports and the name menu |
| A4 | Audit, plan, modules, rollback, tests | Delivered | See deployment notes |
| B1 | Home/Manage, building icon, eye icon, Title Case, Financial Reports, Insights in Reports | Delivered | |
| B2 | Grouped Reports home | Delivered | Four groups as references 1–3 |
| C1–C5 | Financial Overview: six metrics, trends, Profit Breakdown, Expense Analysis, efficiency, observations | Delivered | Month/Quarter/Year/All breakdown; collapsible lists and tables |
| D1–D2 | Financial Reports: year, Q1–Q4, annual Generate, PDF/Excel/CSV, scope, quarterly email, Final/Provisional | Delivered | |
| D3–D4 | Cash flow: 30/60/90, scenarios, swipe charts, expandable sections, partner transfers, confirmed balance | Delivered | |
| E1–E3 | Route Performance overview, chart/table swipe, cards, insights | Delivered | |
| F1–F3 | Load Performance: six indicators, three leaders with sample sizes, rankings, cards, table | Delivered | |
| G1–G2 | Fleet Performance overview, chart swipe, vehicle cards, per-day and per-km measures | Delivered, with limit | Utilisation is by day (no tracking); no formal ROI until asset values and depreciation are recorded |
| H1–H5 | Customer Performance, ranking + scatter, payment-health bands, Customer 360°, customer list with search/filters/sorts | Delivered | Duplicate names flagged, never merged |
| I1–I3 | Capital & Investment tabs, by-truck assets, transactions, cumulative chart, scenario | Delivered, with limit | Book value and resale estimates not recorded, so not shown |
| J1–J2 | Compact ownership, partner cards, by-truck contribution blocks | Delivered | |
| K1–K6 | Insights six screens incl. Action Centre and scenario sliders | Delivered | Missing work shown as unknown, never idle |
| L1–L2 | Receivables overview, age vs days past due, Send Reminder (WhatsApp/Email), swipe Remind | Delivered, with limit | Logged as "prepared"; delivery cannot be confirmed by the app |
| M1 | Manage groups and hubs | Delivered | |
| M2–M3 | Bookings counts, Day/Week/Month calendar, Tentative/Confirmed/Unavailable, cards, conflicts | Delivered | One-tap invoice step kept |
| N1 | Fleet dashboard and vehicle profiles (White Knight, Big Blue) | Delivered | |
| N2 | Fuel form: driver, receipt photo, validation | Delivered, with limit | Receipt stored as a photo, not read automatically (as agreed) |
| N3 | Maintenance & Compliance: date vs mileage, intervals, 60/30/14/7 alerts | Delivered | |
| N4 | Service history from Fleet, linked to the ledger | Delivered | One expense record; optional next-service update |
| N5 | Cost allocation, utilisation, document folders with versions | Delivered | |
| N6 | Incidents and breakdowns; availability; fleet report | Delivered | |
| O1 | Business Settings categories (no tax ID, registration number, registered name) | Delivered | Reporting basis replaced by the fixed January–December financial year |
| O2 | Route pricing cards, optional costs, overrides | Delivered | Add route; suggested optional costs; expected contribution |
| O3 | Report and backup notification settings | Delivered | Recipients, quarterly/annual switches, test email, backup failure alerts |
| P1 | Team & Permissions: statuses, single-use invitations | Delivered | 72-hour single-use link by WhatsApp, email or copy |
| P2 | Data Management: overview, backups, import/export, data quality, recovery | Delivered | Restore test checks the latest copy is readable |
| P3 | Per-user notification preferences | Delivered, with limit | Phone alerts and report emails only, because those are the channels the app has |
| P4 | Account & Security: passkeys, password, devices, activity | Delivered | Signing a device out is separate from removing a passkey |
| P5 / P5.1 | Appearance; Home sections and Quick Actions configurable | Delivered | |
| P6 | Account menu | Delivered | |
| Dashboard | Home redesign | Delivered | |
| Q1 | One documented calculation layer | Delivered | CALCULATIONS.md |
| Q2 | Data quality, history protection | Delivered | Issued invoices never recalculated |
| Q3 | Acceptance tests | Delivered | Baseline identical; 71 screens and states checked on a small phone with no errors or overflow; end-to-end tests on a real server |
