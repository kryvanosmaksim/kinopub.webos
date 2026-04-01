import React, { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import map from 'lodash/map';

import CollectionsList from 'components/collectionsList';
import Input from 'components/input';
import Link from 'components/link';
import Seo from 'components/seo';
import Text from 'components/text';
import CollectionsListInfinite from 'containers/collectionsListInfinite';
import useApiInfinite from 'hooks/useApiInfinite';
import useFavoriteCollections from 'hooks/useFavoriteCollections';
import { PATHS, RouteParams, generatePath } from 'routes';

const COLLECTION_TYPES = {
  created: 'Новые',
  watchers: 'Популярные',
  views: 'Просматриваемые',
  favorites: 'Подписки',
} as const;

type CollectionsType = keyof typeof COLLECTION_TYPES;

const getGenreByType = (collectionType?: CollectionsType) => {
  return (collectionType ? COLLECTION_TYPES[collectionType] : collectionType) || '';
};

const CollectionsView: React.FC = () => {
  const { collectionType = 'created' } = useParams<RouteParams>();
  const [query, setQuery] = useState('');
  const isFavorites = collectionType === 'favorites';
  const queryResult = useApiInfinite('collections', [query, `${collectionType}-`], { enabled: !isFavorites });
  const { favorites } = useFavoriteCollections();
  const title = getGenreByType(collectionType as CollectionsType);

  const handleQueryChange = useCallback(
    (value) => {
      setQuery(value);
    },
    [setQuery],
  );

  const tabsAndSearch = (
    <div className="w-full">
      <div className="flex justify-between items-center mb-3">
        <Text>{title}</Text>
        <div className="flex">
          {map(COLLECTION_TYPES, (collectionTypeName, collectionTypeKey) => (
            <Link
              key={collectionTypeKey}
              className="mr-2"
              replace
              active={collectionType === collectionTypeKey}
              href={generatePath(PATHS.Collections, { collectionType: collectionTypeKey })}
            >
              {collectionTypeName}
            </Link>
          ))}
        </div>
      </div>
      {!isFavorites && (
        <div className="mr-2">
          <Input placeholder="Название подборки..." value={query} onChange={handleQueryChange} />
        </div>
      )}
    </div>
  );

  return (
    <>
      <Seo title={`Подборки: ${title}`} />
      {isFavorites ? (
        <CollectionsList title={tabsAndSearch} collections={favorites} />
      ) : (
        <CollectionsListInfinite title={tabsAndSearch} queryResult={queryResult} />
      )}
    </>
  );
};

export default CollectionsView;
