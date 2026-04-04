# OpenHospi Governance & Financial Policy

**Version:** 1.0  
**Effective date:** 2026-03-05  
**Project:** OpenHospi  
**Website:** https://www.openhospi.nl  
**Repository:** https://github.com/OpenHospi/OpenHospi  
**Contact:** [info@openhospi.nl](mailto:info@openhospi.nl)

## 1) Purpose & Principles

OpenHospi exists to make finding student housing in the Netherlands **fair, free, and accessible**.

We operate by these principles:

- **Free for students.** No hidden fees, no premium plans, no ads.
- **No pay-to-win.** No one can pay for more visibility or better chances.
- **Open source by default.** Transparency is a principle, not a feature.
- **Student verification focused on our doelgroep.** Authentication/verification is handled through **InAcademia**.

## 2) People & Roles

### 2.1 Founders / Project Leads

- **Ruben Talstra** — Founder
- **Heino Bosma** — Co-founder

Project leads are responsible for:

- Setting direction and prioritization
- Maintaining governance and safety standards
- Ensuring financial policy compliance
- Appointing/removing maintainers and finance admins

### 2.2 Maintainers

Maintainers are trusted contributors with responsibilities such as:

- Reviewing and merging pull requests
- Managing releases and production changes
- Triaging issues and coordinating contributors

**How maintainers are added/removed**

- Added by project leads after demonstrated consistent contribution and alignment with project values.
- Removed by project leads for inactivity, policy violations, or security/safety concerns.

### 2.3 Contributors

Anyone can contribute via issues, pull requests, translations, documentation, design feedback, etc.

## 3) Decision-Making

We aim for **consensus** first.

If consensus cannot be reached within a reasonable time:

- Project leads make the final decision and document the reasoning (e.g., in an issue, PR, or discussion).

For urgent security or operational incidents, project leads may act immediately (see §10 Emergency Process).

## 4) Code, Licensing & Contributions

- The project is licensed under **GNU AGPL-3.0** (see `LICENSE`).
- Unless explicitly stated otherwise, all contributions are provided under the repository license.
- We do **not** require a CLA at this time. By submitting a contribution, you confirm you have the right to license it
  under AGPL-3.0.

## 5) Financial Setup (How Money Works)

### 5.1 Where funds live

All financial contributions (donations/sponsorships) are handled through **Open Collective** under a **fiscal host** (
currently: Open Source Europe ASBL / Open Collective Europe ecosystem, depending on host onboarding status and platform
configuration).

This means:

- Funds are held and paid out by the fiscal host (not by individuals).
- Spending happens through Open Collective’s expense workflow.
- Transactions are publicly visible (except private payout details required for payments).

### 5.2 Non-profit / volunteer principle

OpenHospi is volunteer-driven.

**No one is paid for their work on the project.**  
That includes (non-exhaustive): software development, design, product work, management, moderation, strategy, marketing,
support.

Funds are used only to **operate and maintain** OpenHospi.

## 6) What Funds MAY Be Used For (Allowed Expenses)

Allowed expenses must be **directly tied to operating OpenHospi**.

Typical allowed categories include:

### 6.1 Infrastructure & platform operations

- Hosting / compute / CDN / storage
- Database services and platform tooling
- Monitoring / logging / uptime tooling
- Email delivery services
- Essential operational SaaS used to run the platform

### 6.2 Domains & DNS

- Domain registration and renewal
- DNS services directly supporting OpenHospi

### 6.3 App store publishing fees

- Apple Developer Program fee
- Google Play Developer fee

### 6.4 Security operations (cost-only)

- Security scanning tools used to protect OpenHospi
- Paid incident-response services **only if** explicitly approved under §8 approvals
- One-time external security review/audit **only if** explicitly approved under §8 approvals

### 6.5 Mandatory fees to run the collective

- Payment processor fees (e.g., Stripe/PayPal fees)
- Fiscal host fees
- Platform fees charged as part of Open Collective hosting

## 7) What Funds MAY NOT Be Used For (Disallowed Expenses)

The following are **not allowed**, even if someone believes they are “helpful”:

- Salaries, wages, stipends, “thank you” payments
- Invoices for development time, design time, consulting time, moderation time, or general project labor
- Gifts, merch for individuals, travel not strictly required for operations
- Personal purchases, personal subscriptions, or anything with mixed private benefit
- Political campaigning or any expense that would violate fiscal host terms
- Anything not directly tied to keeping OpenHospi running

If something is unclear, treat it as **disallowed** until documented approval is given.

## 8) Expense Approval Rules (Anti-abuse / Trust-by-design)

### 8.1 General rules (always)

1. **Receipts required.** Every expense must include a receipt/invoice and a clear explanation.
2. **Public-safe descriptions.** Expense titles/descriptions are public—do not include sensitive personal data.
3. **No self-approval.** An approver may not approve their own expense.
4. **Conflict of interest disclosure.** If an expense benefits a related party (friend/company), it must be disclosed
   and the related person must not approve it.

### 8.2 Two-person rule

To protect community trust, we enforce a two-person rule:

- **≤ €50:** at least **1** finance admin approval
- **> €50:** at least **2** approvals, including at least **1** project lead approval
- **> €250:** **2** approvals required, including **both** project leads (unless one is unavailable; then see §10
  Emergency Process)

### 8.3 What counts as “approval”

- Approvals must happen in the Open Collective expense flow (and optionally linked to an issue/PR for context).

## 9) Transparency Commitments

We commit to:

- Keeping OpenHospi free and non-pay-to-win.
- Publishing financial activity through Open Collective (standard platform transparency).
- Maintaining a public overview of expected operating costs on the website.
- Documenting any policy changes via GitHub pull request.

Sponsor recognition (e.g., logo placement) is:

- A **thank you**, not governance influence
- Not tied to product ranking, visibility, or moderation decisions

## 10) Emergency Process (Security / Outage)

If there is a security incident or major outage requiring immediate spending:

1. A project lead may approve urgent spending up to **€250** with:
   - A short public postmortem note (issue or discussion) explaining why it was urgent
   - A receipt and a “why this was necessary” summary in the expense
2. Any emergency expense still follows **no self-approval**.
3. Emergency spending must be reviewed within **7 days** by the other project lead (or by a maintainer group if one lead
   is unavailable).

Emergency process exists to keep the platform safe—not to bypass normal rules.

## 11) Asset Ownership & Access Controls

To reduce single-person risk, we aim to manage critical assets with shared access:

### 11.1 Critical assets (examples)

- Domain registrar account(s)
- DNS provider
- Hosting provider(s)
- Database provider(s)
- App store accounts
- Email/SMS providers
- Open Collective admin access

### 11.2 Access principles

- Enable **2FA** everywhere.
- Use shared access where possible (organization accounts).
- Maintain a minimal list of people with admin access.
- If a maintainer needs access temporarily, grant least-privilege and remove after use.

## 12) Changes to This Policy

- Changes require agreement of both project leads.
- All changes must be made via GitHub PR (so there is a public audit trail).
- Policy version and effective date must be updated on change.

## 13) If OpenHospi Ever Shuts Down

If OpenHospi is discontinued:

1. Remaining funds will first be used for responsible shutdown costs (final hosting, archiving, notices).
2. After shutdown costs, any remaining balance should be directed to an aligned open-source / digital public good
   initiative, in line with fiscal host rules.
