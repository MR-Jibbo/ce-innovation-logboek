// pdfjs-dist ships its type declarations only for its main entry point
// (types/src/pdf.d.ts), not for the deep "build/pdf.mjs" subpath we import
// dynamically in hulpmiddel-lightbox.tsx (needed to get the actual
// browser/canvas build rather than the package's default resolution). This
// gives the renderer's bundler-mode module resolution just enough shape to
// type-check; the real runtime module is unaffected.
declare module "pdfjs-dist/build/pdf.mjs" {
  export const GlobalWorkerOptions: { workerSrc: string };

  export interface PDFPageProxy {
    getViewport(params: { scale: number }): { width: number; height: number };
    render(params: { canvasContext: CanvasRenderingContext2D; viewport: unknown }): { promise: Promise<void> };
  }

  export interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
  }

  export function getDocument(params: {
    data: Uint8Array;
    isEvalSupported?: boolean;
    useSystemFonts?: boolean;
  }): { promise: Promise<PDFDocumentProxy> };
}
