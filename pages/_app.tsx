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
      {/* El halo global del spotlight (DESIGN-SPEC §3) NO se monta aquí, sino
          en `pages/index.tsx`, aunque conceptualmente sea de app. Turbopack
          construye `_app` y cada página como entradas separadas y NO comparte
          el chunk de framer-motion entre ellas: importarlo desde `_app`
          duplicaba framer-motion en el bundle inicial (+187 KB raw / +61 KB
          gzip, medido). Montado en la página, el halo cubre igual el documento
          entero —es `fixed`— y el costo marginal es cero. Ver Entrada 18. */}
      <Component {...pageProps} />
    </div>
  );
}

export default appWithTranslation(App);
