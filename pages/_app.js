/**
 * pages/_app.js
 * Custom App wrapper — imports global styles.
 */
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
