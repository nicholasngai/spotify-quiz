import { useEffect, useRef, useState } from 'react';

function useSpotifyPlayer(authToken: string | null | undefined) {
  const playerRef = useRef<Spotify.Player>();
  const authTokenRef = useRef(authToken);

  const [state, setState] = useState<
    | {
        ready: false;
        deviceId?: undefined;
      }
    | {
        ready: true;
        deviceId: string;
      }
  >({ ready: false });

  authTokenRef.current = authToken;

  const initPlayer = () => {
    const player = new Spotify.Player({
      name: 'Web Playback SDK Quick Start Player',
      getOAuthToken: (callback) => callback(authTokenRef.current!),
      volume: 0.5,
    });

    player.addListener('ready', ({ device_id }) =>
      setState({
        ready: true,
        deviceId: device_id,
      }),
    );
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
    if (playerRef.current || authToken == null) {
      return;
    }

    if (!window.Spotify?.Player) {
      window.onSpotifyWebPlaybackSDKReady = initPlayer;
    } else {
      initPlayer();
    }
  }, [authToken]);
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
      }
    };
  }, []);

  const waitPlaying = (lengthMs: number) => {
    return new Promise((resolve) => {
      let resolveTimeoutId: number | undefined;
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
  };

  return {
    ready: state.ready,
    deviceId: state.deviceId,
    getCurrentState: () => playerRef.current!.getCurrentState(),
    waitPlaying: waitPlaying,
    pause: () => playerRef.current!.pause(),
    resume: () => playerRef.current!.resume(),
    seek: (positionMs: number) => playerRef.current!.seek(positionMs),
  };
}

export default useSpotifyPlayer;
