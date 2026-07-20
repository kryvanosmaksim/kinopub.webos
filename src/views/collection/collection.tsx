import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import Spotlight from '@enact/spotlight';

import Button from 'components/button';
import ItemsList from 'components/itemsList';
import Popup from 'components/popup';
import Seo from 'components/seo';
import useApi from 'hooks/useApi';
import { RouteParams } from 'routes';

const SORT_OPTIONS = [
  { key: 'added', label: 'Дата добавления', defaultAsc: false },
  { key: 'title', label: 'Название', defaultAsc: true },
  { key: 'year', label: 'Год', defaultAsc: false },
  { key: 'rating', label: 'Рейтинг', defaultAsc: false },
  { key: 'views', label: 'Просмотры', defaultAsc: false },
];

const getRating = (item: any) => item.kinopoisk_rating || item.imdb_rating || item.rating || 0;

const CollectionView: React.FC = () => {
  const { collectionId } = useParams<RouteParams>();
  const location = useLocation<{ title?: string }>();
  const { data, isLoading } = useApi('collectionItems', [collectionId!]);
  const { title = data?.collection?.title } = location.state || {};

  const [sortKey, setSortKey] = useState('added');
  const [sortAsc, setSortAsc] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);

  const lastClickedRef = useRef<Element | null>(null);

  useEffect(() => {
    if (popupOpen && lastClickedRef.current) {
      const el = lastClickedRef.current;
      requestAnimationFrame(() => {
        Spotlight.focus(el);
      });
    }
  }, [sortKey, sortAsc, popupOpen]);

  const currentLabel = SORT_OPTIONS.find((o) => o.key === sortKey)?.label;

  const handleSelect = useCallback(
    (opt: typeof SORT_OPTIONS[0]) => {
      if (sortKey === opt.key) {
        setSortAsc((a) => !a);
      } else {
        setSortKey(opt.key);
        setSortAsc(opt.defaultAsc);
      }
    },
    [sortKey],
  );

  const sortedItems = useMemo(() => {
    const items = data?.items;
    if (!items || sortKey === 'added') return items;
    return [...items].sort((a: any, b: any) => {
      const va = sortKey === 'rating' ? getRating(a) : a[sortKey] ?? '';
      const vb = sortKey === 'rating' ? getRating(b) : b[sortKey] ?? '';
      if (typeof va === 'string') return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortAsc ? va - vb : vb - va;
    });
  }, [data?.items, sortKey, sortAsc]);

  const titleNode = useMemo(
    () => (
      <>
        <span>{title}</span>
        <Button
          icon="sort"
          onClick={() => setPopupOpen(true)}
          className="border border-gray-600 rounded-full text-sm text-gray-300"
          style={{ padding: '2px 12px' }}
        >
          {currentLabel}
          {sortKey !== 'added' ? (sortAsc ? ' ↑' : ' ↓') : ''}
        </Button>
      </>
    ),
    [title, currentLabel, sortKey, sortAsc],
  );

  return (
    <>
      <Seo title={`Подборка: ${title}`} />
      <ItemsList title={titleNode} items={sortedItems} loading={isLoading} />
      <Popup visible={popupOpen} onClose={() => setPopupOpen(false)}>
        <div className="flex flex-wrap">
          {SORT_OPTIONS.map((opt) => {
            const isActive = sortKey === opt.key;
            return (
              <Button
                key={opt.key}
                className="border border-gray-600 rounded-full text-sm"
                style={{
                  marginRight: '0.5rem',
                  marginBottom: '0.5rem',
                  padding: '4px 16px',
                  color: isActive ? '#fff' : '#9ca3af',
                  borderColor: isActive ? '#6b7280' : '#4b5563',
                }}
                onClick={(e: React.MouseEvent) => {
                  lastClickedRef.current = e.currentTarget as Element;
                  handleSelect(opt);
                }}
              >
                {opt.label}
                {isActive && sortKey !== 'added' ? (sortAsc ? ' ↑' : ' ↓') : ''}
              </Button>
            );
          })}
        </div>
      </Popup>
    </>
  );
};

export default CollectionView;
