// pages/_app.js
import { useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import SSRProvider from 'react-bootstrap/SSRProvider';
import { Analytics } from '@vercel/analytics/react';
import { SWRConfig } from 'swr';

// Import layouts
import DefaultDashboardLayout from 'layouts/DefaultDashboardLayout';

// Import styles
import 'styles/theme.scss';

// SEO Configuration
const DEFAULT_SEO = {
  title: "Dash UI - Next.Js Admin Dashboard Template",
  description: "Dash is a fully responsive and yet modern premium Nextjs template & snippets. Geek is feature-rich Nextjs components and beautifully designed pages that help you create the best possible website and web application projects.",
  keywords: "Dash UI, Nextjs, Next.js, Course, Sass, landing, Marketing, admin themes, Nextjs admin, Nextjs dashboard, ui kit, web app, multipurpose"
};

// SWR Configuration
const SWR_CONFIG = {
  revalidateOnFocus: false,
  shouldRetryOnError: false,
  dedupingInterval: 5000,
  fetcher: (url) => fetch(url).then((res) => {
    if (!res.ok) throw new Error('Network response was not ok');
    return res.json();
  })
};

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  
  // Memoize the base URL to prevent unnecessary recalculations
  const baseURL = useMemo(() => {
    return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  }, []);

  // Memoize the current page URL
  const pageURL = useMemo(() => {
    return `${baseURL}${router.pathname}`;
  }, [baseURL, router.pathname]);

  // Determine the layout based on the current route
  const Layout = useMemo(() => {
    // Use the component's specified layout if it exists
    if (Component.Layout) {
      return Component.Layout;
    }

    // Default to dashboard layout for all dashboard routes
    if (router.pathname.includes('dashboard')) {
      return DefaultDashboardLayout;
    }

    // Fallback to default layout
    return DefaultDashboardLayout;
  }, [Component.Layout, router.pathname]);

  // Memoize SEO data
  const seoData = useMemo(() => ({
    ...DEFAULT_SEO,
    canonical: pageURL,
    openGraph: {
      url: pageURL,
      title: DEFAULT_SEO.title,
      description: DEFAULT_SEO.description,
      site_name: process.env.NEXT_PUBLIC_SITE_NAME
    }
  }), [pageURL]);

  return (
    <SWRConfig value={SWR_CONFIG}>
      <SSRProvider>
        <Head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
          <meta name="keywords" content={DEFAULT_SEO.keywords} />
          <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
          
          {/* Preconnect to important domains */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          
          {/* Add any other meta tags or preload directives here */}
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