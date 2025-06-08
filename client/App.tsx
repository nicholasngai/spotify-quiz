import { useEffect, useState } from 'react';
import Playlists from './components/Playlists';
import useSpotify, { GetCurrentUsersProfileResponse, NotAuthedError, Playlist } from './services/spotify';
import './App.css';

export type AppProps = Record<string, never>;

function App(props: AppProps) {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<GetCurrentUsersProfileResponse | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

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
          const res = await spotify.getCurrentUsersPlaylists(50, 0);
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
              <Playlists playlists={playlists} />
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
