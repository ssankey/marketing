import dynamic from 'next/dynamic';

const redis = dynamic(
  () => import('./redis'),
  { 
    ssr: false,
    loading: () => null
  }
);

export default redis;