// hooks/useDashboardData.js
import useSWR from 'swr';

const fetcher = async ([url, token]) => {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`, // Pass token in the header
    },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch');
  }
  return res.json();
};

const useDashboardData = (filters) => {
  // 1) Extract token from the filters
  const { token, ...rest } = filters;

  // 2) Build the query string from the rest of the filters
  const query = new URLSearchParams(rest).toString();
  const requestUrl = `/api/dashboard?${query}`;

  // 3) Pass both URL and token as an array, so SWR
  //    can forward them to the fetcher.
  const { data, error } = useSWR([requestUrl, token], fetcher);

  return {
    data: data ?? null,
    error,
    isLoading: !data && !error,
  };
};

export default useDashboardData;
