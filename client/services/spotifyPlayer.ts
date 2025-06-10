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

  const waitForTrackChanged = async () => {
    const curState = await playerRef.current!.getCurrentState();
    await new Promise((resolve) => {
      const callback = (newState: Spotify.WebPlaybackState) => {
        if (newState.track_window.current_track.id !== curState?.track_window.current_track.id) {
          playerRef.current!.removeListener('player_state_changed', callback);
          resolve(undefined);
        }
      };
      playerRef.current!.addListener('player_state_changed', callback);
    });
  };

  return {
    ready: state.ready,
    deviceId: state.deviceId,
    getCurrentState: () => playerRef.current!.getCurrentState(),
    waitForTrackChanged: waitForTrackChanged,
    pause: () => playerRef.current!.pause(),
    resume: () => playerRef.current!.resume(),
    seek: (positionMs: number) => playerRef.current!.seek(positionMs),
  };
}

export default useSpotifyPlayer;
