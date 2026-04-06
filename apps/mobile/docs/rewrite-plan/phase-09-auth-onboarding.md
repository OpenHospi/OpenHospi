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
- **Skip button**: On optional steps (personality), show clearly labeled "Optional - Skip" button in header (not just small text)
- **Progress persistence**: Save completed step data to MMKV. If app is killed mid-onboarding, resume from last completed step.
- **Validation**: Per-step validation before allowing "Next". Highlight specific invalid fields in red with per-field error message (not generic "Invalid data" alert). Red shake animation on invalid fields.
- **"Why we ask" microcopy**: On identity step, show subtle helper text below fields explaining why we need this info (e.g. "Your name is shown to potential housemates" under name, "Used to verify your age" under birth date)
- **Photo step**: Camera + library integration, drag to reorder, minimum 1 photo enforced. Add **"Photo tips"** helper: "Use a clear photo of your face. This helps housemates know who they're meeting."
- **Photo moderation**: Handle NSFWJS responses -- rejected: "This image can't be uploaded. Please choose a different photo." Flagged: "Photo uploaded. It will be visible after a brief review."
- **Security step**: PIN input with animated dots (`input-otp.tsx`), key generation progress indicator. Brief explanation: "This PIN protects your encrypted messages. Don't forget it."

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

## UX Requirements

### Skeleton loading

- **Login screen**: No skeleton (static UI, no data fetch)
- **Onboarding wizard**: Brief skeleton on `index.tsx` while checking onboarding status from API
- **Security step**: "Generating encryption keys..." progress indicator (not skeleton, but branded spinner with status text)
- **Key recovery**: No skeleton (static PIN input)

### Error handling

- **InAcademia login fails (network)**: "No internet connection. Check your WiFi and try again."
- **InAcademia login fails (auth rejected)**: "Login was cancelled or your institution couldn't verify you. Try again."
- **InAcademia login fails (unknown)**: "Something went wrong. Please try again." + retry button
- **Biometric fails (not recognized)**: "Face ID didn't recognize you. Try again or log in with InAcademia."
- **Biometric fails (not enrolled)**: "Face ID not set up. Log in with InAcademia."
- **Onboarding step validation**: Highlight specific invalid fields in red with per-field error message (not generic "Invalid data" alert)
- **Photo upload fails in onboarding**: Per-photo error with retry icon, "Couldn't upload. Tap to retry."
- **E2EE key generation fails**: "Encryption setup failed. This is needed for secure messaging." + retry button
- **Key recovery wrong PIN**: "Wrong PIN. [n] attempts remaining." (not just shake animation)
- **Key recovery PIN exhausted**: "Too many attempts. Your encryption keys cannot be recovered. You'll need to set up new keys."

### Empty states

- Not applicable for login/onboarding (wizard flow, not data screens)

### Animations

- **Login**: Logo scale-in with spring bounce on mount
- **Login button**: Press scale animation (animated-pressable)
- **Onboarding step transitions**: `SlideInRight`/`SlideOutLeft` horizontal slide
- **Step indicator**: Animated progress fill between dots
- **Step completion**: Brief checkmark flash on completed dot
- **Photo step**: Photo thumbnails fade-in as they upload
- **Security step**: Key generation progress ring animation
- **PIN input**: Dots fill with spring animation, shake on error
- **Key recovery success**: Green checkmark spring scale
- **Biometric success**: Brief green flash overlay

### Haptic feedback

- **Login button press**: `hapticLight()`
- **Login success**: `hapticSuccess()`
- **Login failure**: `hapticError()`
- **Biometric success**: `hapticSuccess()`
- **Biometric failure**: `hapticError()`
- **Onboarding "Next" button**: `hapticLight()`
- **Onboarding step complete**: `hapticSuccess()`
- **Onboarding "Skip" button**: `hapticSelection()`
- **Photo capture**: `hapticLight()`
- **PIN digit entry**: `hapticLight()` (subtle, per digit)
- **PIN correct**: `hapticSuccess()`
- **PIN wrong**: `hapticError()`
- **Key generation complete**: `hapticSuccess()`

### Accessibility

- **Login button**: `accessibilityLabel="Log in with your institution account"`
- **Language picker**: `accessibilityLabel="Change language"` (not icon-only)
- **Onboarding step indicator**: `accessibilityLabel="Step [n] of 7: [step name]"`
- **"Next" button**: `accessibilityLabel="Continue to next step"`
- **"Skip" button**: `accessibilityLabel="Skip this step"`
- **Photo slots**: `accessibilityLabel="Add profile photo [n]"`
- **PIN input dots**: `accessibilityLabel="Enter digit [n] of 6"`
- **All touch targets minimum 44pt**
- **Form fields**: proper `accessibilityLabel` with field purpose (not just placeholder)

### Pull-to-refresh

- Not applicable (wizard/auth flows, not data lists)

---

## Verification Checklist

- [ ] Login shows brand animation with haptic on button press
- [ ] Specific error messages for each login failure type
- [ ] Biometric re-auth with success/failure haptic and specific errors
- [ ] Onboarding loads with brief skeleton while checking status
- [ ] Step transitions are smooth horizontal slides with haptic
- [ ] Step indicator animates progress between dots
- [ ] Skip works on optional step with haptic
- [ ] Per-field validation errors (red highlight, not generic alert)
- [ ] Photo upload with per-photo error/retry
- [ ] E2EE key setup with progress indicator and specific error handling
- [ ] Progress persists in MMKV across app kills
- [ ] PIN input with per-digit haptic, shake on error, specific error messages
- [ ] Key recovery exhaustion shows clear warning
- [ ] All buttons have accessibilityLabel
- [ ] All touch targets minimum 44pt
