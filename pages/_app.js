// // import { useMemo } from 'react';
// // import Head from 'next/head';
// // import { useRouter } from 'next/router';
// // import { NextSeo } from 'next-seo';
// // import SSRProvider from 'react-bootstrap/SSRProvider';
// // import { Analytics } from '@vercel/analytics/react';
// // import { SWRConfig } from 'swr';
// // import '../components/components.css';
// // import 'bootstrap-icons/font/bootstrap-icons.css';
// // // Import layouts
// // import { useAuth } from "contexts/AuthContext";

// // import "styles/theme.scss";

// // import DefaultDashboardLayout from 'layouts/DefaultDashboardLayout';
// // // Import styles
// // import 'styles/theme.scss';
// // import { AuthProvider } from 'contexts/AuthContext';

// // // Default SEO configuration
// // const DEFAULT_SEO = {
// //   title: 'Density',
// //   description: 'A modern and responsive Next.js dashboard template.',
// //   keywords: 'Next.js, dashboard, UI kit, web application',
// // };

// // // SWR Configuration
// // const SWR_CONFIG = {
// //   revalidateOnFocus: false,
// //   shouldRetryOnError: false,
// //   dedupingInterval: 5000,
// //   fetcher: (url) =>
// //     fetch(url).then((res) => {
// //       if (!res.ok) throw new Error('Network response was not ok');
// //       return res.json();
// //     }),
// // };

// // function MyApp({ Component, pageProps }) {
// //   const router = useRouter();
   


// //   const publicRoutes = [
// //     "/login",
// //     "/signup",
// //     "/forgot-password",
// //     "/otp-verification",
// //     "/set-password",
// //   ];

// //   const isPublicRoute = publicRoutes.includes(router.pathname);


// //   // Memoize the base URL
// //   const baseURL = useMemo(
// //     () => process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
// //     []
// //   );

// //   // Construct the full page URL
// //   const pageURL = useMemo(() => `${baseURL}${router.asPath}`, [baseURL, router.asPath]);

// //   // Memoize the pageSEO
// //   const pageSEO = useMemo(() => Component.seo || {}, [Component]);

// //   // Memoize SEO data
// //   const seoData = useMemo(
// //     () => ({
// //       title: pageSEO.title || DEFAULT_SEO.title,
// //       description: pageSEO.description || DEFAULT_SEO.description,
// //       keywords: pageSEO.keywords || DEFAULT_SEO.keywords,
// //       canonical: pageURL,
// //       openGraph: {
// //         url: pageURL,
// //         title: pageSEO.title || DEFAULT_SEO.title,
// //         description: pageSEO.description || DEFAULT_SEO.description,
// //         site_name: process.env.NEXT_PUBLIC_SITE_NAME,
// //       },
// //     }),
// //     [pageSEO, pageURL]
// //   );

// //   const isAuthPage = useMemo(
// //     () =>
// //       router.pathname === '/login' ||
// //       router.pathname === '/signup' ||
// //       router.pathname === '/forgot-password' ||
// //       router.pathname === '/set-password',
// //     [router.pathname]
// //   );

// //   // Determine the layout based on the component or route
// //   const Layout = useMemo(() => {
// //     // If Layout is explicitly set to null, use a fragment layout
// //     if (Component.Layout === null) {
// //       const NullLayout = ({ children }) => <>{children}</>;
// //       NullLayout.displayName = 'NullLayout';
// //       return NullLayout;
// //     }

// //     // If noLayout or Layout is explicitly false
// //     if (Component.noLayout || Component.Layout === false) {
// //       const NoLayout = ({ children }) => <>{children}</>;
// //       NoLayout.displayName = 'NoLayout';
// //       return NoLayout;
// //     }

// //     // Use the Layout specified by the page component
// //     if (Component.Layout !== undefined) {
// //       return Component.Layout; // Could be a custom layout
// //     }

// //     // If it's an authentication page, use a simple layout
// //     if (isAuthPage) {
// //       const AuthLayout = ({ children }) => <>{children}</>;
// //       AuthLayout.displayName = 'AuthLayout';
// //       return AuthLayout;
// //     }

// //     // Use the DefaultDashboardLayout for other pages
// //     return DefaultDashboardLayout;
// //   }, [Component.Layout, Component.noLayout, isAuthPage]);

// //   MyApp.displayName = 'MyApp';

// //   return (
// //     <AuthProvider>
// //       <SWRConfig value={SWR_CONFIG}>
// //         <SSRProvider>
// //           <Head>
// //             <meta charSet="utf-8" />
// //             <meta
// //               name="viewport"
// //               content="width=device-width, initial-scale=1, shrink-to-fit=no"
// //             />
// //             <meta name="keywords" content={seoData.keywords} />
// //             <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
// //             <link rel="preconnect" href="https://fonts.googleapis.com" />
// //             <link
// //               rel="preconnect"
// //               href="https://fonts.gstatic.com"
// //               crossOrigin="anonymous"
// //             />
// //           </Head>
// //           <NextSeo {...seoData} />
// //           {/* <Layout>
// //             <Component {...pageProps} />
// //             <Analytics
// //               mode={process.env.NODE_ENV === 'production' ? 'production' : 'development'}
// //               debug={process.env.NODE_ENV === 'development'}
// //             />
// //           </Layout> */}
// //           {/* Protect private pages */}
// //           {!isPublicRoute && !isAuthenticated && !loading ? (
// //             (typeof window !== "undefined" && router.push("/login"), null)
// //           ) : (
// //             <Layout>
// //               <Component {...pageProps} />
// //               <Analytics
// //                 mode={
// //                   process.env.NODE_ENV === "production"
// //                     ? "production"
// //                     : "development"
// //                 }
// //                 debug={process.env.NODE_ENV === "development"}
// //               />
// //             </Layout>
// //           )}
// //         </SSRProvider>
// //       </SWRConfig>
// //     </AuthProvider>
// //   );
// // }

// // export default MyApp;


// import { useMemo } from "react";
// import Head from "next/head";
// import { useRouter } from "next/router";
// import { NextSeo } from "next-seo";
// import SSRProvider from "react-bootstrap/SSRProvider";
// import { Analytics } from "@vercel/analytics/react";
// import { SWRConfig } from "swr";

// import "../components/components.css";
// import "bootstrap-icons/font/bootstrap-icons.css";
// import "styles/theme.scss";

// import DefaultDashboardLayout from "layouts/DefaultDashboardLayout";
// import { AuthProvider, useAuth } from "contexts/AuthContext";

// // Default SEO configuration
// const DEFAULT_SEO = {
//   title: "Density",
//   description: "A modern and responsive Next.js dashboard template.",
//   keywords: "Next.js, dashboard, UI kit, web application",
// };

// // SWR Configuration
// const SWR_CONFIG = {
//   revalidateOnFocus: false,
//   shouldRetryOnError: false,
//   dedupingInterval: 5000,
//   fetcher: (url) =>
//     fetch(url).then((res) => {
//       if (!res.ok) throw new Error("Network response was not ok");
//       return res.json();
//     }),
// };

// // Separate app content to safely use useAuth after AuthProvider
// function AppContent({ Component, pageProps, Layout, isPublicRoute }) {
//   const router = useRouter();
//   const { isAuthenticated, isLoading } = useAuth();

//   if (!isPublicRoute && !isAuthenticated && !isLoading) {
//     if (typeof window !== "undefined") {
//       router.push("/login");
//     }
//     return null;
//   }

//   return (
//     <Layout>
//       <Component {...pageProps} />
//       <Analytics
//         mode={
//           process.env.NODE_ENV === "production" ? "production" : "development"
//         }
//         debug={process.env.NODE_ENV === "development"}
//       />
//     </Layout>
//   );
// }

// function MyApp({ Component, pageProps }) {
//   const router = useRouter();

//   const publicRoutes = [
//     "/login",
//     "/signup",
//     "/forgot-password",
//     "/otp-verification",
//     "/set-password",
//   ];
//   const isPublicRoute = publicRoutes.includes(router.pathname);

//   const baseURL = useMemo(
//     () => process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
//     []
//   );

//   const pageURL = useMemo(
//     () => `${baseURL}${router.asPath}`,
//     [baseURL, router.asPath]
//   );

//   const pageSEO = useMemo(() => Component.seo || {}, [Component]);

//   const seoData = useMemo(
//     () => ({
//       title: pageSEO.title || DEFAULT_SEO.title,
//       description: pageSEO.description || DEFAULT_SEO.description,
//       keywords: pageSEO.keywords || DEFAULT_SEO.keywords,
//       canonical: pageURL,
//       openGraph: {
//         url: pageURL,
//         title: pageSEO.title || DEFAULT_SEO.title,
//         description: pageSEO.description || DEFAULT_SEO.description,
//         site_name: process.env.NEXT_PUBLIC_SITE_NAME,
//       },
//     }),
//     [pageSEO, pageURL]
//   );

//   const isAuthPage = useMemo(
//     () =>
//       ["/login", "/signup", "/forgot-password", "/set-password"].includes(
//         router.pathname
//       ),
//     [router.pathname]
//   );

//   const Layout = useMemo(() => {
//     if (Component.Layout === null) {
//       return ({ children }) => <>{children}</>;
//     }
//     if (Component.noLayout || Component.Layout === false) {
//       return ({ children }) => <>{children}</>;
//     }
//     if (Component.Layout !== undefined) {
//       return Component.Layout;
//     }
//     if (isAuthPage) {
//       return ({ children }) => <>{children}</>;
//     }
//     return DefaultDashboardLayout;
//   }, [Component.Layout, Component.noLayout, isAuthPage]);

//   MyApp.displayName = "MyApp";

//   return (
//     <AuthProvider>
//       <SWRConfig value={SWR_CONFIG}>
//         <SSRProvider>
//           <Head>
//             <meta charSet="utf-8" />
//             <meta
//               name="viewport"
//               content="width=device-width, initial-scale=1, shrink-to-fit=no"
//             />
//             <meta name="keywords" content={seoData.keywords} />
//             <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
//             <link rel="preconnect" href="https://fonts.googleapis.com" />
//             <link
//               rel="preconnect"
//               href="https://fonts.gstatic.com"
//               crossOrigin="anonymous"
//             />
//           </Head>
//           <NextSeo {...seoData} />
//           <AppContent
//             Component={Component}
//             pageProps={pageProps}
//             Layout={Layout}
//             isPublicRoute={isPublicRoute}
//           />
//         </SSRProvider>
//       </SWRConfig>
//     </AuthProvider>
//   );
// }

// export default MyApp;

import { useMemo } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { NextSeo } from "next-seo";
import SSRProvider from "react-bootstrap/SSRProvider";
import { Analytics } from "@vercel/analytics/react";
import { SWRConfig } from "swr";
import "../components/components.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "styles/theme.scss";
import DefaultDashboardLayout from "layouts/DefaultDashboardLayout";
import { AuthProvider, useAuth } from "contexts/AuthContext";

const DEFAULT_SEO = {
  title: "Density",
  description: "A modern and responsive Next.js dashboard template.",
  keywords: "Next.js, dashboard, UI kit, web application",
};

const SWR_CONFIG = {
  revalidateOnFocus: false,
  shouldRetryOnError: false,
  dedupingInterval: 5000,
  fetcher: (url) =>
    fetch(url).then((res) => {
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    }),
};

// Public pages that don’t require auth
const publicRoutes = [
  "/login",
  "/signup",
  "/forgot-password",
  "/otp-verification",
  "/set-password",
];

function AuthenticatedApp({ Component, pageProps }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const isPublic = publicRoutes.includes(router.pathname);

  const baseURL = useMemo(
    () => process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
    []
  );
  const pageURL = useMemo(() => `${baseURL}${router.asPath}`, [baseURL, router.asPath]);
  const pageSEO = useMemo(() => Component.seo || {}, [Component]);
  const seoData = useMemo(
    () => ({
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
    }),
    [pageSEO, pageURL]
  );

  const isAuthPage = useMemo(
    () => publicRoutes.includes(router.pathname),
    [router.pathname]
  );

  const Layout = useMemo(() => {
    if (Component.Layout === null || Component.noLayout || Component.Layout === false) {
      return ({ children }) => <>{children}</>;
    }

    if (Component.Layout !== undefined) return Component.Layout;
    if (isAuthPage) return ({ children }) => <>{children}</>;

    return DefaultDashboardLayout;
  }, [Component.Layout, Component.noLayout, isAuthPage]);

  // Redirect to /login if accessing private page while unauthenticated
  if (!isPublic && !isAuthenticated && !isLoading && typeof window !== "undefined") {
    router.push("/login");
    return null;
  }

  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta name="keywords" content={seoData.keywords} />
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>
      <NextSeo {...seoData} />
      
      <Layout>
        <Component {...pageProps} />
        <Analytics
          mode={process.env.NODE_ENV === "production" ? "production" : "development"}
          debug={process.env.NODE_ENV === "development"}
        />
      </Layout>
    </>
  );
}

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <SWRConfig value={SWR_CONFIG}>
        <SSRProvider>
          <AuthenticatedApp Component={Component} pageProps={pageProps} />
        </SSRProvider>
      </SWRConfig>
    </AuthProvider>
  );
}

export default MyApp;
