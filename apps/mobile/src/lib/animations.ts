import { FadeIn, SlideInRight } from 'react-native-reanimated';

// Spring configs
export const SPRING_SNAPPY = { damping: 20, stiffness: 300 };
export const SPRING_GENTLE = { damping: 15, stiffness: 150 };
export const SPRING_BOUNCY = { damping: 10, stiffness: 200 };

// Timing configs
export const TIMING_FAST = { duration: 200 };
export const TIMING_MEDIUM = { duration: 350 };

// Reusable entering/exiting animations for list items
export const LIST_ITEM_ENTERING = FadeIn.duration(200);
export const SLIDE_IN = SlideInRight.springify().damping(20).stiffness(300);
