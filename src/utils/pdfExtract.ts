// PDF worker is bundled by Vite (?url turns it into a static asset URL)
// @ts-ignore — Vite-specific import
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

export const MAX_PDF_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_PDF_TEXT_LENGTH = 200_000;

export async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  (pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => (typeof item.str === 'string' ? item.str : ''))
      .join(' ');
    fullText += pageText + '\n';
    if (fullText.length > MAX_PDF_TEXT_LENGTH) break;
  }
  return fullText.slice(0, MAX_PDF_TEXT_LENGTH).trim();
}
