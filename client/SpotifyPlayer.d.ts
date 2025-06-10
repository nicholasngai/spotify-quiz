declare namespace Spotify {
  type PlayerProps = {
    name: string;
    getOAuthToken: (callback: (token: string) => void) => unknown;
    volume: number;
  };

  type WebPlaybackTrack = {
    id: string;
  };

  type WebPlaybackState = {
    position: number;
    duration: number;
    paused: boolean;
    playback_speed: number;
    track_window: {
      current_track: WebPlaybackTrack;
    };
  };

  class Player {
    constructor(props: PlayerProps);

    connect(): void;
    disconnect(): boolean;
    setName(name: string): Promise<void>;
    getCurrentState(): Promise<WebPlaybackState | null>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    seek(positionMs: number): Promise<void>;

    addListener(type: 'ready', callback: ({ device_id: string }) => void): void;
    addListener(type: 'not_ready', callback: ({ device_id: string }) => void): void;
    addListener(type: 'initialization_error', callback: ({ message: string }) => void): void;
    addListener(type: 'authentication_error', callback: ({ message: string }) => void): void;
    addListener(type: 'account_error', callback: ({ message: string }) => void): void;
    addListener(type: 'player_state_changed', callback: (state: webPlaybackState) => void): void;

    removeListener(
      type:
        | 'ready'
        | 'not_ready'
        | 'initialization_error'
        | 'authentication_error'
        | 'account_error'
        | 'player_state_changed',
      callback: Function,
    );
  }
}

declare interface Window {
  onSpotifyWebPlaybackSDKReady(): void;
}
