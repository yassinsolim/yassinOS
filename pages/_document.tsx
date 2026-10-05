import { readFileSync } from "fs";
import { join } from "path";
import NextDocument, {
  type DocumentContext,
  type DocumentInitialProps,
  Head,
  Html,
  Main,
  NextScript,
} from "next/document";
import { ServerStyleSheet } from "styled-components";
import { nextShellBootScript } from "shell/route";
import { DEFAULT_LOCALE } from "utils/constants";

// what a plain visit opens first (hooks/useUrlLoader.ts): the Portfolio, in a
// window with its taskbar entry. their chunks are fetched with the page's own
// instead of one import after another once the desktop is up
const STARTUP_IMPORTS = [
  "components/apps/Portfolio",
  "components/system/Apps/RenderComponent",
  "components/system/Window",
  "components/system/Taskbar/TaskbarEntry",
];

const startupChunks = (): string[] => {
  if (process.env.NODE_ENV !== "production") return [];

  try {
    const manifest = JSON.parse(
      readFileSync(
        join(process.cwd(), ".next", "react-loadable-manifest.json"),
        "utf8"
      )
    ) as Record<string, { files: string[] }>;
    const files = new Set<string>();

    Object.entries(manifest).forEach(([key, { files: chunkFiles }]) => {
      if (STARTUP_IMPORTS.some((request) => key.endsWith(` -> ${request}`))) {
        chunkFiles.forEach((file) => files.add(`/_next/${file}`));
      }
    });

    return [...files];
  } catch {
    return [];
  }
};

// not when ?app= or ?url= picks what opens, or on the room's main screen
// (useUrlLoader's shouldSkipAutoLaunch), where nothing does
const preloadStartupScript = (files: string[]): string =>
  `(()=>{const q=new URLSearchParams(location.search);if(q.has("app")||q.has("url")||(q.get("embed")==="1"&&q.get("display")==="main"))return;for(const href of ${JSON.stringify(
    files
  )}){const l=document.createElement("link");l.rel="preload";l.as="script";l.href=href;document.head.append(l)}})()`;

const withStyledComponents = async (
  ctx: DocumentContext
): Promise<DocumentInitialProps> => {
  const { renderPage } = ctx;
  const sheet = new ServerStyleSheet();

  try {
    ctx.renderPage = () =>
      renderPage({
        enhanceApp: (App) => (props) => sheet.collectStyles(<App {...props} />),
      });

    const { styles, ...initialProps } = await NextDocument.getInitialProps(ctx);

    return {
      ...initialProps,
      styles: [styles, sheet.getStyleElement()],
    };
  } finally {
    sheet.seal();
  }
};

class Document extends NextDocument {
  public static override async getInitialProps(
    ctx: DocumentContext
  ): Promise<DocumentInitialProps> {
    return withStyledComponents(ctx);
  }

  public override render(): React.JSX.Element {
    const chunks = this.props.__NEXT_DATA__.page === "/" ? startupChunks() : [];

    return (
      <Html lang={DEFAULT_LOCALE}>
        <Head>
          {chunks.length > 0 && (
            <script
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: preloadStartupScript(chunks) }}
            />
          )}
        </Head>
        <body>
          <script
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: nextShellBootScript }}
          />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default Document;
