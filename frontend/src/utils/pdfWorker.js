// Keep webpack's worker asset resolution separate from UI logic and Jest's CJS runtime.
export const getPdfWorkerUrl = () => new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
