import { Playlist } from '../services/spotify';
import './Playlists.css';

export type Props = {
  playlists: Playlist[];
};

function Playlists(props: Props): JSX.Element | null {
  return (
    <div className="Playlists">
      {props.playlists.map((playlist) => (
        <div className="Playlists__playlist">
          <button className="Playlists__playlist__button">
            <img className="Playlists__playlist__img" src={playlist.images[0]!.url} />
            {playlist.name}
          </button>
        </div>
      ))}
    </div>
  );
}

export default Playlists;
