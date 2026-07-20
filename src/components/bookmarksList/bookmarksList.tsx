import React, { useCallback, useState } from 'react';
import { useQueryClient } from 'react-query';
import map from 'lodash/map';

import { Bookmark } from 'api';
import BookmarkItem from 'components/bookmarkItem';
import Button from 'components/button';
import Popup from 'components/popup';
import Scrollable from 'components/scrollable';
import Text from 'components/text';
import Title from 'components/title';
import useApiMutation from 'hooks/useApiMutation';

type Props = {
  title?: string;
  bookmarks?: Bookmark[];
  loading?: boolean;
  onScrollToEnd?: () => void;
  scrollable?: boolean;
};

const BookmarksList: React.FC<Props> = ({ title, bookmarks, loading, onScrollToEnd, scrollable = true }) => {
  const queryClient = useQueryClient();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [bookmarkToDelete, setBookmarkToDelete] = useState<Bookmark | null>(null);
  const { bookmarkRemoveAsync } = useApiMutation('bookmarkRemove');

  const handleDelete = useCallback((bookmark: Bookmark) => {
    setBookmarkToDelete(bookmark);
    setConfirmVisible(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (bookmarkToDelete) {
      await bookmarkRemoveAsync([bookmarkToDelete.id]);
      queryClient.invalidateQueries('bookmarks');
      setConfirmVisible(false);
      setBookmarkToDelete(null);
    }
  }, [bookmarkToDelete, bookmarkRemoveAsync, queryClient]);

  const content = (
    <div>
      <Title>{title}</Title>
      <div className="flex flex-wrap pr-2">
        {map(bookmarks, (bookmark) => (
          <BookmarkItem key={bookmark.id} bookmark={bookmark} onDelete={() => handleDelete(bookmark)} />
        ))}
        {loading && map([...new Array(20)], (_, idx) => <BookmarkItem key={idx} />)}
      </div>

      <Popup visible={confirmVisible} onClose={() => setConfirmVisible(false)}>
        <Text className="text-xl mb-6 text-center">Удалить папку "{bookmarkToDelete?.title}"?</Text>
        <div className="flex justify-center mt-4">
          <Button onClick={handleConfirmDelete} className="mr-8 text-red-500">
            Удалить
          </Button>
          <Button onClick={() => setConfirmVisible(false)}>Отмена</Button>
        </div>
      </Popup>
    </div>
  );

  return scrollable ? <Scrollable onScrollToEnd={onScrollToEnd}>{content}</Scrollable> : content;
};

export default BookmarksList;
