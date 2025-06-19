import Authed from './Authed';
import useSpotify from './services/spotify';
import './App.css';

export type AppProps = Record<string, never>;

function App(props: AppProps) {
  const spotify = useSpotify();

  const handleSpotifyLogin = async () => {
    /* Initiate OAuth2 flow. */
    spotify.initiateOAuth2Flow();
  };

  return (
    <div className="App">
      {spotify.currentUsersProfile === undefined || spotify.tokenBundle === undefined ? (
        <>Loading...</>
      ) : spotify.currentUsersProfile && spotify.tokenBundle !== null ? (
        <Authed
          spotify={spotify}
          userProfile={spotify.currentUsersProfile}
          accessToken={spotify.tokenBundle.accessToken}
        />
      ) : (
        <button type="button" onClick={handleSpotifyLogin}>
          Login
        </button>
      )}
    </div>
  );
}

export default App;
