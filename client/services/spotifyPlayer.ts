import { useEffect, useRef, useState } from 'react';

export type SpotifyPlayer = {
  deviceId: string;
  getCurrentState: () => Promise<Spotify.WebPlaybackState | null>;
  waitPlaying: (lengthMs: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
};

function useSpotifyPlayer(authToken: string): SpotifyPlayer | undefined {
  const playerRef = useRef<Spotify.Player>();
  const authTokenRef = useRef(authToken);

  const [deviceId, setDeviceId] = useState<string | undefined>();

  authTokenRef.current = authToken;

  const initPlayer = () => {
    const player = new Spotify.Player({
      name: 'Web Playback SDK Quick Start Player',
      getOAuthToken: (callback) => callback(authTokenRef.current),
      volume: 0.5,
    });

    player.addListener('ready', ({ device_id }) => {
      setDeviceId(device_id);
    });
    player.addListener('initialization_error', ({ message }) => {
      console.error(message);
    });
    player.addListener('authentication_error', ({ message }) => {
      console.error(message);
    });
    player.addListener('account_error', ({ message }) => {
      console.error(message);
    });

    player.connect();
    player.setName('Spotify Guessing Game');

    playerRef.current = player;
  };

  useEffect(() => {
    if (!playerRef.current) {
      if (!window.Spotify?.Player) {
        window.onSpotifyWebPlaybackSDKReady = initPlayer;
      } else {
        initPlayer();
      }
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
      }
    };
  }, []);

  const waitPlaying = (lengthMs: number) =>
    new Promise<void>((resolve) => {
      let resolveTimeoutId: NodeJS.Timeout | number | undefined;
      let resolved = false;
      const callback = (newState: Spotify.WebPlaybackState) => {
        if (resolveTimeoutId !== undefined) {
          clearTimeout(resolveTimeoutId);
        }
        if (resolved) {
          return;
        }

        if (newState.playback_speed === 1) {
          resolveTimeoutId = setTimeout(() => {
            playerRef.current!.removeListener('player_state_changed', callback);
            resolved = true;
            resolve(undefined);
          }, lengthMs);
        }
      };

      playerRef.current!.addListener('player_state_changed', callback);
    });

  if (deviceId === undefined) {
    return undefined;
  }

  return {
    deviceId,
    getCurrentState: () => playerRef.current!.getCurrentState(),
    waitPlaying,
    pause: () => playerRef.current!.pause(),
    resume: () => playerRef.current!.resume(),
    seek: (positionMs: number) => playerRef.current!.seek(positionMs),
  };
}

export default useSpotifyPlayer;
