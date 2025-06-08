import { useEffect, useState } from 'react';
import useSpotify, { NotAuthedError } from './services/spotify';
import './App.css';

export type AppProps = Record<string, never>;

function App(props: AppProps) {
  const [loading, setLoading] = useState(true);

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

        try {
          const currentProfile = await spotify.getCurrentUsersProfile();
          console.log(currentProfile);
          setLoading(false);
        } catch (e: unknown) {
          if (e instanceof NotAuthedError) {
            setLoading(false);
            return;
          }
        }
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
          <p>Hello world!</p>
          <button onClick={handleSpotifyLogin}>Login</button>
        </>
      )}
    </div>
  );
}

export default App;
