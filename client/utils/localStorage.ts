import { TokenBundle, validateTokenBundle } from '../types/spotify';

const VERIFIER_STORAGE_KEY = 'spotify-verifier';
const TOKEN_BUNDLE_STORAGE_KEY = 'spotify-token-bundle';

export function storeVerifier(verifier: string): void {
  window.localStorage.setItem(VERIFIER_STORAGE_KEY, verifier);
}

export function loadVerifier(): string | null {
  return window.localStorage.getItem(VERIFIER_STORAGE_KEY);
}

export function clearVerifier(): void {
  window.localStorage.removeItem(VERIFIER_STORAGE_KEY);
}

export function storeTokenBundle(tokenBundle: TokenBundle): void {
  window.localStorage.setItem(TOKEN_BUNDLE_STORAGE_KEY, JSON.stringify(tokenBundle));
}

export function loadTokenBundle(): TokenBundle | null {
  const tokenBundleJson = window.localStorage.getItem(TOKEN_BUNDLE_STORAGE_KEY);
  if (tokenBundleJson == null) {
    return null;
  }
  const tokenBundleRaw = JSON.parse(tokenBundleJson);
  if (
    typeof tokenBundleRaw !== 'object' ||
    !('issueTime' in tokenBundleRaw) ||
    typeof tokenBundleRaw.issueTime !== 'string'
  ) {
    return null;
  }
  const tokenBundle = {
    ...tokenBundleRaw,
    issueTime: new Date(tokenBundleRaw.issueTime),
  };
  if (!validateTokenBundle(tokenBundle)) {
    return null;
  }
  return tokenBundle;
}

export function clearTokenBundle(): void {
  window.localStorage.removeItem(TOKEN_BUNDLE_STORAGE_KEY);
}
