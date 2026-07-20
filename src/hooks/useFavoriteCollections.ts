import { useCallback } from 'react';

import { Collection } from 'api';
import useStorageState from 'hooks/useStorageState';

function useFavoriteCollections() {
  const [favorites, setFavorites] = useStorageState<Collection[]>('favorite_collections', []);

  const safeList: Collection[] = favorites || [];

  const isFavorite = useCallback((id: string) => safeList.some((c) => c.id === id), [safeList]);

  const toggleFavorite = useCallback(
    (collection: Collection) => {
      if (safeList.some((c) => c.id === collection.id)) {
        setFavorites(safeList.filter((c) => c.id !== collection.id));
      } else {
        setFavorites([...safeList, collection]);
      }
    },
    [safeList, setFavorites],
  );

  return { favorites: safeList, isFavorite, toggleFavorite };
}

export default useFavoriteCollections;
