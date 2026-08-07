import type * as PdfjsLib from "pdfjs-dist";

/** What the vendored v3 text layer reads out of `getTextContent()`. */
export type PdfTextContentSource = {
  items: object[];
  styles: Record<string, object>;
};

/** The subset of pdf.js's link service that the annotation layer calls. */
export type PdfLinkService = {
  addLinkAttributes: (link: HTMLAnchorElement, url: string) => void;
  externalLinkEnabled: boolean;
  externalLinkRel: string;
  getAnchorUrl: (url: string) => string;
  getDestinationHash: () => string;
  goToDestination: () => void;
};

/** The annotation fields the vendored layer reads when rendering links. */
export type PdfAnnotation = {
  rect: number[];
  subtype: string;
  url?: string;
};

/**
 * The vendored build in `public/Program Files/PDF.js` is v3.11, while the
 * `pdfjs-dist` types are v5. v5 replaced `renderTextLayer` with a `TextLayer`
 * class and reshaped `AnnotationLayer`, so both are declared here against the
 * build that actually ships.
 */
type VendoredPdfjsLib = typeof PdfjsLib & {
  AnnotationLayer: new (layerParameters: {
    div: HTMLElement;
    page: PdfjsLib.PDFPageProxy;
    viewport: PdfjsLib.PageViewport;
  }) => {
    render: (renderParameters: {
      annotations: PdfAnnotation[];
      linkService: PdfLinkService;
      renderForms: boolean;
    }) => Promise<void>;
  };
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
