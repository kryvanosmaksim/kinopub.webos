import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from 'react-query';
import { useHistory, useParams } from 'react-router-dom';
import map from 'lodash/map';

import { Bool, Season, Video, WatchingStatus } from 'api';
import Button from 'components/button';
import CollapsibleList from 'components/collapsibleList';
import EpisodePicker from 'components/episodePicker';
import ItemsList from 'components/itemsList';
import Link from 'components/link';
import Popup from 'components/popup';
import Scrollable from 'components/scrollable';
import SeasonsList from 'components/seasonsList';
import Seo from 'components/seo';
import Spottable from 'components/spottable';
import Text from 'components/text';
import VideoItem from 'components/videoItem';
import Bookmarks from 'containers/bookmarks';
import useApi from 'hooks/useApi';
import useApiMutation from 'hooks/useApiMutation';
import useButtonEffect from 'hooks/useButtonEffect';
import useStreamingTypeEffect from 'hooks/useStreamingTypeEffect';
import { PATHS, RouteParams, generatePath } from 'routes';

import { secondsToDuration } from 'utils/date';
import { getItemTitle, getItemVideoToPlay } from 'utils/item';
import { mapAudios, mapSubtitles } from 'utils/video';

const SimilarItems: React.FC<{ itemId: string; className?: string }> = ({ itemId, className }) => {
  const { data } = useApi('itemSmiliar', [itemId]);

  if (data && data.items?.length > 0) {
    return (
      <div className={className}>
        <ItemsList title="Похожие" titleClassName="text-gray-500" items={data.items} scrollable={false} />
      </div>
    );
  }

  return null;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const ItemView: React.FC = () => {
  const queryClient = useQueryClient();
  const history = useHistory();
  const { itemId } = useParams<RouteParams>();
  const posterRef = useRef<HTMLImageElement>(null);
  const [bookmarksPopupVisible, setBookmarksPopupVisible] = useState(false);
  const [episodePickerVisible, setEpisodePickerVisible] = useState(false);
  const [deletePopupVisible, setDeletePopupVisible] = useState(false);
  const [descriptionPopupVisible, setDescriptionPopupVisible] = useState(false);
  const [descriptionClamped, setDescriptionClamped] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const { data, refetch } = useApi('itemMedia', [itemId!], { staleTime: 0 });
  const { data: watchingData, refetch: refetchWatching } = useApi('watchingItem', [itemId!], { staleTime: 0 });

  const { watchingToggleAsync } = useApiMutation('watchingToggle');
  const { watchingToggleWatchlistAsync } = useApiMutation('watchingToggleWatchlist');
  const { watchingMarkTimeAsync } = useApiMutation('watchingMarkTime');
  const { historyClearItemAsync } = useApiMutation('historyClearItem');

  // Merge watching data from /v1/watching into item data
  // The watching API returns {status, time} at top level, not nested under "watching"
  const itemWithWatching = useMemo(() => {
    if (!data?.item) return data?.item;
    if (!watchingData?.item) return data.item;

    const item = { ...data.item };

    if (item.seasons && watchingData.item.seasons) {
      item.seasons = item.seasons.map((season) => {
        const ws = watchingData.item.seasons?.find((s: any) => s.number === season.number);
        if (!ws) return season;

        return {
          ...season,
          watched: (ws as any).status ?? season.watched,
          watching: { status: (ws as any).status ?? season.watching?.status, time: (ws as any).time ?? season.watching?.time },
          episodes: season.episodes.map((episode) => {
            const we = ws.episodes?.find((e: any) => e.number === episode.number);
            if (!we) return episode;

            return {
              ...episode,
              watched: (we as any).status ?? episode.watched,
              watching: { status: (we as any).status ?? episode.watching?.status, time: (we as any).time ?? episode.watching?.time },
            };
          }),
        };
      });
    } else if (item.videos && watchingData.item.videos) {
      item.videos = item.videos.map((video) => {
        const wv = watchingData.item.videos?.find((v: any) => v.number === video.number);
        if (!wv) return video;

        return {
          ...video,
          watched: (wv as any).status ?? video.watched,
          watching: { status: (wv as any).status ?? video.watching?.status, time: (wv as any).time ?? video.watching?.time },
        };
      });
    }

    return item;
  }, [data?.item, watchingData?.item]);

  const trailer = useMemo(() => data?.item.trailer, [data?.item]);
  const [videoToPlay, season] = useMemo(() => getItemVideoToPlay(itemWithWatching), [itemWithWatching]);
  const title = useMemo(() => getItemTitle(data?.item, videoToPlay, season), [data?.item, season, videoToPlay]);
  const durationAverage = useMemo(() => secondsToDuration(data?.item?.duration?.average), [data?.item]);
  const durationTotal = useMemo(() => secondsToDuration(data?.item?.duration?.total), [data?.item]);
  const isSerial = useMemo(() => Boolean(data?.item?.seasons), [data?.item]);
  const audios = useMemo(() => {
    if (Boolean(data?.item?.seasons)) return mapAudios(videoToPlay?.audios || []);
    const allAudios = (data?.item?.videos || []).flatMap((v) => v.audios || []);
    const seen = new Set<string>();
    const unique = allAudios.filter((a) => {
      const key = `${a.lang}-${a.type?.id}-${a.author?.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return mapAudios(unique.length ? unique : videoToPlay?.audios || []);
  }, [data?.item?.videos, data?.item?.seasons, videoToPlay]);

  const subtitles = useMemo(() => {
    if (Boolean(data?.item?.seasons)) return mapSubtitles(videoToPlay?.subtitles || []);
    const allSubs = (data?.item?.videos || []).flatMap((v) => v.subtitles || []);
    const seen = new Set<string>();
    const unique = allSubs.filter((s) => {
      const key = `${s.lang}-${s.forced}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return mapSubtitles(unique.length ? unique : videoToPlay?.subtitles || []);
  }, [data?.item?.videos, data?.item?.seasons, videoToPlay]);
  const isWatching = useMemo(
    () => (isSerial ? data?.item?.subscribed : videoToPlay?.watching.status === WatchingStatus.Watching),
    [data?.item, isSerial, videoToPlay],
  );

  const handleOnPlayClick = useCallback(() => {
    if (itemWithWatching) {
      history.push(
        generatePath(PATHS.Video, {
          itemId: itemWithWatching.id,
        }),
        {
          item: itemWithWatching,
        },
      );
    }
  }, [history, itemWithWatching]);

  const handleOnTrailerClick = useCallback(() => {
    if (trailer?.id) {
      history.push(
        generatePath(PATHS.Trailer, {
          trailerId: trailer.id,
        }),
        {
          item: data?.item,
          trailer,
        },
      );
    }
  }, [history, data?.item, trailer]);

  const handleOnBookmarksClick = useCallback(() => {
    setBookmarksPopupVisible(true);
  }, []);
  const handleBookmarksPopupClose = useCallback(() => {
    setBookmarksPopupVisible(false);
  }, []);
  const handleOnEpisodesClick = useCallback(() => {
    setEpisodePickerVisible(true);
  }, []);
  const handleEpisodePickerClose = useCallback(() => {
    setEpisodePickerVisible(false);
  }, []);
  const refetchAll = useCallback(() => {
    refetch();
    refetchWatching();
  }, [refetch, refetchWatching]);
  const handleSeasonToggle = useCallback(
    async (season?: Season | null) => {
      if (!season) return;
      const status = season.watched === WatchingStatus.Watched ? Bool.False : Bool.True;
      const targetStatus = status === Bool.True ? WatchingStatus.Watched : WatchingStatus.NoWatched;

      // Optimistic Update: Instantly mark as watched/unwatched in the local cache
      queryClient.setQueryData(['watchingItem', [itemId!]], (old: any) => {
        if (!old?.item?.seasons) return old;
        const newSeasons = old.item.seasons.map((s: any) => {
          if (s.number === season.number) {
            return {
              ...s,
              status: targetStatus,
              episodes: s.episodes?.map((e: any) => ({ ...e, status: targetStatus })),
            };
          }
          return s;
        });
        return { ...old, item: { ...old.item, seasons: newSeasons } };
      });

      if (status === Bool.True) {
        // Progressively mark each episode as watched to ensure they all appear in History.
        for (const episode of season.episodes) {
          try {
            await watchingToggleAsync([itemId!, episode.number, season.number, status]);
            await sleep(500); // Increased delay to ensure Kinopub API correctly processes history timeline insertion
          } catch (e) {
            console.error(`Failed to toggle episode ${episode.number}`, e);
          }
        }
      } else {
        await watchingToggleAsync([itemId!, undefined, season.number, status]);
      }
      refetchAll();
    },
    [itemId, refetchAll, watchingToggleAsync, queryClient],
  );
  const handleEpisodeToggle = useCallback(
    async (episode: Video, season?: Season | null) => {
      if (!season) return;
      const status = episode.watched === WatchingStatus.Watched ? Bool.False : Bool.True;
      const targetStatus = status === Bool.True ? WatchingStatus.Watched : WatchingStatus.NoWatched;

      // Optimistic Update: Instantly update individual episode status
      queryClient.setQueryData(['watchingItem', [itemId!]], (old: any) => {
        if (!old?.item?.seasons) return old;
        const newSeasons = old.item.seasons.map((s: any) => {
          if (s.number === season.number) {
            const newEpisodes = s.episodes?.map((e: any) => (e.number === episode.number ? { ...e, status: targetStatus } : e));
            return { ...s, episodes: newEpisodes };
          }
          return s;
        });
        return { ...old, item: { ...old.item, seasons: newSeasons } };
      });

      await watchingToggleAsync([itemId!, episode.number, season.number, status]);
      refetchAll();
    },
    [itemId, refetchAll, watchingToggleAsync, queryClient],
  );

  const handleOnVisibilityClick = useCallback(async () => {
    if (isSerial) {
      await watchingToggleWatchlistAsync([itemId!]);
    } else {
      if (isWatching) {
        await watchingToggleAsync([itemId!, videoToPlay.number, 0, Bool.False]);
      } else {
        await watchingMarkTimeAsync([itemId!, 30, videoToPlay.number]);
      }
    }
    queryClient.invalidateQueries('watchingItem');
    queryClient.invalidateQueries('watchingMovies');
    queryClient.invalidateQueries('watchingSerials');
    refetchAll();
  }, [
    itemId,
    isSerial,
    isWatching,
    videoToPlay,
    watchingToggleWatchlistAsync,
    watchingToggleAsync,
    watchingMarkTimeAsync,
    refetchAll,
    queryClient,
  ]);

  const handleRemoveFromHistory = useCallback(async () => {
    await historyClearItemAsync([itemId!]);
    queryClient.invalidateQueries('history');
    setDeletePopupVisible(false);
    refetchAll();
  }, [itemId, historyClearItemAsync, refetchAll, queryClient]);

  useEffect(() => {
    requestAnimationFrame(() => {
      posterRef.current?.scrollIntoView();
    });
  }, [history.location.pathname]);

  useEffect(() => {
    requestAnimationFrame(() => {
      const el = descriptionRef.current;
      if (el) {
        setDescriptionClamped(el.scrollHeight > el.clientHeight);
      }
    });
  }, [data?.item?.plot]);

  useStreamingTypeEffect();
  useButtonEffect(['Play', 'Red'], handleOnPlayClick);
  useButtonEffect('Green', handleOnTrailerClick);
  useButtonEffect('Yellow', handleOnBookmarksClick);
  useButtonEffect('Blue', handleOnVisibilityClick);

  return (
    <>
      <Seo title={`Просмотр: ${title}`} />
      <Scrollable>
        {/* ── HERO ── */}
        <div className="relative w-screen h-screen">
          <Spottable />
          <img
            ref={posterRef}
            className="absolute inset-0 w-full h-full object-cover"
            src={(data?.item?.posters.wide || data?.item?.posters.big)!}
            alt={title}
          />

          {/* Cinematic gradients */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.95) 35%, rgba(0,0,0,0.55) 65%, transparent 100%)' }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.2) 35%, transparent 65%)' }}
          />

          {data?.item && (
            <div
              className="absolute inset-0 flex flex-col justify-end overflow-hidden"
              style={{ paddingLeft: '6%', paddingRight: '6%', paddingBottom: '5%' }}
            >
              {/* Title — full width above poster+info */}
              <h1 className="font-bold text-white leading-tight line-clamp-2" style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>
                {data.item.title.split('/')[0].trim()}
              </h1>

              {/* Poster (left) + info (right) */}
              <div className="flex items-start" style={{ marginBottom: '2rem' }}>
                {/* Portrait poster — 16rem × 24rem = 2:3 ratio */}
                <div className="flex-shrink-0" style={{ width: '16rem', height: '24rem', marginRight: '3rem' }}>
                  <VideoItem item={data?.item} wrapperClassName="w-full h-full" className="h-full" showViews noCaption disableNavigation />
                </div>

                {/* Info column — same height as poster so "Читать далее" aligns at bottom */}
                <div className="flex flex-col min-w-0 flex-1" style={{ height: '24rem' }}>
                  {/* Original title */}
                  {data.item.title.includes('/') && (
                    <p className="text-gray-400 italic line-clamp-2" style={{ marginBottom: '0.5rem' }}>
                      {data.item.title.split('/').slice(1).join('/').trim()}
                    </p>
                  )}

                  {/* Meta row */}
                  <div className="flex items-center flex-wrap text-gray-300" style={{ marginBottom: '0.6rem' }}>
                    {data.item.year && <span style={{ marginRight: '0.5rem' }}>{data.item.year}</span>}
                    {!!data.item.countries?.length && (
                      <>
                        <span className="text-gray-600" style={{ marginRight: '0.5rem' }}>
                          •
                        </span>
                        <span style={{ marginRight: '0.5rem' }}>{data.item.countries.map((c) => c.title).join(', ')}</span>
                      </>
                    )}
                    {(durationAverage || durationTotal) && (
                      <>
                        <span className="text-gray-600" style={{ marginRight: '0.5rem' }}>
                          •
                        </span>
                        <span style={{ marginRight: '0.5rem' }}>{durationAverage || durationTotal}</span>
                      </>
                    )}
                    {isSerial && !data.item.finished && (
                      <>
                        <span className="text-gray-600" style={{ marginRight: '0.5rem' }}>
                          •
                        </span>
                        <span className="px-2 text-xs rounded border border-red-600 text-red-500 py-0.5" style={{ marginRight: '0.5rem' }}>
                          ON AIR
                        </span>
                      </>
                    )}
                  </div>

                  {/* Genre tags */}
                  {!!data.item.genres?.length && (
                    <div className="flex flex-wrap" style={{ marginBottom: '0.6rem' }}>
                      {map(data.item.genres, (genre) => (
                        <span key={genre.id} style={{ marginRight: '0.5rem', marginBottom: '0.3rem' }}>
                          <Link
                            href={generatePath(PATHS.Category, { categoryType: data?.item?.type }, { genre: genre.id })}
                            className="border border-gray-600 rounded-full px-3 text-sm text-gray-300"
                          >
                            {genre.title}
                          </Link>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Description — fills remaining space, "Читать далее" only shown when clamped */}
                  {data.item.plot && (
                    <div className="flex flex-col flex-1 justify-between">
                      <p ref={descriptionRef} className="text-gray-300 leading-relaxed line-clamp-9" style={{ fontSize: '1.05rem' }}>
                        {data.item.plot}
                      </p>
                      {descriptionClamped && (
                        <Button
                          className="border border-gray-600 rounded-full px-3 text-sm text-gray-300"
                          style={{ marginTop: '0.5rem', width: 'fit-content' }}
                          onClick={() => setDescriptionPopupVisible(true)}
                        >
                          Читать далее…
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons — full width below poster+info */}
              <div className="flex items-center" style={{ marginTop: '1.25rem' }}>
                <Button
                  autoFocus
                  icon="play_circle_outline"
                  onClick={handleOnPlayClick}
                  className="border border-gray-500 text-red-400 px-5 py-1.5 rounded-lg"
                  style={{ marginRight: '0.75rem' }}
                >
                  Смотреть{isSerial ? ` s${videoToPlay.snumber}e${videoToPlay.number}` : ''}
                </Button>

                {isSerial && data?.item?.seasons && (
                  <Button
                    icon="list"
                    onClick={handleOnEpisodesClick}
                    className="border border-gray-500 text-gray-200 px-3 py-1.5 rounded-lg"
                    style={{ marginRight: '0.75rem' }}
                  >
                    Эпизоды
                  </Button>
                )}

                {trailer && (
                  <Button
                    icon="videocam"
                    onClick={handleOnTrailerClick}
                    className="border border-gray-500 text-green-400 px-3 py-1.5 rounded-lg"
                    style={{ marginRight: '0.75rem' }}
                  >
                    Трейлер
                  </Button>
                )}

                <Button
                  icon="bookmark"
                  onClick={handleOnBookmarksClick}
                  className="border border-gray-500 text-yellow-500 px-3 py-1.5 rounded-lg"
                  style={{ marginRight: '0.75rem' }}
                >
                  В закладки
                </Button>

                <Button
                  icon={isWatching ? 'visibility_off' : 'visibility'}
                  onClick={handleOnVisibilityClick}
                  className="border border-gray-500 text-blue-400 px-3 py-1.5 rounded-lg"
                  style={{ marginRight: '0.75rem' }}
                >
                  {isWatching ? 'Не буду смотреть' : 'Буду смотреть'}
                </Button>

                <Button icon="delete" onClick={() => setDeletePopupVisible(true)} className="text-gray-500 hover:text-red-500" iconOnly />
              </div>

              {/* Popups */}
              <Popup visible={descriptionPopupVisible} onClose={() => setDescriptionPopupVisible(false)} closeButton="Yellow">
                <Text className="text-xl mb-4">{data.item.title.split('/')[0].trim()}</Text>
                <p className="text-gray-300 leading-relaxed">{data.item.plot}</p>
              </Popup>

              <Popup visible={bookmarksPopupVisible} onClose={handleBookmarksPopupClose} closeButton="Yellow">
                <Bookmarks key={`${itemId}-${bookmarksPopupVisible}`} itemId={itemId!} />
              </Popup>

              {isSerial && itemWithWatching?.seasons && (
                <EpisodePicker
                  item={itemWithWatching}
                  seasons={itemWithWatching.seasons}
                  visible={episodePickerVisible}
                  onClose={handleEpisodePickerClose}
                  onSeasonToggle={handleSeasonToggle}
                  onEpisodeToggle={handleEpisodeToggle}
                />
              )}

              <Popup visible={deletePopupVisible} onClose={() => setDeletePopupVisible(false)} closeButton="Yellow">
                <Text className="text-xl mb-6">Удалить из истории просмотров?</Text>
                <div className="flex justify-center mt-4">
                  <Button onClick={handleRemoveFromHistory} className="mr-8 text-red-500">
                    Удалить
                  </Button>
                  <Button onClick={() => setDeletePopupVisible(false)}>Отмена</Button>
                </div>
              </Popup>
            </div>
          )}
        </div>

        {/* ── CONTENT ── */}
        <div className="flex flex-col" style={{ padding: '48px 80px', gap: '48px' }}>
          {/* Audio / Subtitles */}
          {(audios.length > 0 || subtitles.length > 0) && (
            <div className="flex flex-col" style={{ gap: '32px' }}>
              {audios.length > 0 && (
                <div>
                  <Text className="text-gray-500 mb-2">Перевод</Text>
                  <CollapsibleList maxVisible={4} className="flex flex-wrap">
                    {map(audios, (voice, idx) => (
                      <Text
                        key={idx}
                        className="bg-gray-800 rounded-full text-sm"
                        style={{
                          padding: '4px 12px',
                          lineHeight: '1.4',
                          display: 'inline-flex',
                          alignItems: 'center',
                          marginRight: '8px',
                          marginBottom: '8px',
                        }}
                      >
                        {voice.name}
                      </Text>
                    ))}
                  </CollapsibleList>
                </div>
              )}

              {subtitles.length > 0 && (
                <div>
                  <Text className="text-gray-500 mb-2">Субтитры</Text>
                  <CollapsibleList maxVisible={6} className="flex flex-wrap">
                    {map(subtitles, (subtitle, idx) => (
                      <Text
                        key={idx}
                        className="bg-gray-800 rounded-full text-sm"
                        style={{
                          padding: '4px 12px',
                          lineHeight: '1.4',
                          display: 'inline-flex',
                          alignItems: 'center',
                          marginRight: '8px',
                          marginBottom: '8px',
                        }}
                      >
                        {subtitle.name}
                      </Text>
                    ))}
                  </CollapsibleList>
                </div>
              )}
            </div>
          )}

          {/* Tracklist */}
          {!!data?.item?.tracklist?.length && (
            <div>
              <Text className="text-gray-500 mb-2">Треклист</Text>
              <CollapsibleList maxVisible={6} className="flex flex-col">
                {map(data?.item.tracklist, (track, idx) => (
                  <Text key={idx}>
                    {idx + 1}. {track.title}
                  </Text>
                ))}
              </CollapsibleList>
            </div>
          )}

          {/* Seasons */}
          <SeasonsList
            item={itemWithWatching!}
            seasons={itemWithWatching?.seasons}
            onSeasonToggle={handleSeasonToggle}
            onEpisodeToggle={handleEpisodeToggle}
          />

          {/* Cast & Director */}
          {(data?.item?.director || data?.item?.cast) && (
            <div className="flex" style={{ gap: '64px' }}>
              {data?.item?.director && (
                <div className="flex-shrink-0">
                  <Text className="text-gray-500 mb-2">Создатели</Text>
                  <div className="flex flex-col" style={{ gap: '4px' }}>
                    {map(data?.item?.director.split(', '), (director) => (
                      <Link key={director} href={generatePath(PATHS.Search, null, { q: director, mode: 'director' })}>
                        {director}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {data?.item?.cast && (
                <div className="flex-1">
                  <Text className="text-gray-500 mb-2">В ролях</Text>
                  <div className="flex flex-wrap" style={{ gap: '4px' }}>
                    {map(data?.item?.cast.split(', '), (actor, idx, arr) => (
                      <Link key={actor} href={generatePath(PATHS.Search, null, { q: actor, mode: 'actor' })}>
                        {actor}
                        {idx !== arr.length - 1 && ',\u00a0'}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Similar */}
          <SimilarItems itemId={itemId!} />
        </div>
      </Scrollable>
    </>
  );
};

export default ItemView;
