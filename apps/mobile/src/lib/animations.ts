import {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  LinearTransition,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from 'react-native-reanimated';

// ── Spring configs ──

export const SPRING_SNAPPY = { damping: 20, stiffness: 300 };
export const SPRING_GENTLE = { damping: 15, stiffness: 150 };
export const SPRING_BOUNCY = { damping: 10, stiffness: 200 };

// ── Timing configs ──

export const TIMING_FAST = { duration: 200 };
export const TIMING_MEDIUM = { duration: 350 };

// ── List animations ──

/** List item fade-in on mount */
export const LIST_ITEM_ENTERING = FadeIn.duration(200);

/** FlashList item layout reorder animation */
export const LIST_LAYOUT_TRANSITION = LinearTransition.springify().damping(20).stiffness(300);

// ── Screen / section animations ──

/** Generic slide from right (push navigation feel) */
export const SLIDE_IN = SlideInRight.springify().damping(20).stiffness(300);

/** Screen fade in */
export const SCREEN_FADE_IN = FadeIn.duration(250);
export const SCREEN_FADE_OUT = FadeOut.duration(150);

/** Content sliding up from bottom */
export const SLIDE_UP = FadeInUp.springify().damping(20).stiffness(300);

/** Content sliding down from top */
export const SLIDE_DOWN = FadeInDown.springify().damping(20).stiffness(300);

// ── Message bubble direction-aware animations ──

/** Own message slides in from right */
export const MESSAGE_OWN_ENTERING = SlideInRight.springify().damping(20).stiffness(300);

/** Other message slides in from left */
export const MESSAGE_OTHER_ENTERING = SlideInLeft.springify().damping(20).stiffness(300);

// ── Onboarding step transitions ──

/** Step exits to the left (advancing forward) */
export const STEP_EXIT_LEFT = SlideOutLeft.duration(250);

/** Step enters from the right (advancing forward) */
export const STEP_ENTER_RIGHT = SlideInRight.duration(250);

/** Step exits to the right (going back) */
export const STEP_EXIT_RIGHT = SlideOutRight.duration(250);

/** Step enters from the left (going back) */
export const STEP_ENTER_LEFT = SlideInLeft.duration(250);

// ── Stagger delay ──

/** Delay between staggered items (profile sections, detail sections) */
export const STAGGER_DELAY = 80;
