import { useState } from 'react';
import { TokenBundle } from '../types/spotify';
import { clearVerifier, loadTokenBundle, loadVerifier, storeTokenBundle, storeVerifier } from '../utils/localStorage';

const ACCOUNTS_BASE_URL = 'https://accounts.spotify.com/api';
const API_BASE_URL = 'https://api.spotify.com';

const CLIENT_ID = '6f335e84feea4d1d99bec6e126bdc17d';
const SCOPE = 'playlist-read-private playlist-read-collaborative';
const REDIRECT_URI = 'http://localhost:5173/auth/callback';

export class NotAuthedError extends Error {
  constructor() {
    super('not authed');
  }
}

/* Generates a 128-bit, random verifier and its corresponding, base64-encoded challenge. */
async function generateVerifierAndChallenge(): Promise<{ verifier: string; challenge: string }> {
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

type AccessTokenResponse = Readonly<{
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string | undefined;
}>;

/* Requests an OAuth2 access token and refresh token to Spotify resources. */
async function fetchAccessToken(verifier: string, authCode: string): Promise<TokenBundle> {
  const res = await fetch(`${ACCOUNTS_BASE_URL}/token`, {
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
async function refreshAccessToken(refreshToken: string): Promise<TokenBundle> {
  const res = await fetch(`${ACCOUNTS_BASE_URL}/token`, {
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

export type GetCurrentUsersProfileResponse = Readonly<{
  id: string;
  display_name: string;
  email: string;
  images: ReadonlyArray<{
    url: string;
  }>;
}>;

async function getCurrentUsersProfile(accessToken: string): Promise<GetCurrentUsersProfileResponse> {
  const res = await fetch(`${API_BASE_URL}/v1/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (res.status == 401) {
    throw new NotAuthedError();
  }
  if (!res.ok) {
    throw new Error(`Not-OK status ${res.status} from /v1/me`);
  }
  return await res.json();
}

export type Playlist = Readonly<{
  id: string;
  name: string;
  description: string;
  images: ReadonlyArray<{
    url: string;
  }>;
}>;

export type GetUsersPlaylistsResponse = Readonly<{
  total: number;
  items: ReadonlyArray<Playlist>;
}>;

async function getCurrentUsersPlaylists(
  accessToken: string,
  limit: number,
  offset: number,
): Promise<GetUsersPlaylistsResponse> {
  const res = await fetch(`${API_BASE_URL}/v1/me/playlists?limit=${limit}&offset=${offset}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (res.status == 401) {
    throw new NotAuthedError();
  }
  if (!res.ok) {
    throw new Error(`Not-OK status ${res.status} from /v1/me`);
  }
  return await res.json();
}

function useSpotify() {
  const [tokenBundle, setTokenBundle] = useState<TokenBundle | null>(loadTokenBundle());

  /* Requests an OAuth2 authorization code. */
  const initiateOAuth2Flow = async () => {
    /* Generate verifier and challenge. */
    const { verifier, challenge } = await generateVerifierAndChallenge();

    /* Store the verifier. */
    storeVerifier(verifier);

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
  };

  /* Handle callback. */
  const handleAuthCallback = async () => {
    /* Get code. */
    const params = new URLSearchParams(window.location.search);
    const authCode = params.get('code');
    if (authCode == null) {
      // TODO Handle error state.
      window.location.replace('/');
      return;
    }

    /* Get verifier. */
    const verifier = loadVerifier();
    if (verifier == null) {
      // TODO Handle error state.
      window.location.replace('/');
      return;
    }

    /* Fetch access token. */
    const tb = await fetchAccessToken(verifier, authCode);

    /* Store token bundle and clear verifier. */
    clearVerifier();
    storeTokenBundle(tb);

    /* Update state. */
    window.location.replace('/');
    setTokenBundle(tb);
  };

  const wrapSpotifyCall0 = <T>(func: (accessToken: string) => Promise<T>): (() => Promise<T>) => {
    return async () => {
      if (!tokenBundle) {
        throw new NotAuthedError();
      }
      try {
        return await func(tokenBundle.accessToken);
      } catch (e: unknown) {
        if (e instanceof NotAuthedError) {
          /* If an auth error was encountered, attempt to refresh the token and
           * try again. */
          const newTokenBundle = await refreshAccessToken(tokenBundle.refreshToken);
          storeTokenBundle(newTokenBundle);
          setTokenBundle(newTokenBundle);
          return await func(newTokenBundle.accessToken);
        } else {
          throw e;
        }
      }
    };
  };

  const wrapSpotifyCall2 = <T, P1, P2>(
    func: (accessToken: string, p1: P1, p2: P2) => Promise<T>,
  ): ((p1: P1, p2: P2) => Promise<T>) => {
    return async (p1, p2) => {
      if (!tokenBundle) {
        throw new NotAuthedError();
      }
      try {
        return await func(tokenBundle.accessToken, p1, p2);
      } catch (e: unknown) {
        if (e instanceof NotAuthedError) {
          /* If an auth error was encountered, attempt to refresh the token and
           * try again. */
          const newTokenBundle = await refreshAccessToken(tokenBundle.refreshToken);
          storeTokenBundle(newTokenBundle);
          setTokenBundle(newTokenBundle);
          return await func(newTokenBundle.accessToken, p1, p2);
        } else {
          throw e;
        }
      }
    };
  };

  return {
    handleAuthCallback,
    initiateOAuth2Flow,
    getCurrentUsersProfile: wrapSpotifyCall0(getCurrentUsersProfile),
    getCurrentUsersPlaylists: wrapSpotifyCall2(getCurrentUsersPlaylists),
  };
}

export default useSpotify;
