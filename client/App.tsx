import { useEffect, useState } from 'react';
import Playlists from './components/Playlists';
import useSpotify, {
  GetCurrentUsersProfileResponse,
  NotAuthedError,
  Playlist,
  PlaylistTrack,
} from './services/spotify';
import useSpotifyPlayer from './services/spotifyPlayer';
import './App.css';

const PLAYBACK_LENGTH_MS = 2000;
const PLAYBACK_BUFFER_MS = 250;

export type AppProps = Record<string, never>;

type Question = {
  trackIdx: number;
  startPositionMs: number;
};

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
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [questionIdx, setQuestionIdx] = useState<number>(0);

  const spotify = useSpotify();
  const spotifyPlayer = useSpotifyPlayer(spotify.tokenBundle?.accessToken);

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

    /* Generate questions. */
    const questionToTrackIdxs = shuffle([...new Array(tracks.length)].map((_, idx) => idx)).slice(0, 10);
    const questions = questionToTrackIdxs.map((idx) => ({
      trackIdx: idx,
      /* Choose a random position to seek to. */
      startPositionMs: Math.floor(Math.random() * Math.max(tracks[idx]!.track.duration_ms - PLAYBACK_LENGTH_MS, 0)),
    }));

    setSelectedPlaylistTracks(tracks);
    setQuestions(questions);
    setQuestionIdx(0);
    playTrack(
      tracks![questions![0]!.trackIdx]!.track.id,
      questions![0]!.startPositionMs,
      PLAYBACK_LENGTH_MS,
    );
  };

  const playTrack = async (trackId: string, startPositionMs: number, lengthMs: number) => {
    if (!spotifyPlayer.ready) {
      throw new Error('Cannot play track before spotify player is ready');
    }

    /* Request track to be played. */
    await spotify.play(spotifyPlayer.deviceId, {
      trackIds: [trackId],
      positionMs: startPositionMs,
    });

    /* Allow the song to play for the specified length. */
    await spotifyPlayer.waitPlaying(lengthMs + PLAYBACK_BUFFER_MS);

    /* Pause. */
    await spotifyPlayer.pause();
  };

  const handleReplay = () => {
    playTrack(
      selectedPlaylistTracks![questions![questionIdx]!.trackIdx]!.track.id,
      questions![questionIdx]!.startPositionMs,
      PLAYBACK_LENGTH_MS,
    );
  };

  const handleNextQuestion = () => {
    const nextQuestionIdx = questionIdx + 1;
    setQuestionIdx(nextQuestionIdx);
    playTrack(
      selectedPlaylistTracks![questions![nextQuestionIdx]!.trackIdx]!.track.id,
      questions![nextQuestionIdx]!.startPositionMs,
      PLAYBACK_LENGTH_MS,
    );
  };

  const handlePreviousQuestion = () => {
    const prevQuestionIdx = questionIdx - 1;
    setQuestionIdx(prevQuestionIdx);
    playTrack(
      selectedPlaylistTracks![questions![prevQuestionIdx]!.trackIdx]!.track.id,
      questions![prevQuestionIdx]!.startPositionMs,
      PLAYBACK_LENGTH_MS,
    );
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
              {playlists && !selectedPlaylistTracks ? (
                <Playlists playlists={playlists} onSelect={handlePlaylistSelect} />
              ) : playlists && selectedPlaylistTracks ? (
                <div className="Question">
                  <h1>Question {questionIdx + 1}</h1>
                  <div className="Question__navigation">
                    <button onClick={handlePreviousQuestion} disabled={questionIdx <= 0}>
                      Previous
                    </button>
                    <button onClick={handleReplay}>Replay</button>
                    <button onClick={handleNextQuestion} disabled={questionIdx >= selectedPlaylistTracks.length - 1}>
                      Next
                    </button>
                  </div>
                </div>
              ) : null}
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
