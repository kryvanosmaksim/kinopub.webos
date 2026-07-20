import { useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';

import { Item, ItemType, ItemsParams } from 'api';
import Seo from 'components/seo';
import Text from 'components/text';
import FilterItems from 'containers/filterItems';
import ItemsListInfinite from 'containers/itemsListInfinite';
import useApiInfinite from 'hooks/useApiInfinite';
import useSearchParams from 'hooks/useSearchParams';
import useSessionState from 'hooks/useSessionState';
import useStorageState from 'hooks/useStorageState';

const CARTOON_ANIME_RE = /мультфильм|аниме|cartoon|anime|animation/i;
const excludeCartoonsAndAnime = (items: Item[]) => items.filter((item) => !item.genres?.some((g) => CARTOON_ANIME_RE.test(g.title || '')));

const CATEGORY_TYPES: Record<ItemType, string> = {
  movie: 'Фильмы',
  serial: 'Сериалы',
  concert: 'Концерты',
  documovie: 'Документальные фильмы',
  docuserial: 'Документальные сериалы',
  tvshow: 'ТВ Шоу',
};

const getCategoryByType = (categoryType?: ItemType) => {
  return (categoryType ? CATEGORY_TYPES[categoryType] : categoryType) || '';
};

const CategoryView: React.FC = () => {
  const { categoryType } = useParams<{ categoryType: ItemType }>();
  const searchParams = useSearchParams();
  const location = useLocation<{ params?: ItemsParams; title?: string }>();
  const { params, title = getCategoryByType(categoryType) } = location.state || {};
  const [filterParams, setFilterParams] = useSessionState<ItemsParams | null>(`${categoryType}:filter:params`, null);
  const [hideCartoonsAnime] = useStorageState<boolean>('hide_cartoons_anime_in_tvshow');

  const queryResult = useApiInfinite('items', [
    {
      ...searchParams,
      ...params,
      ...filterParams,
      type: categoryType,
    },
  ]);

  const processItems = useMemo(
    () => (categoryType === 'tvshow' && hideCartoonsAnime ? excludeCartoonsAndAnime : undefined),
    [categoryType, hideCartoonsAnime],
  );

  return (
    <>
      <Seo title={title} />
      <ItemsListInfinite
        title={
          <>
            <Text>{title}</Text>
            <FilterItems type={categoryType} storageKey={categoryType} onFilter={setFilterParams} />
          </>
        }
        queryResult={queryResult}
        processItems={processItems}
      />
    </>
  );
};

export default CategoryView;
