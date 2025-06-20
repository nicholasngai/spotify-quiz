import { useEffect, useState } from 'react';
import { PLAYBACK_LENGTH_MS } from '../constants';
import type { PlaylistTrack } from '../services/spotify';
import type useSpotify from '../services/spotify';
import { SpotifyPlayer } from '../services/spotifyPlayer';
import { Question } from '../types';
import { computeGuess } from '../utils/computeGuess';

export type QuestionGuesserProps = {
  spotify: ReturnType<typeof useSpotify>;
  spotifyPlayer: SpotifyPlayer;
  tracks: PlaylistTrack[];
  question: Question;
  questionIdx: number;
  numQuestions: number;
  onGuess: (guess: PlaylistTrack) => void;
  onPrevious: () => void;
  onNext: () => void;
};

enum GuessError {
  NOT_SPECIFIC_ENOUGH,
}

const PLAYBACK_BUFFER_MS = 250;

function QuestionGuesser(props: QuestionGuesserProps): JSX.Element | null {
  const [currentGuess, setCurrentGuess] = useState('');
  const [guessedTrack, setGuessedTrack] = useState<PlaylistTrack | null>(null);
  const [guessError, setGuessError] = useState<GuessError | null>();

  const playTrack = async () => {
    /* Request track to be played. */
    await props.spotify.play(props.spotifyPlayer.deviceId, {
      trackIds: [props.tracks[props.question.trackIdx]!.track.id],
      positionMs: props.question.startPositionMs,
    });

    /* Allow the song to play for the specified length. */
    await props.spotifyPlayer.waitPlaying(PLAYBACK_LENGTH_MS + PLAYBACK_BUFFER_MS);

    /* Pause. */
    await props.spotifyPlayer.pause();
  };

  /* Play question when the question changes. */
  useEffect(() => {
    setCurrentGuess('');
    setGuessedTrack(null);
    setGuessError(null);
    playTrack();
  }, [props.tracks, props.question]);

  const handleGuess = () => {
    /* Compute guessed track based on guess state. */
    const guessedTracks = computeGuess(currentGuess, props.tracks);
    if (guessedTracks.length !== 1) {
      setGuessError(GuessError.NOT_SPECIFIC_ENOUGH);
      return;
    }
    const guessedTrack = guessedTracks[0]!;

    setGuessedTrack(guessedTrack);
    props.onGuess(guessedTrack);
  };

  return (
    <div className="QuestionGuesser">
      <h1>Question {props.questionIdx + 1}</h1>
      <div className="QuestionGuesser__guess">
        <form
          action="#"
          onSubmit={(e) => {
            e.preventDefault();
            handleGuess();
          }}
        >
          <input
            value={currentGuess}
            onChange={(e) => {
              setCurrentGuess(e.target.value);
              setGuessedTrack(null);
            }}
          />
          <button type="submit">Guess</button>
        </form>
        {guessError === GuessError.NOT_SPECIFIC_ENOUGH && (
          <span className="QuestionGuesser__guess__error">Not specific enough! Type some more.</span>
        )}
      </div>
      {guessedTrack && (
        <div className="QuestionGuesser__result">
          <div className="QuestionGuesser__result__guess">
            You guessed: {guessedTrack.track.name} <img src={guessedTrack.track.album.images[0]!.url} alt="" />
          </div>
          <div className="QuestionGuesser__result__actual">
            It was: {props.tracks[props.question.trackIdx]!.track.name}{' '}
            <img src={props.tracks[props.question.trackIdx]!.track.album.images[0]!.url} alt="" />
          </div>
        </div>
      )}
      <div className="QuestionGuesser__navigation">
        <button type="button" onClick={props.onPrevious} disabled={props.questionIdx <= 0}>
          Previous
        </button>
        <button type="button" onClick={playTrack}>
          Replay
        </button>
        <button type="button" onClick={props.onNext} disabled={props.questionIdx >= props.numQuestions - 1}>
          Next
        </button>
      </div>
    </div>
  );
}

export default QuestionGuesser;
