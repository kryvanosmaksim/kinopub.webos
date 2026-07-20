import React, { useCallback } from 'react';
import { useQueryClient } from 'react-query';
import cx from 'classnames';
import map from 'lodash/map';

import { HistoryItem } from 'api';
import Scrollable from 'components/scrollable';
import Title from 'components/title';
import VideoItem from 'components/videoItem';
import useApiMutation from 'hooks/useApiMutation';

type Props = {
  title?: React.ReactNode;
  items?: HistoryItem[];
  loading?: boolean;
  onScrollToEnd?: () => void;
  scrollable?: boolean;
  className?: string;
  titleClassName?: string;
};

const HistoryList: React.FC<Props> = ({ title, items, loading, onScrollToEnd, scrollable = true, className, titleClassName }) => {
  const queryClient = useQueryClient();
  const { historyClearItemAsync } = useApiMutation('historyClearItem');

  const handleDelete = useCallback(
    async (id: string) => {
      await historyClearItemAsync([id]);
      queryClient.invalidateQueries('history');
    },
    [historyClearItemAsync, queryClient],
  );

  const content = (
    <div>
      <Title className={titleClassName}>{title}</Title>
      <div className={cx('flex flex-wrap', className)}>
        {map(items, ({ item, media, last_seen }) => (
          <VideoItem
            key={last_seen}
            item={item}
            playOnClick
            onDelete={() => handleDelete(item.id)}
            {...(media.snumber > 0 ? { episodeId: `${media.number}`, seasonId: `${media.snumber}` } : {})}
          />
        ))}
        {loading && map([...new Array(15)], (_, idx) => <VideoItem key={idx} />)}
      </div>
    </div>
  );

  return scrollable ? <Scrollable onScrollToEnd={onScrollToEnd}>{content}</Scrollable> : content;
};

export default HistoryList;
