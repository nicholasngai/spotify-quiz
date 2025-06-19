import { useEffect, useMemo, useState } from 'react';
import Playlists from './components/Playlists';
import type useSpotify from './services/spotify';
import type { GetCurrentUsersProfileResponse, Playlist, PlaylistTrack } from './services/spotify';
import useSpotifyPlayer from './services/spotifyPlayer';
import { computeGuess } from './utils/computeGuess';
import './App.css';

const PLAYBACK_LENGTH_MS = 2000;
const PLAYBACK_BUFFER_MS = 250;

export type AuthedProps = {
  spotify: ReturnType<typeof useSpotify>;
  userProfile: GetCurrentUsersProfileResponse;
  accessToken: string;
};

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

function Authed(props: AuthedProps) {
  const { spotify } = props;

  const [playlists, setPlaylists] = useState<Playlist[] | null>(null);
  const [selectedPlaylistTracks, setSelectedPlaylistTracks] = useState<PlaylistTrack[] | null>(null);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [currentGuess, setCurrentGuess] = useState('');
  const [guessed, setGuessed] = useState(false);

  const spotifyPlayer = useSpotifyPlayer(props.accessToken);

  useEffect(() => {
    (async () => {
      /* Get playlists. */
      const playlists: Playlist[] = [];
      let totalPlaylists = 0;
      do {
        const res = await spotify.getCurrentUsersPlaylists(50, playlists.length);
        playlists.push(...res.items);
        totalPlaylists = res.total;
      } while (playlists.length < totalPlaylists);

      setPlaylists(playlists);
    })();
  }, []);

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
    playTrack(tracks![questions![0]!.trackIdx]!.track.id, questions![0]!.startPositionMs, PLAYBACK_LENGTH_MS);
  };

  const goToQuestion = (questionIdx: number) => {
    setQuestionIdx(questionIdx);
    setCurrentGuess('');
    setGuessed(false);
    playTrack(
      selectedPlaylistTracks![questions![questionIdx]!.trackIdx]!.track.id,
      questions![questionIdx]!.startPositionMs,
      PLAYBACK_LENGTH_MS,
    );
  };

  const handleReplay = () => {
    playTrack(
      selectedPlaylistTracks![questions![questionIdx]!.trackIdx]!.track.id,
      questions![questionIdx]!.startPositionMs,
      PLAYBACK_LENGTH_MS,
    );
  };

  const handleNextQuestion = () => {
    goToQuestion(questionIdx + 1);
  };

  const handlePreviousQuestion = () => {
    goToQuestion(questionIdx - 1);
  };

  const guessedTracks = useMemo(() => {
    if (!guessed) {
      return null;
    }
    return computeGuess(currentGuess, selectedPlaylistTracks!);
  }, [selectedPlaylistTracks, currentGuess, guessed]);
  const guessedTrack = guessedTracks?.length === 1 ? guessedTracks[0] : null;

  return (
    <div className="Authed">
      <div className="Header">
        <img className="Header__profile-img" src={props.userProfile.images[0]!.url} alt="" />
        {props.userProfile.display_name}
      </div>
      {playlists && !selectedPlaylistTracks ? (
        <Playlists playlists={playlists} onSelect={handlePlaylistSelect} />
      ) : playlists && selectedPlaylistTracks ? (
        <div className="Question">
          <h1>Question {questionIdx + 1}</h1>
          <div className="Question__guess">
            <form
              action="#"
              onSubmit={(e) => {
                e.preventDefault();
                setGuessed(true);
              }}
            >
              <input
                value={currentGuess}
                onChange={(e) => {
                  setCurrentGuess(e.target.value);
                  setGuessed(false);
                }}
              />
              <button type="submit">Guess</button>
            </form>
            {guessedTracks && guessedTracks.length > 2 && (
              <span className="Question__guess__error">Not specific enough! Type some more.</span>
            )}
          </div>
          {guessedTrack && (
            <div className="Question__result">
              <div className="Question__result__guess">
                You guessed: {guessedTrack.track.name} <img src={guessedTrack.track.album.images[0]!.url} alt="" />
              </div>
              <div className="Question__result__actual">
                It was: {selectedPlaylistTracks[questions![questionIdx]!.trackIdx]!.track.name}{' '}
                <img
                  src={selectedPlaylistTracks[questions![questionIdx]!.trackIdx]!.track.album.images[0]!.url}
                  alt=""
                />
              </div>
            </div>
          )}
          <div className="Question__navigation">
            <button type="button" onClick={handlePreviousQuestion} disabled={questionIdx <= 0}>
              Previous
            </button>
            <button type="button" onClick={handleReplay}>
              Replay
            </button>
            <button
              type="button"
              onClick={handleNextQuestion}
              disabled={questionIdx >= selectedPlaylistTracks.length - 1}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Authed;
