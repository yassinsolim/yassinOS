import type * as PdfjsLib from "pdfjs-dist";

/** What the vendored v3 text layer reads out of `getTextContent()`. */
export type PdfTextContentSource = {
  items: object[];
  styles: Record<string, object>;
};

/**
 * The vendored build in `public/Program Files/PDF.js` is v3.11, while the
 * `pdfjs-dist` types are v5. v5 replaced the `renderTextLayer` function with a
 * `TextLayer` class, so the function is declared here against the build that
 * actually ships.
 */
type VendoredPdfjsLib = typeof PdfjsLib & {
  renderTextLayer: (parameters: {
    container: HTMLElement;
    textContentSource: PdfTextContentSource;
    viewport: PdfjsLib.PageViewport;
  }) => { promise: Promise<void> };
};

declare global {
  interface Window {
    pdfjsLib?: VendoredPdfjsLib;
  }
}

export type MetadataInfo = { Title?: string };

declare module "print-js" {
  const printJs: (options: {
    base64: boolean;
    printable: string;
    type: "pdf";
  }) => void;

  export default printJs;
}
