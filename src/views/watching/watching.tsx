import React, { useMemo } from 'react';
import { generatePath, useParams } from 'react-router-dom';
import capitalize from 'lodash/capitalize';
import map from 'lodash/map';
import sumBy from 'lodash/sumBy';

import { Bool, Item } from 'api';
import ItemsList from 'components/itemsList';
import Link from 'components/link';
import Seo from 'components/seo';
import Text from 'components/text';
import useApi from 'hooks/useApi';
import { PATHS, RouteParams } from 'routes';

const WATCHING_TYPES_MAP = {
  serials: 'Сериалы',
  movies: 'Фильмы',
} as const;

type WatchingTypes = keyof typeof WATCHING_TYPES_MAP;

const WatchingView: React.FC = () => {
  const { watchingType = 'serials' } = useParams<RouteParams>();
  const { data, isLoading } = useApi(`watching${capitalize(watchingType) as Capitalize<WatchingTypes>}`);
  const { data: subscribedSerialsData } = useApi('watchingSerials', [Bool.True], { enabled: watchingType === 'serials' });
  const { data: historyData } = useApi('history', [1, 100]);
  const sortedItems = useMemo(() => {
    // Build a map seeded with the primary API result (has `new` episode counts).
    // For the serials tab also fold in subscribed serials so that shows the user
    // is following don't disappear after they catch up with available episodes.
    const itemMap = new Map<string, Item>();
    for (const item of data?.items || []) itemMap.set(item.id, item);
    if (watchingType === 'serials') {
      for (const item of subscribedSerialsData?.items || []) {
        if (!itemMap.has(item.id)) itemMap.set(item.id, item);
      }
    }

    if (!itemMap.size) return data?.items;

    const seen = new Set<string>();
    const ordered: Item[] = [];

    for (const h of historyData?.history || []) {
      const id = h.item?.id;
      if (id && itemMap.has(id) && !seen.has(id)) {
        seen.add(id);
        ordered.push(itemMap.get(id)!);
      }
    }

    for (const [id, item] of itemMap) {
      if (!seen.has(id)) ordered.push(item);
    }

    return ordered;
  }, [data?.items, subscribedSerialsData?.items, historyData?.history, watchingType]);
  const total = useMemo(() => sumBy(sortedItems, (item) => +(item.new || 0)), [sortedItems]);

  const seoTitle = watchingType === 'serials' ? 'Новые эпизоды' : 'Недосмотренные фильмы';
  const title = total ? `${seoTitle} (${total})` : seoTitle;

  return (
    <>
      <Seo title={seoTitle} />
      <ItemsList
        title={
          <>
            <Text>{title}</Text>

            <div className="flex">
              {map(WATCHING_TYPES_MAP, (watchingTypeName, watchingTypeKey) => (
                <Link
                  key={watchingTypeKey}
                  className="mr-2"
                  replace
                  active={watchingType === watchingTypeKey}
                  href={generatePath(PATHS.Watching, { watchingType: watchingTypeKey })}
                >
                  {watchingTypeName}
                </Link>
              ))}
            </div>
          </>
        }
        items={sortedItems}
        loading={isLoading}
      />
    </>
  );
};

export default WatchingView;
