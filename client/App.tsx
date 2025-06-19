import Authed from './Authed';
import ErrorMessage from './components/ErrorMessage';
import Loading from './components/Loading';
import useSpotify from './services/spotify';
import { clearTokenBundle } from './utils/localStorage';
import './App.css';

export type AppProps = Record<string, never>;

function App(props: AppProps) {
  const spotify = useSpotify();

  const handleSpotifyLogin = () => {
    /* Initiate OAuth2 flow. */
    spotify.initiateOAuth2Flow();
  };

  const handleSpotifyLogout = () => {
    clearTokenBundle();
    window.location.reload();
  };

  return (
    <div className="App">
      {spotify.currentUsersProfile === undefined || spotify.tokenBundle === undefined ? (
        <Loading />
      ) : spotify.currentUsersProfile && spotify.tokenBundle !== null ? (
        spotify.currentUsersProfile.product === 'premium' ? (
          <>
            <div className="Header">
              <img className="Header__profile-img" src={spotify.currentUsersProfile.images[0]!.url} alt="" />
              {spotify.currentUsersProfile.display_name}
              <button type="button" onClick={handleSpotifyLogout}>
                Logout
              </button>
            </div>
            <Authed spotify={spotify} accessToken={spotify.tokenBundle.accessToken} />
          </>
        ) : (
          <ErrorMessage error="You must have Spotify Premium to use this app!" />
        )
      ) : (
        <button type="button" onClick={handleSpotifyLogin}>
          Login
        </button>
      )}
    </div>
  );
}

export default App;
