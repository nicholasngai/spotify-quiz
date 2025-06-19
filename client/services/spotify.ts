import { useEffect, useRef, useState } from 'react';
import { TokenBundle } from '../types/spotify';
import {
  clearTokenBundle,
  clearVerifier,
  loadTokenBundle,
  loadVerifier,
  storeTokenBundle,
  storeVerifier,
} from '../utils/localStorage';

const ACCOUNTS_BASE_URL = 'https://accounts.spotify.com/api';
const API_BASE_URL = 'https://api.spotify.com';

const CLIENT_ID = '6f335e84feea4d1d99bec6e126bdc17d';
const SCOPE = 'playlist-read-private playlist-read-collaborative user-read-private streaming';
const REDIRECT_URI = `${window.location.protocol}//${window.location.host}/auth/callback`;

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
  product: string;
}>;

async function getCurrentUsersProfile(accessToken: string): Promise<GetCurrentUsersProfileResponse> {
  const res = await fetch(`${API_BASE_URL}/v1/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (res.status === 401) {
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
  if (res.status === 401) {
    throw new NotAuthedError();
  }
  if (!res.ok) {
    throw new Error(`Not-OK status ${res.status} from /v1/me`);
  }
  return await res.json();
}

export type PlaylistTrack = Readonly<{
  track: Readonly<{
    id: string;
    name: string;
    album: Readonly<{
      images: ReadonlyArray<{
        url: string;
      }>;
    }>;
    duration_ms: number;
  }>;
}>;

export type GetPlaylistTracksResponse = Readonly<{
  total: number;
  items: ReadonlyArray<PlaylistTrack>;
}>;

async function getPlaylistTracks(
  accessToken: string,
  playlistId: string,
  limit: number,
  offset: number,
): Promise<GetPlaylistTracksResponse> {
  const res = await fetch(
    `${API_BASE_URL}/v1/playlists/${encodeURIComponent(playlistId)}/tracks?limit=${limit}&offset=${offset}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
  if (res.status === 401) {
    throw new NotAuthedError();
  }
  if (!res.ok) {
    throw new Error(`Not-OK status ${res.status} from /v1/me`);
  }
  return await res.json();
}

async function play(
  accessToken: string,
  deviceId?: string,
  {
    trackIds,
    contextUri,
    offset,
    positionMs,
  }: { trackIds?: string[]; contextUri?: string; offset?: number; positionMs?: number } = {},
): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/v1/me/player/play${deviceId !== undefined ? `?device_id=${deviceId}` : ''}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        context_uri: contextUri,
        uris: trackIds?.map((id) => `spotify:track:${id}`),
        offset,
        position_ms: positionMs,
      }),
    },
  );
  if (res.status === 401) {
    throw new NotAuthedError();
  }
  if (!res.ok) {
    throw new Error(`Not-OK status ${res.status} from /v1/me/player/play`);
  }
}

function useSpotify() {
  const [tokenBundle, setTokenBundle] = useState<TokenBundle | null | undefined>();
  const [currentUsersProfile, setCurrentUsersProfile] = useState<GetCurrentUsersProfileResponse | null | undefined>();
  const refreshAccessTokenResultsRef = useRef<Record<string, Promise<TokenBundle>>>({});

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
  const loadTokenBundleFromAuthCallback = async () => {
    /* Get code. */
    const params = new URLSearchParams(window.location.search);
    const authCode = params.get('code');
    if (authCode == null) {
      // TODO Handle error state.
      throw new Error('redirecting');
    }

    /* Get verifier. */
    const verifier = loadVerifier();
    if (verifier == null) {
      // TODO Handle error state.
      throw new Error('redirecting');
    }

    /* Fetch access token and clear verifier. */
    const tokenBundle = await fetchAccessToken(verifier, authCode);
    clearVerifier();

    return tokenBundle;
  };

  /* Calls refreshAccessToken but in a locked manner and stores it to local
   * storage when complete. */
  const refreshAndStoreAccessToken = async (refreshToken: string) => {
    if (!(refreshToken in refreshAccessTokenResultsRef.current)) {
      refreshAccessTokenResultsRef.current[refreshToken] = (async () => {
        const newTokenBundle = await refreshAccessToken(refreshToken);
        storeTokenBundle(newTokenBundle);
        setTokenBundle(newTokenBundle);
        return newTokenBundle;
      })();
    }
    return await refreshAccessTokenResultsRef.current[refreshToken]!;
  };

  const wrapSpotifyCall2 =
    <T, P1, P2>(func: (accessToken: string, p1: P1, p2: P2) => Promise<T>): ((p1: P1, p2: P2) => Promise<T>) =>
    async (p1, p2) => {
      if (!tokenBundle) {
        throw new NotAuthedError();
      }
      try {
        return await func(tokenBundle.accessToken, p1, p2);
      } catch (e: unknown) {
        if (!(e instanceof NotAuthedError)) {
          throw e;
        }
        /* If an auth error was encountered, attempt to refresh the token and
         * try again. */
        const newTokenBundle = await refreshAndStoreAccessToken(tokenBundle.refreshToken);
        return await func(newTokenBundle.accessToken, p1, p2);
      }
    };

  const wrapSpotifyCall3 =
    <T, P1, P2, P3>(
      func: (accessToken: string, p1: P1, p2: P2, p3: P3) => Promise<T>,
    ): ((p1: P1, p2: P2, p3: P3) => Promise<T>) =>
    async (p1, p2, p3) => {
      if (!tokenBundle) {
        throw new NotAuthedError();
      }
      try {
        return await func(tokenBundle.accessToken, p1, p2, p3);
      } catch (e: unknown) {
        if (!(e instanceof NotAuthedError)) {
          throw e;
        }
        /* If an auth error was encountered, attempt to refresh the token and
         * try again. */
        const newTokenBundle = await refreshAndStoreAccessToken(tokenBundle.refreshToken);
        return await func(newTokenBundle.accessToken, p1, p2, p3);
      }
    };

  /* Load token bundle and check freshness, unless we are at /auth/callback. */
  useEffect(() => {
    (async () => {
      /* Check for /auth/callback. */
      if (window.location.pathname.startsWith('/auth/callback')) {
        let tokenBundle: TokenBundle;
        let currentUsersProfile: GetCurrentUsersProfileResponse;
        try {
          tokenBundle = await loadTokenBundleFromAuthCallback();
          currentUsersProfile = await getCurrentUsersProfile(tokenBundle.accessToken);
          storeTokenBundle(tokenBundle);
          setTokenBundle(tokenBundle);
          setCurrentUsersProfile(currentUsersProfile);
          window.history.replaceState({}, '', '/');
          return;
        } catch {
          /* We failed to load. Let's proceed as if /auth/callback weren't
           * there. */
          window.history.replaceState({}, '', '/');
        }
      }

      /* Attempt to load token bundle. If nothing in local storage, then we
       * aren't logged in. */
      let tokenBundle = loadTokenBundle();
      if (!tokenBundle) {
        setTokenBundle(null);
        setCurrentUsersProfile(null);
        return;
      }

      /* Load current user profile. */
      let currentUsersProfile: GetCurrentUsersProfileResponse;
      try {
        currentUsersProfile = await getCurrentUsersProfile(tokenBundle.accessToken);
      } catch (e: unknown) {
        if (!(e instanceof NotAuthedError)) {
          throw e;
        }

        /* If an auth error was encountered, attempt to refresh the token and
         * try again. */
        try {
          tokenBundle = await refreshAccessToken(tokenBundle.refreshToken);
          currentUsersProfile = await getCurrentUsersProfile(tokenBundle.accessToken);
        } catch {
          /* Still failed. The token is stale and we will set the state to
           * null. */
          clearTokenBundle();
          setTokenBundle(null);
          setCurrentUsersProfile(null);
          return;
        }

        /* Store the newly fetched token bundle. */
        storeTokenBundle(tokenBundle);
      }

      setTokenBundle(tokenBundle);
      setCurrentUsersProfile(currentUsersProfile);
    })();
  }, []);

  return {
    initiateOAuth2Flow,
    tokenBundle,
    currentUsersProfile,
    getCurrentUsersPlaylists: wrapSpotifyCall2(getCurrentUsersPlaylists),
    getPlaylistTracks: wrapSpotifyCall3(getPlaylistTracks),
    play: wrapSpotifyCall2(play),
  };
}

export default useSpotify;
