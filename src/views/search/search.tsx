import { useCallback } from 'react';
import cx from 'classnames';
import orderBy from 'lodash/orderBy';

import { Item } from 'api';
import Button from 'components/button';
import Input from 'components/input';
import Seo from 'components/seo';
import Text from 'components/text';
import ItemsListInfinite from 'containers/itemsListInfinite';
import useApiInfinite from 'hooks/useApiInfinite';
import useRouteState from 'hooks/useRouteState';

function processItems(items: Item[]) {
  return orderBy(items || [], 'year', 'desc');
}

const MODES = [
  { value: '', label: 'Название' },
  { value: 'actor', label: 'Актёр' },
  { value: 'director', label: 'Режиссёр' },
];

const SearchView: React.FC = () => {
  const [query, setQuery] = useRouteState('q', '');
  const [mode, setMode] = useRouteState('mode', '');

  const isActor = mode === 'actor';
  const isDirector = mode === 'director';

  const apiMethod = isActor || isDirector ? 'items' : 'itemsSearch';
  const apiParams = isActor ? { actor: query } : isDirector ? { director: query } : { q: query };

  const queryResult = useApiInfinite(apiMethod, [apiParams]);

  const handleQueryChange = useCallback(
    (value) => {
      setQuery(value);
    },
    [setQuery],
  );

  const handleModeChange = useCallback(
    (value: string) => {
      setMode(value, true);
    },
    [setMode],
  );

  return (
    <>
      <Seo title="Поиск" />

      <ItemsListInfinite
        title={
          <div className="w-full">
            <div className="flex justify-between items-center mb-3 h-9">
              <Text>Поиск</Text>
            </div>
            <Input autoFocus placeholder="Название фильма или сериала..." value={query} onChange={handleQueryChange} />
            <div className="flex" style={{ marginTop: '0.5rem' }}>
              {MODES.map(({ value, label }) => (
                <Button
                  key={value}
                  className={cx('border', {
                    'border-red-600 text-red-500': mode === value,
                    'border-gray-600 text-gray-400': mode !== value,
                  })}
                  style={{ marginRight: '0.5rem' }}
                  onClick={() => handleModeChange(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        }
        showResult={query.length > 2}
        queryResult={queryResult as any}
        processItems={processItems}
      />
    </>
  );
};

export default SearchView;
