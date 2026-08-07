import { basename } from "path";
import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  type PDFWorker,
  type PDFDocumentProxy,
} from "pdfjs-dist/types/src/display/api";
import type * as PdfjsLib from "pdfjs-dist";
import {
  type MetadataInfo,
  type PdfAnnotation,
} from "components/apps/PDF/types";
import useTitle from "components/system/Window/useTitle";
import { useFileSystem } from "contexts/fileSystem";
import { useProcesses } from "contexts/process";
import { BASE_2D_CONTEXT_OPTIONS } from "utils/constants";
import { loadFiles } from "utils/functions";

export const scales = [
  0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4,
  5,
];

const CANVAS_MARGIN_PX = 4;

/** Schemes a PDF is allowed to link out to. */
const ALLOWED_LINK_PROTOCOLS: Record<string, true> = {
  "http:": true,
  "https:": true,
  "mailto:": true,
  "tel:": true,
};

/**
 * Minimal link service for the annotation layer. pdf.js hands it each link
 * annotation and expects it to attach the href, which is also the right place
 * to refuse anything that is not an ordinary web or contact link.
 */
const linkService = {
  // pdf.js hands us the anchor it created and expects it to be configured in
  // place, so mutating the parameter is the API contract here.
  /* eslint-disable no-param-reassign */
  addLinkAttributes: (link: HTMLAnchorElement, url: string): void => {
    const safeUrl = window.pdfjsLib?.createValidAbsoluteUrl(url, undefined, {
      addDefaultProtocol: true,
    });

    if (!safeUrl || !ALLOWED_LINK_PROTOCOLS[safeUrl.protocol]) return;

    link.href = safeUrl.href;
    link.rel = "noopener noreferrer";

    // The desktop runs inside an iframe, so web links have to escape it.
    // mailto:/tel: stay in place so the OS hands them to the right handler.
    if (safeUrl.protocol === "http:" || safeUrl.protocol === "https:") {
      link.target = "_blank";
    }
  },
  /* eslint-enable no-param-reassign */
  externalLinkEnabled: true,
  externalLinkRel: "noopener noreferrer",
  getAnchorUrl: (url: string): string => url,
  getDestinationHash: (): string => "#",
  goToDestination: (): void => undefined,
};

/**
 * Scale so the whole page is visible, growing past 100% when there is room.
 * Snapped to a `scales` entry because the zoom controls step through that
 * ladder by index.
 */
const getInitialScale = (
  windowWidth = 0,
  windowHeight = 0,
  pageWidth = 0,
  pageHeight = 0
): number => {
  const availableWidth = windowWidth - CANVAS_MARGIN_PX * 2;
  const availableHeight = windowHeight - CANVAS_MARGIN_PX * 2;

  if (
    availableWidth <= 0 ||
    availableHeight <= 0 ||
    pageWidth <= 0 ||
    pageHeight <= 0
  ) {
    return 1;
  }

  const containScale = Math.min(
    availableWidth / pageWidth,
    availableHeight / pageHeight
  );
  let fittedScale = scales[0];

  for (const scale of scales) {
    if (scale > containScale) break;

    fittedScale = scale;
  }

  return fittedScale;
};

const usePDF = (
  id: string,
  containerRef: RefObject<HTMLDivElement | null>
): HTMLDivElement[] => {
  const { readFile } = useFileSystem();
  const {
    argument,
    processes: { [id]: process } = {},
    url: setUrl,
  } = useProcesses();
  const { libs = [], scale, url: processUrl } = process || {};
  const [pages, setPages] = useState<HTMLDivElement[]>([]);
  const pdfWorker = useRef<PDFWorker | null>(null);
  const renderPage = useCallback(
    async (
      pageNumber: number,
      doc: PDFDocumentProxy
    ): Promise<HTMLDivElement> => {
      const { pdfjsLib } = window;

      if (!pdfjsLib) throw new Error("PDF.js is not loaded.");

      const canvas = document.createElement("canvas");
      const canvasContext = canvas.getContext(
        "2d",
        BASE_2D_CONTEXT_OPTIONS
      ) as CanvasRenderingContext2D;
      const page = await doc.getPage(pageNumber);
      let viewport: PdfjsLib.PageViewport;

      if (scale) {
        viewport = page.getViewport({ scale });
      } else {
        const baseViewport = page.getViewport({ scale: 1 });
        const initialScale = getInitialScale(
          containerRef.current?.clientWidth,
          containerRef.current?.clientHeight,
          baseViewport.width,
          baseViewport.height
        );

        argument(id, "scale", initialScale);

        viewport = page.getViewport({ scale: initialScale });
      }

      // Render at device resolution, then size down in CSS, so the page is
      // sharp on high-DPI screens instead of an upscaled bitmap.
      const pixelRatio = window.devicePixelRatio || 1;

      canvas.height = Math.floor(viewport.height * pixelRatio);
      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.style.height = `${viewport.height}px`;
      canvas.style.width = `${viewport.width}px`;

      await page.render({
        canvas,
        canvasContext,
        transform:
          pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0],
        viewport,
      }).promise;

      const container = document.createElement("div");

      container.className = "page";
      container.style.height = `${viewport.height}px`;
      container.style.width = `${viewport.width}px`;
      container.append(canvas);

      // The PDF's own text, positioned over the canvas, so it can be selected,
      // copied and searched rather than only looked at.
      const textLayer = document.createElement("div");

      textLayer.className = "textLayer";
      // pdf.js positions the spans in scaled units and reads this back out of
      // CSS; without it every glyph lands in the wrong place.
      textLayer.style.setProperty("--scale-factor", `${viewport.scale}`);
      container.append(textLayer);

      await pdfjsLib.renderTextLayer({
        container: textLayer,
        textContentSource: await page.getTextContent(),
        viewport,
      }).promise;

      // Link annotations, above the text layer so clicks reach them. Without
      // this the PDF's hyperlinks are dead.
      const annotationLayer = document.createElement("div");

      annotationLayer.className = "annotationLayer";
      annotationLayer.style.setProperty("--scale-factor", `${viewport.scale}`);
      container.append(annotationLayer);

      // The vendored build types this loosely; name the shape at the boundary
      // so the layer call stays type-checked.
      const annotations = (await page.getAnnotations()) as PdfAnnotation[];

      await new pdfjsLib.AnnotationLayer({
        div: annotationLayer,
        page,
        viewport: viewport.clone({ dontFlip: true }),
      }).render({
        annotations,
        linkService,
        renderForms: false,
      });

      return container;
    },
    [argument, containerRef, id, scale]
  );
  const { prependFileToTitle } = useTitle(id);
  const currentUrlRef = useRef("");
  const renderingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const resetApp = useCallback(() => {
    abortControllerRef.current?.abort();
    pdfWorker.current?.destroy();

    argument(id, "rendering", false);
    renderingRef.current = false;

    if (containerRef.current) {
      // eslint-disable-next-line no-param-reassign
      containerRef.current.scrollTop = 0;
    }
  }, [argument, containerRef, id]);
  const renderPages = useCallback(
    async (url: string): Promise<void> => {
      if (containerRef.current) {
        setPages([]);

        if (url) {
          containerRef.current.classList.remove("drop");

          if (window.pdfjsLib && !renderingRef.current) {
            renderingRef.current = true;
            argument(id, "rendering", true);

            // eslint-disable-next-line no-param-reassign
            containerRef.current.scrollTop = 0;

            const fileData = await readFile(url);

            if (fileData.length === 0) throw new Error("File is empty");

            const loader = window.pdfjsLib.getDocument(fileData);
            const doc = await loader.promise;
            const { info } = await doc.getMetadata();

            pdfWorker.current = (
              loader as unknown as { _worker: PDFWorker }
            )._worker;

            const { Title } = info as MetadataInfo;

            argument(id, "subTitle", Title);
            argument(id, "count", doc.numPages);
            prependFileToTitle(Title || basename(url));

            abortControllerRef.current = new AbortController();

            for (let i = 0; i < doc.numPages; i += 1) {
              if (
                abortControllerRef.current.signal.aborted ||
                url !== currentUrlRef.current
              ) {
                break;
              }

              // eslint-disable-next-line no-await-in-loop
              const page = await renderPage(i + 1, doc);

              if (
                abortControllerRef.current.signal.aborted ||
                url !== currentUrlRef.current
              ) {
                break;
              }

              setPages((currentPages) => [...currentPages, page]);
            }

            argument(id, "rendering", false);
            renderingRef.current = false;
          }
        } else {
          containerRef.current.classList.add("drop");
          argument(id, "subTitle", "");
          argument(id, "count", 0);
          prependFileToTitle("");
        }
      }
    },
    [argument, containerRef, id, prependFileToTitle, readFile, renderPage]
  );

  useEffect(() => {
    loadFiles(libs).then(() => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "/Program Files/PDF.js/pdf.worker.js";

        if (processUrl) {
          renderPages(processUrl).catch(() => {
            setUrl(id, "");
            argument(id, "rendering", false);
            renderingRef.current = false;
          });
        }
      }
    });
  }, [argument, id, libs, processUrl, renderPages, setUrl]);

  useEffect(() => resetApp, [resetApp]);

  useEffect(() => {
    if (processUrl && currentUrlRef.current !== processUrl) {
      currentUrlRef.current = processUrl;
      resetApp();
    }
  }, [resetApp, processUrl]);

  return pages;
};

export default usePDF;
