import { ApiError } from '@/lib/api-client';
import { hapticError } from '@/lib/haptics';

type ShowToastFn = (type: 'error', message: string) => void;

export function createMutationErrorHandler(showToast: ShowToastFn, fallbackMessage?: string) {
  return (error: Error) => {
    const message =
      error instanceof ApiError ? error.message : (fallbackMessage ?? 'Something went wrong');
    showToast('error', message);
    hapticError();
  };
}
