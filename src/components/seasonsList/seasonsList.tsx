import map from 'lodash/map';

import { Item, Season, Video } from 'api';
import SeasonItem from 'components/seasonItem';
import Text from 'components/text';

type Props = {
  item: Item;
  seasons?: Season[];
  className?: string;
  onSeasonToggle?: (season: Season) => void;
  onEpisodeToggle?: (episode: Video, season?: Season | null) => void;
};

const SeasonsList: React.FC<Props> = ({ item, seasons, className }) => {
  if (!seasons?.length) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <Text className="text-gray-500">Список сезонов</Text>
      </div>

      {map(seasons, (season) => (
        <SeasonItem key={season.id} item={item} season={season} />
      ))}
    </div>
  );
};

export default SeasonsList;
