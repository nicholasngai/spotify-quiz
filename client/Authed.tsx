import { useEffect, useState } from 'react';
import Loading from './components/Loading';
import Playlists from './components/Playlists';
import QuestionGuesser from './components/QuestionGuesser';
import { PLAYBACK_LENGTH_MS } from './constants';
import type useSpotify from './services/spotify';
import type { Playlist, PlaylistTrack } from './services/spotify';
import useSpotifyPlayer from './services/spotifyPlayer';
import { shuffle } from './utils/shuffle';
import { Question } from './types';
import './App.css';

export type AuthedProps = {
  spotify: ReturnType<typeof useSpotify>;
  accessToken: string;
};

function Authed(props: AuthedProps) {
  const { spotify } = props;
  const spotifyPlayer = useSpotifyPlayer(props.accessToken);

  const [playlists, setPlaylists] = useState<Playlist[] | null>(null);
  const [customPlaylistId, setCustomPlaylistId] = useState<string>('');
  const [tracks, setTracks] = useState<PlaylistTrack[] | null>(null);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [questionIdx, setQuestionIdx] = useState(0);

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

    setTracks(tracks);
    setQuestions(questions);
    setQuestionIdx(0);
  };

  const handlePreviousQuestion = () => {
    setQuestionIdx(questionIdx - 1);
  };

  const handleNextQuestion = () => {
    setQuestionIdx(questionIdx + 1);
  };

  return (
    <div className="Authed">
      {spotifyPlayer ? (
        playlists && !tracks ? (
          <>
            <form
              action="#"
              onSubmit={(e) => {
                e.preventDefault();
                handlePlaylistSelect(customPlaylistId);
              }}
            >
              <input value={customPlaylistId} onChange={(e) => setCustomPlaylistId(e.target.value)} />
            </form>
            <Playlists playlists={playlists} onSelect={handlePlaylistSelect} />
          </>
        ) : playlists && tracks && questions ? (
          <QuestionGuesser
            spotify={spotify}
            spotifyPlayer={spotifyPlayer}
            tracks={tracks}
            question={questions[questionIdx]!}
            questionIdx={questionIdx}
            numQuestions={questions.length}
            onGuess={() => {}}
            onPrevious={handlePreviousQuestion}
            onNext={handleNextQuestion}
          />
        ) : null
      ) : (
        <Loading />
      )}
    </div>
  );
}

export default Authed;
