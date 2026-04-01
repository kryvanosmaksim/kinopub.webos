import { useMemo } from 'react';
import { UseInfiniteQueryOptions, useInfiniteQuery } from 'react-query';

import ApiClient, { PaginationResponse } from 'api';

import { Method, Methods } from './useApi';

function useApiInfinite<T extends Method>(
  method: T,
  params: Parameters<ApiClient[T]> = [] as Parameters<ApiClient[T]>,
  options?: UseInfiniteQueryOptions<Methods[T]>,
) {
  const client = useMemo(() => new ApiClient(), []);
  const query = useInfiniteQuery<Methods[T], string, Methods[T]>(
    [method, ...params],
    ({ pageParam }) => {
      // @ts-expect-error
      return client[method](...params, pageParam) as Methods[T];
    },
    // @ts-expect-error
    {
      ...options,
      getNextPageParam: (lastPage: any) => {
        if (lastPage.items && !Array.isArray(lastPage.items) && !lastPage.pagination) {
          let maxCurrent = 0;
          let maxTotal = 0;
          Object.values(lastPage.items).forEach((section: any) => {
            if (section.pagination) {
              if (section.pagination.current > maxCurrent) maxCurrent = section.pagination.current;
              if (section.pagination.total > maxTotal) maxTotal = section.pagination.total;
            }
          });
          if (maxCurrent > 0 && maxCurrent < maxTotal) return maxCurrent + 1;
          return undefined;
        }

        if (lastPage.pagination) {
          if (lastPage.pagination.current < lastPage.pagination.total) {
            return lastPage.pagination.current + 1;
          }
          return undefined;
        }

        return undefined;
      },
      ...options,
    },
  );

  return query;
}

export default useApiInfinite;
