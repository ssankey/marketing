import { useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import SSRProvider from 'react-bootstrap/SSRProvider';
import { Analytics } from '@vercel/analytics/react';
import { SWRConfig } from 'swr';
import '../components/components.css';
// Import layouts
import DefaultDashboardLayout from 'layouts/DefaultDashboardLayout';
// Import styles
import 'styles/theme.scss';

// Default SEO configuration
const DEFAULT_SEO = {
  title: "Density",
  description: "A modern and responsive Next.js dashboard template.",
  keywords: "Next.js, dashboard, UI kit, web application"
};

// SWR Configuration
const SWR_CONFIG = {
  revalidateOnFocus: false,
  shouldRetryOnError: false,
  dedupingInterval: 5000,
  fetcher: (url) =>
    fetch(url).then((res) => {
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    }),
};

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  
  // Memoize the base URL
  const baseURL = useMemo(
    () => process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    []
  );

  // Construct the full page URL
  const pageURL = useMemo(
    () => `${baseURL}${router.pathname}`, 
    [baseURL, router.pathname]
  );

  // Memoize the pageSEO to fix the dependency warning
  const pageSEO = useMemo(
    () => Component.seo || {},
    [Component.seo]
  );

  // Memoize SEO data with pageSEO inside the callback
  const seoData = useMemo(() => ({
    title: pageSEO.title || DEFAULT_SEO.title,
    description: pageSEO.description || DEFAULT_SEO.description,
    keywords: pageSEO.keywords || DEFAULT_SEO.keywords,
    canonical: pageURL,
    openGraph: {
      url: pageURL,
      title: pageSEO.title || DEFAULT_SEO.title,
      description: pageSEO.description || DEFAULT_SEO.description,
      site_name: process.env.NEXT_PUBLIC_SITE_NAME,
    },
  }), [pageSEO, pageURL]);

  const isAuthPage = useMemo(
    () => 
      router.pathname === "/login" ||
      router.pathname === "/signup" ||
      router.pathname === "/forgot-password",
    [router.pathname]
  );

  // Determine the layout based on the component or route
  const Layout = useMemo(() => {
    if (isAuthPage) {
      const AuthLayout = ({ children }) => <>{children}</>;
      AuthLayout.displayName = 'AuthLayout'; // Add display name to fix the error
      return AuthLayout;
    }
    if (Component.Layout) {
      return Component.Layout;
    }
    if (router.pathname.includes("dashboard")) {
      return DefaultDashboardLayout;
    }
    return DefaultDashboardLayout;
  }, [Component.Layout, router.pathname, isAuthPage]);

  // Add display name to MyApp component
  MyApp.displayName = 'MyApp';

  return (
    <SWRConfig value={SWR_CONFIG}>
      <SSRProvider>
        <Head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
          <meta name="keywords" content={seoData.keywords} />
          <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        </Head>
        <NextSeo {...seoData} />
        <Layout>
          <Component {...pageProps} />
          <Analytics
            mode={process.env.NODE_ENV === 'production' ? 'production' : 'development'}
            debug={process.env.NODE_ENV === 'development'}
          />
        </Layout>
      </SSRProvider>
    </SWRConfig>
  );
}

export default MyApp;
