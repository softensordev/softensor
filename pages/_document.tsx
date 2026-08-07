import Document, {
  Html,
  Head,
  Main,
  NextScript,
  type DocumentContext,
  type DocumentInitialProps,
} from 'next/document';

type SoftensorDocumentProps = DocumentInitialProps & { locale: string };

/* Document con `getInitialProps` para poder leer el locale activo (3.5b-2).
   `<Html>` no tiene acceso al router —no hay provider en el documento—, así que
   el locale se toma del contexto del render: `ctx.locale` es lo que expone el
   Pages Router cuando hay i18n configurado (el mismo valor que acaba en
   `__NEXT_DATA__.locale`, que no está en el tipo de `DocumentContext`). Si no
   estuviera, se cae a `'es'`, el `defaultLocale`.

   Esto NO opta la app fuera de la optimización estática: `Document` se ejecuta
   solo en el servidor y, para páginas estáticas, en tiempo de build — el
   `lang` queda horneado en cada HTML prerenderizado (uno por locale). */
export default class SoftensorDocument extends Document<SoftensorDocumentProps> {
  static async getInitialProps(
    ctx: DocumentContext
  ): Promise<SoftensorDocumentProps> {
    const initialProps = await Document.getInitialProps(ctx);
    const locale = ctx.locale ?? 'es';
    return { ...initialProps, locale };
  }

  render() {
    return (
      <Html lang={this.props.locale}>
        <Head>
          <meta charSet="utf-8" />

          {/* Set de favicon (3.5b-2). Orden deliberado: el `.ico` primero con
              `sizes="any"` para que los navegadores modernos lo descarten a
              favor del SVG y los antiguos —que ignoran el atributo `type`— se
              queden con él. El SVG es el icono real: vectorial, nítido en
              cualquier densidad, y un solo archivo de 296 B.
              El PNG de 180 px es para iOS (pantalla de inicio), que no lee SVG.
              Los PNG 16/32/48/512 de `public/brand/` son masters de referencia:
              no necesitan `<link>` porque el SVG ya cubre esos tamaños.
              Sin `site.webmanifest` — ver bitácora 3.5b-2. */}
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <link rel="apple-touch-icon" href="/favicon-180.png" />

          {/* Tiñe la barra del navegador en móvil con el fondo del sitio, para
              que el cromo no corte la página con una franja clara. */}
          <meta name="theme-color" content="#07090A" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
