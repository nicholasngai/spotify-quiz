import { useEffect, useState } from 'react';
import Playlists from './components/Playlists';
import useSpotify, {
  GetCurrentUsersProfileResponse,
  NotAuthedError,
  Playlist,
  PlaylistTrack,
} from './services/spotify';
import './App.css';

export type AppProps = Record<string, never>;

function shuffle<T>(arr: T[]): T[] {
  for (let i = 0; i < arr.length - 1; i++) {
    const j = Math.floor(Math.random() * (arr.length - i)) + i;
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

function App(props: AppProps) {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<GetCurrentUsersProfileResponse | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[] | null>(null);
  const [selectedPlaylistTracks, setSelectedPlaylistTracks] = useState<PlaylistTrack[] | null>(null);
  const [questionToTrackIdx, setQuestionToTrackIdx] = useState<number[]>([]);
  const [questionIdx, setQuestionIdx] = useState<number>(0);

  const spotify = useSpotify();

  /* Simple router. */
  useEffect(() => {
    (async () => {
      if (window.location.pathname.startsWith('/auth/callback')) {
        /* Handle auth callback. */
        // eslint-disable-next-line no-void
        void spotify.handleAuthCallback();
        setLoading(false);
      } else {
        /* Set path to / if we're not already there. */
        if (window.location.pathname !== '/') {
          window.location.replace('/');
        }

        /* Get current profile, and if it fails, we are not logged in. */
        let currentProfile: GetCurrentUsersProfileResponse;
        try {
          currentProfile = await spotify.getCurrentUsersProfile();
        } catch (e: unknown) {
          if (e instanceof NotAuthedError) {
            setLoading(false);
            return;
          } else {
            throw e;
          }
        }

        /* Get playlists. */
        const playlists: Playlist[] = [];
        let totalPlaylists = 0;
        do {
          const res = await spotify.getCurrentUsersPlaylists(50, playlists.length);
          playlists.push(...res.items);
          totalPlaylists = res.total;
        } while (playlists.length < totalPlaylists);

        setUserProfile(currentProfile);
        setPlaylists(playlists);
        setLoading(false);
      }
    })();
  }, []);

  const handleSpotifyLogin = async () => {
    /* Initiate OAuth2 flow. */
    spotify.initiateOAuth2Flow();
  };

  const handlePlaylistSelect = async (playlistId: string) => {
    /* Get tracks. */
    const tracks: PlaylistTrack[] = [];
    let totalTracks = 0;
    do {
      const res = await spotify.getPlaylistTracks(playlistId, 50, tracks.length);
      tracks.push(...res.items);
      totalTracks = res.total;
    } while (tracks.length < totalTracks);

    setSelectedPlaylistTracks(tracks);
    setQuestionToTrackIdx(shuffle([...new Array(tracks.length)].map((_, idx) => idx)).slice(0, 10));
    setQuestionIdx(0);
  };

  return (
    <div className="App">
      {loading ? (
        <>Loading...</>
      ) : (
        <>
          {userProfile ? (
            <>
              <div className="Header">
                <img className="Header__profile-img" src={userProfile.images[0]!.url} />
                {userProfile.display_name}
              </div>
              {playlists && !selectedPlaylistTracks && (
                <Playlists playlists={playlists} onSelect={handlePlaylistSelect} />
              )}
              {playlists && selectedPlaylistTracks && null}
            </>
          ) : (
            <button onClick={handleSpotifyLogin}>Login</button>
          )}
        </>
      )}
    </div>
  );
}

export default App;
