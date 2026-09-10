/**
 * PDF to image conversion using pdfjs-dist.
 * Converts each PDF page to a high-resolution canvas.
 */
import * as pdfjsLib from 'pdfjs-dist';
import type { ProcessedImage } from './types';

// Use the worker bundled with pdfjs-dist
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

/**
 * Converts a PDF file to a list of canvases (one per page).
 * @param file The PDF File object
 * @param scale Render scale (default 2.0 for high resolution)
 */
export async function pdfToCanvases(file: File, scale = 2.0): Promise<HTMLCanvasElement[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const canvases: HTMLCanvasElement[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;

    await page.render({
      canvas,
      canvasContext: ctx,
      viewport,
    } as Parameters<typeof page.render>[0]).promise;

    canvases.push(canvas);
  }

  return canvases;
}

/**
 * Converts the first page of a PDF to a ProcessedImage.
 */
export async function pdfToProcessedImage(file: File, scale = 2.0): Promise<ProcessedImage> {
  const canvases = await pdfToCanvases(file, scale);
  return {
    canvas: canvases[0],
    width: canvases[0].width,
    height: canvases[0].height,
  };
}
