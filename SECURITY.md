# Security Policy

## Supported Versions

OpenHospi is currently in active early development. Security updates are applied to the latest version on the `main`
branch only.

| Version | Supported          | 
|---------|--------------------|
| latest  | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in OpenHospi, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please use [GitHub Security Advisories](https://github.com/rubentalstra/OpenHospi/security/advisories/new) to
report the vulnerability privately.

### What to include

- A description of the vulnerability
- Steps to reproduce the issue
- The potential impact
- Any suggested fixes (optional)

### What to expect

- **Acknowledgement:** We will acknowledge your report within 48 hours.
- **Updates:** We will provide status updates as we investigate and work on a fix.
- **Resolution:** Once the vulnerability is confirmed and fixed, we will release a patch and credit you (unless you
  prefer to remain anonymous).
- **Declined reports:** If the reported issue is not considered a vulnerability, we will explain why.

## Scope

The following areas are in scope for security reports:

- Authentication and session management (Better Auth, SURFconext SSO)
- Row-Level Security (RLS) policy bypasses
- Data exposure or unauthorized access to user data
- Cross-site scripting (XSS), injection, or CSRF vulnerabilities
- Dependencies with known vulnerabilities

## Out of Scope

- Issues in third-party services (Supabase, Vercel, SURFconext) — report those to the respective providers
- Denial of service attacks
- Social engineering
- Issues that require physical access to a user's device
