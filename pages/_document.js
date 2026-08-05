// import { Html, Head, Main, NextScript } from 'next/document'

// export default function Document() {
//   return (
//     <Html lang="en">
//       <Head />
//       <body className='bg-light'>
//         <Main />
//         <NextScript />
//       </body>
//     </Html>
//   )
// }

import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html>
      <Head>
        <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon/titlelogo.png" />
        <link rel="shortcut icon" href="/images/favicon/titlelogo.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}