import { appWithTranslation } from 'next-i18next';
import type { AppProps } from 'next/app';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import '@/styles/globals.css';

/* Presupuesto tipográfico: DESIGN-SPEC.md §8.
   Space Grotesk es la única fuente que bloquea render (preload). */
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '700'],
  display: 'swap',
  variable: '--font-space-grotesk',
  preload: true,
});

/* Mono: labels, eyebrows, badges y números. Nunca el hero → sin preload. */
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: '500',
  display: 'swap',
  variable: '--font-jetbrains-mono',
  preload: false,
});

function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans`}>
      <Component {...pageProps} />
    </div>
  );
}

export default appWithTranslation(App);
