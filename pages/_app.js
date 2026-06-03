// // pages/_app.js
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

// const DEFAULT_SEO = {
//   title: "Density",
//   description: "A modern and responsive Next.js dashboard template.",
//   keywords: "Next.js, dashboard, UI kit, web application",
// };

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

// // Public pages that don’t require auth
// const publicRoutes = [
//   "/login",
//   "/signup",
//   "/forgot-password",
//   "/otp-verification",
//   "/set-password",
//   "/dispatch" ,
// ];

// function AuthenticatedApp({ Component, pageProps }) {
//   const router = useRouter();
//   const { isAuthenticated, isLoading } = useAuth();

//   const isPublic = publicRoutes.includes(router.pathname);

//   const baseURL = useMemo(
//     () => process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
//     []
//   );
//   const pageURL = useMemo(() => `${baseURL}${router.asPath}`, [baseURL, router.asPath]);
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
//     () => publicRoutes.includes(router.pathname),
//     [router.pathname]
//   );

//   const Layout = useMemo(() => {
//     if (Component.Layout === null || Component.noLayout || Component.Layout === false) {
//       return ({ children }) => <>{children}</>;
//     }

//     if (Component.Layout !== undefined) return Component.Layout;
//     if (isAuthPage) return ({ children }) => <>{children}</>;

//     return DefaultDashboardLayout;
//   }, [Component.Layout, Component.noLayout, isAuthPage]);

//   // Redirect to /login if accessing private page while unauthenticated
//   if (!isPublic && !isAuthenticated && !isLoading && typeof window !== "undefined") {
//     router.push("/login");
//     return null;
//   }

//   return (
//     <>
//       <Head>
//         <meta charSet="utf-8" />
//         <meta
//           name="viewport"
//           content="width=device-width, initial-scale=1, shrink-to-fit=no"
//         />
//         <meta name="keywords" content={seoData.keywords} />
//         <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
//         <link rel="preconnect" href="https://fonts.googleapis.com" />
//         <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
//       </Head>
//       <NextSeo {...seoData} />
      
//       <Layout>
//         <Component {...pageProps} />
//         <Analytics
//           mode={process.env.NODE_ENV === "production" ? "production" : "development"}
//           debug={process.env.NODE_ENV === "development"}
//         />
//       </Layout>
//     </>
//   );
// }

// function MyApp({ Component, pageProps }) {
//   return (
//     <AuthProvider>
//       <SWRConfig value={SWR_CONFIG}>
//         <SSRProvider>
//           <AuthenticatedApp Component={Component} pageProps={pageProps} />
//         </SSRProvider>
//       </SWRConfig>
//     </AuthProvider>
//   );
// }

// export default MyApp;


// pages/_app.js
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

// ── Global fetch patch ──────────────────────────────────────────────────────
// Runs once on the client. Injects Authorization: Bearer <token> into every
// /api/ fetch call automatically — no changes needed in individual pages/hooks.
if (typeof window !== "undefined") {
  const _originalFetch = window.fetch;
  window.fetch = async (url, options = {}) => {
    const isInternalApi = typeof url === "string" && url.startsWith("/api/");
    if (isInternalApi) {
      const token = localStorage.getItem("token");
      if (token) {
        options = {
          ...options,
          headers: {
            "Content-Type": "application/json",
            ...options.headers,       // allow per-call overrides
            Authorization: `Bearer ${token}`,
          },
        };
      }
    }
    return _originalFetch(url, options);
  };
}
// ───────────────────────────────────────────────────────────────────────────

const DEFAULT_SEO = {
  title: "Density Dashboard",
  description: "Density Pharmachem Pvt Limited",
  keywords: "Density Pharmachem, dashboard, analytics, sales, quotations",
};

// ── SWR config — fetcher now picks up the patched fetch automatically ──────
const SWR_CONFIG = {
  revalidateOnFocus: false,
  shouldRetryOnError: false,
  dedupingInterval: 5000,
  fetcher: (url) =>
    fetch(url).then((res) => {
      if (!res.ok) {
        const err = new Error("Network response was not ok");
        err.status = res.status;
        throw err;
      }
      return res.json();
    }),
};
// ───────────────────────────────────────────────────────────────────────────

// Public pages that don't require auth
const publicRoutes = [
  "/login",
  "/signup",
  "/forgot-password",
  "/otp-verification",
  "/set-password",
  "/dispatch",
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
        <link rel="icon" type="image/png" href="/images/favicon/titlelogo.png" />
        <link rel="shortcut icon" href="/images/favicon/titlelogo.png" />
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