import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="ja">
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#E85D04" />
        <link rel="apple-touch-icon" href="/act_logo_2_b.jpg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Act." />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
