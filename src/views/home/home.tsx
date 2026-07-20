import { useCallback, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import dayjs from 'dayjs';

import { Bool, Item, ItemsParams } from 'api';
import Icon from 'components/icon';
import ItemsList from 'components/itemsList';
import Link from 'components/link';
import Scrollable from 'components/scrollable';
import Seo from 'components/seo';
import Spottable from 'components/spottable';
import VideoItem from 'components/videoItem';
import useApi from 'hooks/useApi';
import useStorageState from 'hooks/useStorageState';
import { PATHS, generatePath } from 'routes';

const ItemsSection: React.FC<{ title: string; params: ItemsParams; filter?: (item: Item) => boolean }> = ({ title, params, filter }) => {
  const fetchCount = filter ? 20 : 5;
  const { data, isLoading } = useApi('items', [params, 0, fetchCount]);
  const href = useMemo(() => generatePath(PATHS.Category, { categoryType: params.type }), [params]);
  const items = useMemo(() => {
    if (!data?.items) return data?.items;
    return filter ? data.items.filter(filter).slice(0, 5) : data.items;
  }, [data?.items, filter]);

  return (
    <div className="pb-2">
      <ItemsList
        title={
          <Link href={href} state={{ params, title }} className="w-full">
            {title}
          </Link>
        }
        titleClassName="ml-0 font-semibold border-l-2 border-red-600 pl-2"
        items={items}
        loading={isLoading}
        scrollable={false}
      />
    </div>
  );
};

const CARTOON_ANIME_RE = /мультфильм|аниме|cartoon|anime|animation/i;
const excludeCartoonsAndAnime = (item: Item) => !item.genres?.some((g) => CARTOON_ANIME_RE.test(g.title || ''));

const lastMonth = dayjs().add(-1, 'month').unix();

const PopularMovies: React.FC = () => {
  return <ItemsSection title="Популярные фильмы" params={{ type: 'movie', sort: 'views-', conditions: [`created>=${lastMonth}`] }} />;
};

const NewMovies: React.FC = () => {
  return <ItemsSection title="Новые фильмы" params={{ type: 'movie', sort: 'created-' }} />;
};

const PopularSerials: React.FC = () => {
  return <ItemsSection title="Популярные сериалы" params={{ type: 'serial', sort: 'watchers-' }} />;
};

const NewSerials: React.FC = () => {
  return <ItemsSection title="Новые сериалы" params={{ type: 'serial', sort: 'created-' }} />;
};

const NewConcerts: React.FC = () => {
  return <ItemsSection title="Новые концерты" params={{ type: 'concert', sort: 'created-' }} />;
};

const NewDocuMovies: React.FC = () => {
  return <ItemsSection title="Новые документальные фильмы" params={{ type: 'documovie', sort: 'created-' }} />;
};

const NewDocuSerials: React.FC = () => {
  return <ItemsSection title="Новые документальные сериалы" params={{ type: 'docuserial', sort: 'created-' }} />;
};

const NewTVShows: React.FC = () => {
  const [hideCartoonsAnime] = useStorageState<boolean>('hide_cartoons_anime_in_tvshow');
  return (
    <ItemsSection
      title="Новые ТВ шоу"
      params={{ type: 'tvshow', sort: 'created-' }}
      filter={hideCartoonsAnime ? excludeCartoonsAndAnime : undefined}
    />
  );
};

const ContinueWatching: React.FC = () => {
  const history = useHistory();
  const { data: serials, isLoading: serialsLoading } = useApi('watchingSerials');
  const { data: subscribedSerials } = useApi('watchingSerials', [Bool.True]);
  const { data: movies, isLoading: moviesLoading } = useApi('watchingMovies');
  const { data: historyData, isLoading: historyLoading } = useApi('history', [1, 100]);
  const items = useMemo(() => {
    // Prefer items from watchingSerials (has unwatched episode count) but also
    // include subscribed serials that are fully caught up so they don't vanish
    // between episode releases.
    const itemMap = new Map<string, Item>();
    for (const item of serials?.items || []) itemMap.set(item.id, item);
    for (const item of subscribedSerials?.items || []) {
      if (!itemMap.has(item.id)) itemMap.set(item.id, item);
    }
    for (const item of movies?.items || []) itemMap.set(item.id, item);

    if (!itemMap.size) return [];

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

    return ordered.slice(0, 8).map((item) => ({ ...item, new: undefined }));
  }, [serials?.items, subscribedSerials?.items, movies?.items, historyData?.history]);
  const isLoading = serialsLoading || moviesLoading || historyLoading;

  const [showAllFocused, setShowAllFocused] = useState(false);

  const handleShowAll = useCallback(() => {
    history.push(generatePath(PATHS.Watching, { watchingType: 'serials' }));
  }, [history]);

  if (!isLoading && items.length === 0) return null;

  return (
    <div className="pb-2 pt-4">
      <div className="flex flex-wrap">
        {items.slice(0, 4).map((item) => (
          <VideoItem key={item.id} item={item} />
        ))}
        <Spottable
          className="rounded-xl w-1/5 cursor-pointer"
          onClick={handleShowAll}
          onFocus={() => setShowAllFocused(true)}
          onBlur={() => setShowAllFocused(false)}
        >
          <div className="h-72 m-1 relative flex flex-col items-center justify-center rounded-xl bg-gray-900 overflow-hidden border border-white border-opacity-10">
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-[2px] z-10">
              {[4, 5, 6, 7].map((idx) =>
                items[idx]?.posters?.medium ? (
                  <img key={idx} src={items[idx].posters.medium} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div key={idx} className="w-full h-full bg-gray-800" />
                ),
              )}
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-20">
              <div
                className={
                  showAllFocused ? 'rounded-full border-2 border-white' : 'rounded-full border-2 border-gray-300 border-opacity-70'
                }
                style={{ width: '5rem', height: '5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon
                  name="arrow_forward"
                  className={showAllFocused ? 'text-white' : 'text-gray-200'}
                  style={{ fontSize: '3rem', lineHeight: '5rem', display: 'block', width: '3rem', textAlign: 'center' }}
                />
              </div>
            </div>
          </div>
        </Spottable>
      </div>
    </div>
  );
};

const HomeView: React.FC = () => {
  return (
    <>
      <Seo title="Главная" />
      <Scrollable>
        <ContinueWatching />

        <PopularMovies />

        <NewMovies />

        <PopularSerials />

        <NewSerials />

        <NewDocuSerials />

        <NewDocuMovies />

        <NewTVShows />

        <NewConcerts />
      </Scrollable>
    </>
  );
};

export default HomeView;
