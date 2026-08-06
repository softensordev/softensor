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

      {/* Capas decorativas de fondo, en orden de apilamiento (DESIGN-SPEC §1 y
          §3). Las dos son `fixed` y de z-index NEGATIVO, así que cubren el
          documento entero sin participar del flujo ni poder tapar contenido:
          "global" no depende de dónde se monten, y desde aquí no duplican el
          chunk de framer-motion (ver `_app.tsx`). Fuera del `<div>` de layout a
          propósito: no son contenido.

          Orden final de capas de fondo:
            lienzo del documento (`html { background-color }`)
              → paths de atmósfera   (-z-20, sin JS, también en táctil)
              → halo global          (-z-10, solo en modo puntero)
              → contenido            (z auto)
              → navegación           (z-50, opaca a propósito) */}
      <BackgroundPaths />
      <GlobalSpotlight />

      <div className="min-h-screen">
        <Navigation />
        <main>
          <Hero />
          <Services />
          <Team />
          <Contact />
        </main>
        <Footer />
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
