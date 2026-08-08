export const WELCOME_COMPLETED_KEY = "WelcomeCompleted";

export function isWelcomeCompleted(storage: Pick<Storage, "getItem">) {
  return storage.getItem(WELCOME_COMPLETED_KEY) === "true";
}

export function completeWelcome(storage: Pick<Storage, "setItem">) {
  storage.setItem(WELCOME_COMPLETED_KEY, "true");
}
