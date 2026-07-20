import { useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import map from 'lodash/map';

import { Item, Season, Video, WatchingStatus } from 'api';
import Accordion from 'components/accordion';
import ImageItem from 'components/imageItem';
import Text from 'components/text';
import { PATHS, generatePath } from 'routes';

type Props = {
  item: Item;
  season: Season;
  onEpisodeFocus?: (episode: Video) => void;
  onEpisodeBlur?: (episode: Video) => void;
};

const SeasonItem: React.FC<Props> = ({ item, season, onEpisodeFocus, onEpisodeBlur }) => {
  const history = useHistory();
  const handleEpisodeClick = useCallback(
    (episode: Video) => () => {
      if (episode?.id) {
        history.push(
          generatePath(
            PATHS.Video,
            {
              itemId: item.id,
            },
            { episodeId: `${episode.number}`, seasonId: `${season.number}` },
          ),
          {
            item,
          },
        );
      }
    },
    [item, season, history],
  );
  const handleEpisodeFocus = useCallback(
    (episode: Video) => () => {
      onEpisodeFocus?.(episode);
    },
    [onEpisodeFocus],
  );
  const handleEpisodeBlur = useCallback(
    (episode: Video) => () => {
      onEpisodeBlur?.(episode);
    },
    [onEpisodeBlur],
  );

  return (
    <div className="flex flex-col">
      <Accordion
        title={season.title ? `${season.number}. ${season.title}` : `Сезон ${season.number}`}
        after={season.watched === WatchingStatus.Watched && <span className="badge-watched">Просмотрено</span>}
      >
        <div className="flex flex-wrap">
          {map(season.episodes, (episode) => (
            <ImageItem
              key={episode.id}
              source={episode.thumbnail}
              caption={episode.title ? `${episode.number}. ${episode.title}` : `Эпизод ${episode.number}`}
              onClick={handleEpisodeClick(episode)}
              onFocus={handleEpisodeFocus(episode)}
              onBlur={handleEpisodeBlur(episode)}
            >
              {episode.watched === WatchingStatus.Watched && (
                <div className="watched-overlay rounded-xl">
                  <Text className="text-white font-bold uppercase">Просмотрено</Text>
                </div>
              )}
            </ImageItem>
          ))}
        </div>
      </Accordion>
    </div>
  );
};

export default SeasonItem;
