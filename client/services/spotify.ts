import { TokenBundle } from '../types/spotify';

const BASE_URL = 'https://accounts.spotify.com/api';

const CLIENT_ID = '6f335e84feea4d1d99bec6e126bdc17d';
const SCOPE = 'playlist-read-private playlist-read-collaborative';
const REDIRECT_URI = 'http://localhost:5173/auth/callback';

/* Generates a 128-bit, random verifier and its corresponding, base64-encoded challenge. */
export async function generateVerifierAndChallenge(): Promise<{ verifier: string; challenge: string }> {
  /* Generate verifier. */
  const verifier = [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16)).join('');

  /* Generate challenge. Base64 must be URL variant without padding. */
  const challengeBytes = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  const challengeBase64 = btoa(String.fromCharCode(...new Uint8Array(challengeBytes)))
    .replaceAll('=', '')
    .replaceAll('+', '-')
    .replaceAll('/', '_');

  return {
    verifier,
    challenge: challengeBase64,
  };
}

/* Requests an OAuth2 authorization code. */
export function initiateOAuth2Flow(challenge: string): void {
  /* Generate URL. */
  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.search = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: SCOPE,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    redirect_uri: REDIRECT_URI,
  }).toString();

  /* Redirect. */
  window.location.href = authUrl.toString();
}

type AccessTokenResponse = {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string | undefined;
};

/* Requests an OAuth2 access token and refresh token to Spotify resources. */
export async function fetchAccessToken(verifier: string, authCode: string): Promise<TokenBundle> {
  const res = await fetch(`${BASE_URL}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code: authCode,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }),
  });
  if (!res.ok) {
    throw new Error(`Not-OK status ${res.status} from /token`);
  }
  const body: AccessTokenResponse = await res.json();
  return {
    accessToken: body.access_token,
    issueTime: new Date(),
    expirySeconds: body.expires_in,
    refreshToken: body.refresh_token!,
  };
}

/* Refreshes an OAuth2 access token. */
export async function refreshAccessToken(refreshToken: string): Promise<TokenBundle> {
  const res = await fetch(`${BASE_URL}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) {
    throw new Error(`Not-OK status ${res.status} from /api/token`);
  }
  const body: AccessTokenResponse = await res.json();
  return {
    accessToken: body.access_token,
    issueTime: new Date(),
    expirySeconds: body.expires_in,
    refreshToken: body.refresh_token ?? refreshToken,
  };
}
