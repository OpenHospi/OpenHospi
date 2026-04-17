/**
 * Google Workspace IdP SAML signing certificate — PUBLIC verification key.
 *
 * This is the public half of Google's SAML signing keypair, published by
 * Google at the IdP metadata URL and safe to commit. The private key lives
 * with Google and never leaves their servers; this cert is functionally
 * equivalent to a TLS server certificate or a JWKS public key.
 *
 * Valid until: 2031-04-01
 *
 * Rotation: download a new cert from Google Admin Console → Security → SSO
 * with third party IdPs → OpenHospi Admin, then paste the PEM below and
 * redeploy. No DB migration needed — `ensureAdminSetup` refreshes the
 * stored samlConfig automatically on the next cold start.
 *
 * Inlined as a TypeScript string rather than read from disk with
 * `fs.readFileSync` so Vercel's serverless bundler can't drop it — file-
 * system reads against process.cwd() don't work reliably in Lambda-style
 * deployments.
 */
// eslint-disable-next-line no-secrets/no-secrets -- public SAML verification key, not a secret
export const GOOGLE_SAML_IDP_CERT = `-----BEGIN CERTIFICATE-----
MIIDdDCCAlygAwIBAgIGAZ1PKWW+MA0GCSqGSIb3DQEBCwUAMHsxFDASBgNVBAoTC0dvb2dsZSBJ
bmMuMRYwFAYDVQQHEw1Nb3VudGFpbiBWaWV3MQ8wDQYDVQQDEwZHb29nbGUxGDAWBgNVBAsTD0dv
b2dsZSBGb3IgV29yazELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWEwHhcNMjYwNDAy
MTcwNjQ1WhcNMzEwNDAxMTcwNjQ1WjB7MRQwEgYDVQQKEwtHb29nbGUgSW5jLjEWMBQGA1UEBxMN
TW91bnRhaW4gVmlldzEPMA0GA1UEAxMGR29vZ2xlMRgwFgYDVQQLEw9Hb29nbGUgRm9yIFdvcmsx
CzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpDYWxpZm9ybmlhMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A
MIIBCgKCAQEAtHJAD/QsQJjTqIqNoIFrsDT7y7Fz1k5xlUvRe0wXzT1bcsbaksCwoPjv6/B+5yE+
cHRRBNUS7W4oyEBrKQosvJmVbZjqcP9XUVEuiZZR6pqkrM+PWTwYbbYU0AQUpO4X9mH2/6Q+GfiY
b+Gsn/ULJReOFhDMmtrPkbNXa9/8TM0p8Dq4PmyYQ+knDERVRS6FZu1qKZ/JLiHHLZx7UnJEFx9W
qECPhFfJMB35xq3iy5T1U282kWnJ4QWPZglIJwLEtBA0TkOoznh2DYcmxWm7g+O0Us6Ro3UzR4cU
4OvcM+Z07Qlp2rnRsSz5FttfD8ki/poiYFgnhlskvWuISml/awIDAQABMA0GCSqGSIb3DQEBCwUA
A4IBAQCmwtEqtc4VyjCPLdlNtcdeVyi0UNKa7ZdEq3rWgUnVPvxo7KpNnUN2qqHrEeRNmqyH3LFc
AmUNcTcOhhdE0q2QqiJsYn2NL7OsO1RRT20Ivej1d64pmv6N+/itPiwezS0WA8v8URfSVIx+EPEp
vi42HmMz56tgWGilQbdb23H//2YoJUfCJf6ZGfO0CrQEiw/ZjK7b3dYlwgRUiNUijEoeedQcOSyJ
CiarwDZXM8Hyw/TBfYJhV/HeGTnkPaB4M9RJ9JdukaMQ/tngqPT0WrgtbOoJnHwco7ZtbGOgDAoq
up2EWNMoKvGPy9V8yMlAmO+aqBwBr9GpaAD1WAKgppc/
-----END CERTIFICATE-----
`;
