import type { PlaylistTrack } from '../services/spotify';

function normalize(s: string): string {
  return s.toLowerCase().replaceAll(/\s/g, '');
}

function editDistanceSubstringMemo(
  start: string,
  end: string,
  startIdx: number,
  endIdx: number,
  memo: Map<number, number>,
): number {
  if (startIdx === start.length) {
    /* If the end is longer than the start, we don't care about the extra
     * characters, since we're just looking for a substring. */
    return 0;
  } else if (end.length === endIdx) {
    /* If the start is longer than the end, we do care about the extra
     * characters. */
    return start.length - startIdx;
  }

  const memoKey = (startIdx << 16) | endIdx;

  if (memo.has(memoKey)) {
    return memo.get(memoKey)!;
  }

  let distance: number;
  if (start[startIdx] === end[endIdx]) {
    distance = editDistanceSubstringMemo(start, end, startIdx + 1, endIdx + 1, memo);
  } else {
    const addDistance = editDistanceSubstringMemo(start, end, startIdx, endIdx + 1, memo);
    const removeDistance = editDistanceSubstringMemo(start, end, startIdx + 1, endIdx, memo);
    const replaceDistance = editDistanceSubstringMemo(start, end, startIdx + 1, endIdx + 1, memo);
    distance = Math.min(addDistance, removeDistance, replaceDistance) + 1;
  }

  /* If we haven't started the start substring yet, we need to also test
   * skipping the first character of the end since we can match a substring
   * of end. */
  if (startIdx === 0) {
    const skipDistance = editDistanceSubstringMemo(start, end, startIdx, endIdx + 1, memo);
    distance = Math.min(distance, skipDistance);
  }

  memo.set(memoKey, distance);
  return distance;
}

function editDistance(start: string, end: string): number {
  const distance = editDistanceSubstringMemo(start, end, 0, 0, new Map());
  return distance;
}

export function computeGuess(guess: string, tracks: PlaylistTrack[]): PlaylistTrack[] {
  const normalizedGuess = normalize(guess);
  let lowestTracks: PlaylistTrack[] = [];
  let lowestDistance = Number.MAX_VALUE;

  for (const track of tracks) {
    const distance = editDistance(normalizedGuess, normalize(track.track.name));
    if (distance < lowestDistance) {
      lowestTracks = [track];
      lowestDistance = distance;
    } else if (distance === lowestDistance) {
      lowestTracks.push(track);
    }
  }

  return lowestTracks;
}
