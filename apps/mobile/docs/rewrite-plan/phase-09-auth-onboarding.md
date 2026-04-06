# Phase 9: Auth & Onboarding

> Branded login, engaging 7-step onboarding, key recovery.

## Summary

Rewrite login screen with brand animation. Rewrite onboarding wizard with smooth transitions and progress persistence. Rewrite key recovery with animated PIN input.

---

## Login (`src/app/(auth)/login.tsx`) -- REWRITE

### Layout

- Full-screen branded design
- OpenHospi logo with Reanimated scale-in animation on mount
- Tagline: "Find your room. Verified by your institution."
- **InAcademia login button**: Large, prominent, branded with institution logo
- Trust indicator: "Every user is a verified Dutch student"
- Subtle background pattern or gradient

### Biometric re-auth

On return visits (session exists but expired or locked):

- If biometric enabled: prompt Face ID / fingerprint immediately
- On success: refresh session silently
- On failure: fall back to InAcademia login

### Data

- Uses `signIn()` from `src/lib/auth-client.ts` (genericOAuth with InAcademia)
- Uses `authenticateWithBiometric()` from `src/lib/biometric.ts`

---

## Onboarding Wizard (`src/app/(onboarding)/`)

### Structure

7 steps with horizontal page transitions. Step indicator at top (`step-indicator.tsx`).

| Step | File                   | Content                                          | Required?       |
| ---- | ---------------------- | ------------------------------------------------ | --------------- |
| 1    | `identity-step.tsx`    | First name, last name, birth date, gender        | Yes             |
| 2    | `about-step.tsx`       | Study program, study level, preferred city       | Yes             |
| 3    | `bio-step.tsx`         | Bio text (who are you, what are you looking for) | Yes             |
| 4    | `personality-step.tsx` | Lifestyle tags selection                         | No (skippable)  |
| 5    | `languages-step.tsx`   | Languages spoken (multi-select)                  | Yes             |
| 6    | `photos-step.tsx`      | Profile photos (at least 1 required)             | Yes (1 minimum) |
| 7    | `security-step.tsx`    | E2EE key setup: create PIN, generate device keys | Yes             |

### UX Improvements

- **Smooth transitions**: Horizontal slide animation between steps (Reanimated `SlideInRight`/`SlideOutLeft`)
- **Step indicator**: Animated progress dots with current step highlighted
- **Skip button**: On optional steps (personality), show "Skip" in header
- **Progress persistence**: Save completed step data to MMKV. If app is killed mid-onboarding, resume from last completed step.
- **Validation**: Per-step validation before allowing "Next". Red shake animation on invalid fields.
- **Photo step**: Camera + library integration, drag to reorder, minimum 1 photo enforced
- **Security step**: PIN input with animated dots (`input-otp.tsx`), key generation progress indicator

### Wizard controller (`src/app/(onboarding)/index.tsx`)

Manages step navigation and data collection:

```typescript
// MMKV persistence
const ONBOARDING_STEP_KEY = 'onboarding_current_step';
const ONBOARDING_DATA_KEY = 'onboarding_data';

// Resume from last saved step
const savedStep = mmkv.getNumber(ONBOARDING_STEP_KEY) ?? 0;
```

---

## Key Recovery (`src/app/(app)/(modals)/key-recovery.tsx`) -- REWRITE

### Flow

1. "Enter your 6-digit PIN" prompt
2. PIN input with animated dots (circles that fill on digit entry)
3. On correct PIN: decrypt backup, restore keys, success checkmark animation
4. On wrong PIN: error shake animation on dots, haptic error, "Try again"
5. After 3 failed attempts: show warning about key loss

### Animations

- Dots fill with spring animation as digits are entered
- Error: horizontal shake animation on the dot row + red flash
- Success: green checkmark scales in with spring bounce

---

## Verification Checklist

- [ ] Login screen shows brand animation on mount
- [ ] InAcademia login flow completes successfully
- [ ] Biometric re-auth works on return (when enabled)
- [ ] Onboarding: all 7 steps complete and data saves
- [ ] Onboarding: step transitions are smooth horizontal slides
- [ ] Onboarding: skip works on optional step (personality)
- [ ] Onboarding: progress persists across app kills (MMKV)
- [ ] Onboarding: photo upload works (camera + library)
- [ ] Onboarding: E2EE key setup generates keys and creates PIN backup
- [ ] Key recovery: correct PIN restores keys
- [ ] Key recovery: wrong PIN shows shake animation
- [ ] Haptic feedback on PIN entry and errors
