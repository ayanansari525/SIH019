import type { ProcessedImage } from './types';

/**
 * Converts an image File to an HTMLCanvasElement.
 */
export function fileToCanvas(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(img.src);
      resolve(canvas);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Preprocesses a canvas for optimal OCR:
 * 1. Grayscale conversion
 * 2. Noise reduction (Gaussian blur approximation)
 * 3. Adaptive thresholding (Otsu's method)
 */
export function preprocessForOCR(source: HTMLCanvasElement): ProcessedImage {
  const canvas = document.createElement('canvas');
  const maxDim = 2000;
  const scale = Math.min(1, maxDim / Math.max(source.width, source.height));
  canvas.width = Math.round(source.width * scale);
  canvas.height = Math.round(source.height * scale);

  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Step 1: Grayscale
  const gray = new Uint8ClampedArray(canvas.width * canvas.height);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    gray[j] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
  }

  // Step 2: Noise reduction — simple 3x3 box blur
  const blurred = boxBlur(gray, canvas.width, canvas.height);

  // Step 3: Otsu's thresholding
  const threshold = otsuThreshold(blurred);
  const binary = new Uint8ClampedArray(blurred.length);
  for (let i = 0; i < blurred.length; i++) {
    binary[i] = blurred[i] > threshold ? 255 : 0;
  }

  // Write back to canvas
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    data[i] = binary[j];
    data[i + 1] = binary[j];
    data[i + 2] = binary[j];
    data[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);

  return { canvas, width: canvas.width, height: canvas.height };
}

function boxBlur(src: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
  const dst = new Uint8ClampedArray(src.length);
  const radius = 1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            sum += src[ny * width + nx];
            count++;
          }
        }
      }
      dst[y * width + x] = Math.round(sum / count);
    }
  }
  return dst;
}

function otsuThreshold(src: Uint8ClampedArray): number {
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < src.length; i++) {
    histogram[src[i]]++;
  }

  const total = src.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i];
  }

  let sumB = 0;
  let wB = 0;
  let maxVariance = 0;
  let threshold = 127;

  for (let i = 0; i < 256; i++) {
    wB += histogram[i];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;

    sumB += i * histogram[i];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const variance = wB * wF * (mB - mF) * (mB - mF);

    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = i;
    }
  }

  return threshold;
}

/**
 * Computes Laplacian variance of a canvas — used as an edge consistency metric.
 */
export function laplacianVariance(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const w = canvas.width;
  const h = canvas.height;

  // Grayscale
  const gray = new Float32Array(w * h);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    gray[j] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  // Laplacian kernel: [0,1,0; 1,-4,1; 0,1,0]
  const laplacian = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      laplacian[idx] =
        gray[idx - w] +
        gray[idx + w] +
        gray[idx - 1] +
        gray[idx + 1] -
        4 * gray[idx];
    }
  }

  // Variance
  let mean = 0;
  let count = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      mean += laplacian[y * w + x];
      count++;
    }
  }
  mean /= count;

  let variance = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const v = laplacian[y * w + x] - mean;
      variance += v * v;
    }
  }
  variance /= count;

  return variance;
}
