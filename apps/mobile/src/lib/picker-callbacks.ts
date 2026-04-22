/**
 * Cross-screen callback registry for formSheet picker routes.
 *
 * Pickers push a formSheet modal via `router.push({ params: { callbackId } })`.
 * The parent screen registers a callback for `callbackId`; the modal reads it
 * by id, fires it on select, then dismisses.
 *
 * Callbacks are deleted on dismiss or after being fired. The whole registry
 * lives in-process, so the state never leaks beyond the current app session.
 */

type Callback = (value: unknown) => void;

const callbacks = new Map<string, Callback>();

let nextId = 0;

function createId(): string {
  nextId += 1;
  return `picker-${nextId}-${Date.now().toString(36)}`;
}

function registerPickerCallback<T>(cb: (value: T) => void): string {
  const id = createId();
  callbacks.set(id, cb as Callback);
  return id;
}

function firePickerCallback<T>(id: string, value: T): void {
  const cb = callbacks.get(id);
  if (cb) {
    cb(value);
  }
}

function clearPickerCallback(id: string): void {
  callbacks.delete(id);
}

export { registerPickerCallback, firePickerCallback, clearPickerCallback };
