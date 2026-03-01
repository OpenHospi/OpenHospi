# Data Breach Response Plan

**OpenHospi — Internal Document**
**Last updated: March 1, 2026**

---

## 1. Scope

This plan covers the detection, assessment, notification, and response procedures for personal data breaches as defined in Article 4(12) GDPR. It applies to all personal data processed by OpenHospi.

## 2. Breach Definition

A personal data breach is a security incident leading to the accidental or unlawful destruction, loss, alteration, unauthorized disclosure of, or access to, personal data transmitted, stored, or otherwise processed.

Examples:
- Unauthorized access to the database
- Accidental exposure of user data through a bug
- Loss of encryption keys
- Compromised admin account
- Data leaked through a third-party processor

## 3. Detection & Reporting

### Internal Detection
- Monitor Supabase audit logs for unusual access patterns
- Monitor Vercel deployment logs for unauthorized changes
- Review admin audit log (`adminAuditLog` table) for suspicious actions
- Automated alerts from Supabase for failed auth attempts

### User Reports
- Users can report suspected breaches via privacy@openhospi.nl
- Reports via the in-app reporting system

## 4. Assessment (Within 24 Hours)

Upon detection, immediately assess:

1. **Nature of breach**: What data was affected? (profiles, messages, photos, etc.)
2. **Scope**: How many users are affected?
3. **Cause**: How did the breach occur?
4. **Ongoing risk**: Is the breach still active? Can it be contained?
5. **Encryption impact**: Was E2E encrypted data affected? (If so, plaintext was not exposed)
6. **Severity**: High risk to rights and freedoms of individuals?

### Risk Assessment Matrix

| Factor | Low Risk | High Risk |
|--------|----------|-----------|
| Data type | Anonymized/encrypted | Names, emails, addresses |
| Scale | Single user | Multiple users |
| Containment | Immediately contained | Ongoing exposure |
| Reversibility | Data recoverable | Data lost/leaked |

## 5. Containment (Immediate)

1. Revoke compromised credentials/tokens
2. Rotate database passwords if needed
3. Deploy emergency patch if vulnerability-related
4. Activate processing restriction for affected users if needed
5. Preserve evidence (logs, screenshots, timestamps)

## 6. Notification to Autoriteit Persoonsgegevens (Within 72 Hours)

**Required when**: The breach is likely to result in a risk to the rights and freedoms of individuals.

**Not required when**: The breach is unlikely to result in risk (e.g., encrypted data breach where keys are not compromised).

### Notification Portal
- URL: https://autoriteitpersoonsgegevens.nl/nl/meldingsformulier-datalekken
- Email: privacy@openhospi.nl (as notifying contact)

### Information to Include (Art. 33(3))
1. Nature of the breach (categories and approximate number of data subjects)
2. Contact details (privacy@openhospi.nl)
3. Likely consequences of the breach
4. Measures taken or proposed to address the breach

### Template

```
Subject: Data Breach Notification — OpenHospi

Date of detection: [DATE]
Date of breach (if different): [DATE]

Nature: [DESCRIPTION]
Data categories affected: [LIST]
Approximate number of affected users: [NUMBER]

Likely consequences: [DESCRIPTION]

Measures taken:
- [CONTAINMENT ACTIONS]
- [REMEDIATION STEPS]

Contact: privacy@openhospi.nl
```

## 7. Notification to Affected Users (Art. 34)

**Required when**: The breach is likely to result in a HIGH risk to the rights and freedoms of individuals.

**Not required when**:
- Data was encrypted and keys are not compromised
- Subsequent measures ensure high risk is no longer likely
- Individual notification would involve disproportionate effort (use public communication instead)

### Notification Method
- In-app notification (primary)
- Email via noreply@openhospi.nl (secondary)

### User Notification Template

```
Subject: Important: Security Incident Notification

Dear [NAME],

We are writing to inform you of a security incident that may have affected your personal data on OpenHospi.

What happened: [BRIEF DESCRIPTION]

What data was affected: [LIST]

What we have done:
- [ACTIONS TAKEN]

What you can do:
- Review your account settings
- Contact us at privacy@openhospi.nl with any questions

We sincerely apologize for this incident and are taking all necessary steps to prevent it from happening again.

OpenHospi Team
privacy@openhospi.nl
```

## 8. Documentation (Art. 33(5))

All breaches must be documented regardless of whether AP notification is required:

- Date and time of detection
- Date and time of breach (if known)
- Nature and scope
- Categories of data affected
- Number of affected users
- Assessment of risk level
- Containment actions taken
- AP notification (yes/no, with reasoning)
- User notification (yes/no, with reasoning)
- Remediation measures
- Lessons learned

Store documentation in a secure, access-controlled location.

## 9. Post-Incident Review

Within 2 weeks of resolution:

1. Conduct root cause analysis
2. Identify preventive measures
3. Update security controls if needed
4. Update this response plan if gaps were identified
5. Brief relevant team members

## 10. Contact Chain

| Role | Contact | Action |
|------|---------|--------|
| Primary contact | privacy@openhospi.nl | First responder, assessment |
| Technical lead | info@openhospi.nl | Containment, remediation |
| AP notification | autoriteitpersoonsgegevens.nl | Within 72 hours if required |
| User notification | noreply@openhospi.nl | If high risk determined |

## 11. Regular Review

This plan is reviewed and updated:
- Annually (minimum)
- After any breach incident
- When significant platform changes occur
- When new processors are added
