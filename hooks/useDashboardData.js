// hooks/useDashboardData.js

import useSWR from 'swr';

const fetcher = (url) => fetch(url).then(res => res.json());

const useDashboardData = (filters) => {
  const query = new URLSearchParams(filters).toString();
  const { data, error } = useSWR(`/api/dashboard?${query}`, fetcher);

  return {
    data: data ? data : null,
    error,
    isLoading: !error && !data,
  };
};

export default useDashboardData;
