import { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import BackgroundPaths from '@/components/common/BackgroundPaths';
import GlobalSpotlight from '@/components/common/GlobalSpotlight';
import Navigation from '@/components/common/Navigation';
import Hero from '@/components/sections/Hero';
import Services from '@/components/sections/Services';
import Team from '@/components/sections/Team';
import Contact from '@/components/sections/Contact';
import Footer from '@/components/sections/Footer';

export default function Home() {
  const { t } = useTranslation('common');

  return (
    <>
      <Head>
        <title>{t('meta.title')}</title>
        <meta name="description" content={t('meta.description')} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* ===== RAÍZ DE APILAMIENTO DE LA PÁGINA (3.5a) =====

          `isolate` (`isolation: isolate`) abre aquí un stacking context
          explícito, y `bg-bg` pinta el color base como fondo de un elemento
          REAL en flujo. Dentro de ese contexto el orden es una escalera de
          z-index NO NEGATIVOS:

            color base (fondo de este mismo div)
              → paths de atmósfera   z-0   (sin JS, también en táctil)
              → halo global          z-10  (solo en modo puntero)
              → contenido            z-20
              → navegación           z-50  (dentro del contenido)

          POR QUÉ ESTO Y NO `-z-20`/`-z-10` CONTRA EL LIENZO DEL `html`.
          Un z-index negativo no se apila contra "el fondo de la página": se
          apila por debajo de los FONDOS DE BLOQUE de todo el árbol. Mientras
          nadie pinte un fondo opaco funciona, pero el día que alguien lo pinta
          la capa decorativa desaparece sin que nada falle ni avise. Ya pasó dos
          veces: el `background` duplicado de `body` (3.4b) y el `bg-bg` de
          `Section`, y las dos veces la solución fue QUITAR un fondo, es decir
          sostener el efecto por ausencia. Aquí el orden está escrito: quien
          añada un fondo opaco lo hace en un escalón concreto de esta escalera y
          ve exactamente qué tapa.

          El `html { background-color }` de `globals.css` se queda, pero solo
          como lienzo del documento (overscroll y el área que este div no cubre).
          El lienzo se pinta SIEMPRE por debajo de todo, así que no participa de
          este orden ni puede tapar nada.

          `isolation: isolate` NO crea containing block para `position: fixed`
          (eso solo lo hacen `transform`, `filter`, `perspective`,
          `will-change: transform` y `contain`), así que las tres capas `fixed`
          —paths, halo y nav— siguen posicionándose contra el viewport.

          Las decorativas se montan aquí y no en `_app.tsx` por la razón de la
          Entrada 18 (Turbopack duplicaría el chunk de framer-motion) y porque
          así todo el orden de apilamiento se lee en un solo archivo. */}
      <div className="relative isolate min-h-screen bg-bg">
        <BackgroundPaths />
        <GlobalSpotlight />

        {/* El contenido, en su propio escalón. `relative` + `z-20` lo suben por
            encima de las dos capas decorativas de forma explícita; ya no
            depende de que las capas se hundan solas. */}
        <div className="relative z-20">
          <Navigation />
          <main>
            <Hero />
            <Services />
            <Team />
            <Contact />
          </main>
          <Footer />
        </div>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'es', ['common'])),
    },
  };
};
