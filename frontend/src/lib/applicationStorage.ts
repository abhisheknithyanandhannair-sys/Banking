import { ApplicationSnapshot } from "@/types";

const STORAGE_KEY = "banking.application.snapshot";
const STORAGE_VERSION = 2;

export function saveApplicationSnapshot(snapshot: ApplicationSnapshot) {
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...snapshot,
      version: STORAGE_VERSION,
    })
  );
}

export function loadApplicationSnapshot(): ApplicationSnapshot | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as ApplicationSnapshot;
    if (parsed.version !== STORAGE_VERSION) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearApplicationSnapshot() {
  sessionStorage.removeItem(STORAGE_KEY);
}
