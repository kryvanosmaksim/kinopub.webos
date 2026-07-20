import { useCallback, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import cx from 'classnames';

import { Collection } from 'api';
import Icon from 'components/icon';
import ImageItem from 'components/imageItem';
import useFavoriteCollections from 'hooks/useFavoriteCollections';
import { PATHS, generatePath } from 'routes';

import { numberToHuman } from 'utils/number';

type Props = {
  collection?: Collection;
  className?: string;
};

const CollectionItem: React.FC<Props> = ({ collection, className }) => {
  const history = useHistory();
  const [isFocused, setIsFocused] = useState(false);
  const { isFavorite, toggleFavorite } = useFavoriteCollections();
  const views = useMemo(() => (collection?.views && numberToHuman(collection?.views)) || '', [collection?.views]);
  const favorited = useMemo(() => !!collection?.id && isFavorite(collection.id), [collection?.id, isFavorite]);

  const handleOnClick = useCallback(() => {
    if (collection?.id) {
      history.push(
        generatePath(PATHS.Collection, {
          collectionId: collection.id,
        }),
        {
          collection,
          title: collection.title,
        },
      );
    }
  }, [collection, history]);

  const handleFavoriteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (collection) {
        toggleFavorite(collection);
      }
    },
    [collection, toggleFavorite],
  );

  return (
    <ImageItem
      onClick={handleOnClick}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      source={collection?.posters.medium}
      caption={collection?.title}
      className={cx('h-72', className)}
    >
      {views && (
        <div className="absolute top-2 right-2 h-6 pr-2 text-xs text-gray-200 bg-black bg-opacity-50 rounded flex items-center">
          <Icon name="visibility" />
          {views}
        </div>
      )}
      {(isFocused || favorited) && collection && (
        <div
          onClick={handleFavoriteClick}
          className={cx(
            'absolute bottom-2 right-2 h-8 w-8 rounded-full flex items-center justify-center z-20 cursor-pointer transition-colors',
            favorited
              ? 'bg-red-600 bg-opacity-90 text-white hover:bg-opacity-100'
              : 'bg-black bg-opacity-60 text-gray-300 hover:text-red-400 hover:bg-opacity-80',
          )}
        >
          <Icon name={favorited ? 'favorite' : 'favorite_border'} />
        </div>
      )}
    </ImageItem>
  );
};

export default CollectionItem;
