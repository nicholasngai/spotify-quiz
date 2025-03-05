import { useEffect, useState } from 'react';
import * as spotify from './services/spotify';
import { TokenBundle } from './types/spotify';
import { clearVerifier, loadTokenBundle, loadVerifier, storeTokenBundle, storeVerifier } from './utils/localStorage';
import './App.css';

export type AppProps = Record<string, never>;

function App(props: AppProps) {
  const [loading, setLoading] = useState(true);
  const [tokenBundle, setTokenBundle] = useState<TokenBundle | null>(null);

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
    const tb = await spotify.fetchAccessToken(verifier, authCode);

    /* Store token bundle and clear verifier. */
    clearVerifier();
    storeTokenBundle(tb);

    /* Update state. */
    window.location.replace('/');
    setTokenBundle(tb);
    setLoading(false);
  };

  /* Simple router. */
  useEffect(() => {
    if (window.location.pathname.startsWith('/auth/callback')) {
      /* Handle auth callback. */
      // eslint-disable-next-line no-void
      void handleAuthCallback();
    } else {
      /* Set path to / if we're not already there. */
      if (window.location.pathname !== '/') {
        window.location.replace('/');
      }

      /* Try to load token bundle. */
      const tb = loadTokenBundle();
      if (tb != null) {
        setTokenBundle(tb);
      }

      setLoading(false);
    }
  }, []);

  const handleSpotifyLogin = async () => {
    /* Generate verifier and challenge. */
    const { verifier, challenge } = await spotify.generateVerifierAndChallenge();

    /* Store it. */
    storeVerifier(verifier);

    /* Initiate OAuth2 flow. */
    spotify.initiateOAuth2Flow(challenge);
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
