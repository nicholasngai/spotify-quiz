declare namespace Spotify {
  type PlayerProps = {
    name: string;
    getOAuthToken: (callback: (token: string) => void) => unknown;
    volume: number;
  };

  class Player {
    constructor(props: PlayerProps);

    connect(): void;
    disconnect(): boolean;
    setName(name: string): Promise<void>;

    addListener(type: 'ready', callback: ({ device_id: string }) => void): void;
    addListener(type: 'not_ready', callback: ({ device_id: string }) => void): void;
    addListener(type: 'initialization_error', callback: ({ message: string }) => void): void;
    addListener(type: 'authentication_error', callback: ({ message: string }) => void): void;
    addListener(type: 'account_error', callback: ({ message: string }) => void): void;
  }
}

declare interface Window {
  onSpotifyWebPlaybackSDKReady(): void;
}
