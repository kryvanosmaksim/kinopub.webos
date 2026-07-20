import React, { useCallback, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import cx from 'classnames';

import { Bookmark } from 'api';
import Icon from 'components/icon';
import ImageItem from 'components/imageItem';
import useApi from 'hooks/useApi';
import { PATHS, generatePath } from 'routes';

type Props = {
  bookmark?: Bookmark;
  className?: string;
  onDelete?: () => void;
};

const BookmarkItem: React.FC<Props> = ({ bookmark, className, onDelete }) => {
  const history = useHistory();
  const [isFocused, setIsFocused] = useState(false);
  const { data } = useApi('bookmarkItems', [bookmark?.id!], { enabled: !!bookmark?.id });

  const posters = useMemo(
    () =>
      data?.items
        ?.slice(0, 4)
        .map((item) => item.posters?.medium)
        .filter(Boolean) || [],
    [data?.items],
  );

  const source = useMemo(
    () => posters?.[0] || (bookmark ? `https://dummyimage.com/250x200/222/fff.png&text=${`Фильмов ${bookmark.count}`}` : ''),
    [bookmark, posters],
  );
  const handleOnClick = useCallback(() => {
    if (bookmark?.id) {
      history.push(
        generatePath(PATHS.Bookmark, {
          bookmarkId: bookmark.id,
        }),
        {
          bookmark,
          title: bookmark.title,
        },
      );
    }
  }, [bookmark, history]);

  const handleOnDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete?.();
    },
    [onDelete],
  );

  return (
    <ImageItem
      onClick={handleOnClick}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      source={posters.length === 0 ? source : undefined}
      caption={bookmark?.title}
      className={cx('h-72', className)}
    >
      {isFocused && onDelete && (
        <div
          onClick={handleOnDelete}
          className="absolute top-2 right-2 h-8 w-8 text-gray-200 bg-red-600 bg-opacity-80 rounded-full flex items-center justify-center z-20 hover:bg-opacity-100 cursor-pointer"
        >
          <Icon name="delete" />
        </div>
      )}
      {posters.length > 0 && (
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-[2px] rounded-xl overflow-hidden bg-gray-800 z-10">
          {posters.map((poster, idx) => (
            <img key={idx} src={poster} alt="" className="w-full h-full object-cover" />
          ))}
          {Array.from({ length: Math.max(0, 4 - posters.length) }).map((_, idx) => (
            <div key={`empty-${idx}`} className="w-full h-full bg-gray-900" />
          ))}
        </div>
      )}
    </ImageItem>
  );
};

export default BookmarkItem;
