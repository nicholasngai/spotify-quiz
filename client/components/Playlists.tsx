import { Playlist } from '../services/spotify';
import './Playlists.css';

export type Props = {
  playlists: Playlist[];
  onSelect: (playlistId: string) => void;
};

function Playlists(props: Props): JSX.Element | null {
  return (
    <div className="Playlists">
      {props.playlists.map((playlist) => (
        <div key={playlist.id} className="Playlists__playlist">
          <button type="button" className="Playlists__playlist__button" onClick={() => props.onSelect(playlist.id)}>
            <img className="Playlists__playlist__img" src={playlist.images[0]!.url} alt="" />
            {playlist.name}
          </button>
        </div>
      ))}
    </div>
  );
}

export default Playlists;
