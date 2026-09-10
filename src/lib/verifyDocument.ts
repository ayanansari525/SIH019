import Tesseract from 'tesseract.js';
import type { VerificationResult, ProcessedImage, DocumentType, ExtractedData, TamperAnalysis } from './types';
import { fileToCanvas, preprocessForOCR } from './preprocessing';
import { pdfToCanvases } from './pdfHandler';
import { performELA, detectEdgeInconsistency, extractMetadata, computeTamperAnalysis } from './tamperDetection';
import { detectDocumentType, parseFields } from './fieldParser';

export type ProgressCallback = (step: string, progress: number) => void;

/**
 * Main verification pipeline:
 * 1. Accept file (PDF, PNG, JPG, JPEG)
 * 2. Convert to canvas
 * 3. Preprocess for OCR
 * 4. Extract text via Tesseract.js
 * 5. Parse key fields
 * 6. Run tamper detection (ELA, edge consistency, metadata)
 * 7. Return structured JSON
 */
export async function verifyDocument(file: File, onProgress?: ProgressCallback): Promise<VerificationResult> {
  const startTime = performance.now();

  try {
    // Step 1: Convert to canvas
    onProgress?.('Converting document to image...', 10);

    let originalCanvas: HTMLCanvasElement;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      const canvases = await pdfToCanvases(file, 2.0);
      if (canvases.length === 0) {
        throw new Error('PDF has no pages');
      }
      originalCanvas = canvases[0];
    } else {
      originalCanvas = await fileToCanvas(file);
    }

    // Step 2: Preprocess for OCR
    onProgress?.('Preprocessing image (grayscale, noise reduction, thresholding)...', 25);
    const processed: ProcessedImage = preprocessForOCR(originalCanvas);

    // Step 3: OCR text extraction
    onProgress?.('Running OCR text extraction...', 40);
    const rawText = await runOCR(processed.canvas, (p) => {
      onProgress?.('Running OCR text extraction...', 40 + p * 0.2);
    });

    // Step 4: Parse fields
    onProgress?.('Parsing key fields from extracted text...', 65);
    const docType: DocumentType = detectDocumentType(rawText);
    const extractedData: ExtractedData = parseFields(rawText, docType);

    // Step 5: Tamper detection — ELA
    onProgress?.('Running Error Level Analysis (ELA)...', 75);
    const { elaScore } = performELA(originalCanvas);

    // Step 6: Tamper detection — Edge consistency
    onProgress?.('Analyzing text edge consistency...', 85);
    const { edgeConsistencyScore } = detectEdgeInconsistency(originalCanvas);

    // Step 7: Metadata extraction
    onProgress?.('Inspecting metadata for editor traces...', 90);
    const { findings: metadataFindings, metadata } = await extractMetadata(file);

    // Step 8: Composite tamper analysis
    const tamperResult = computeTamperAnalysis(elaScore, edgeConsistencyScore, metadataFindings, metadata);
    const tamperAnalysis: TamperAnalysis = {
      is_flagged: tamperResult.is_flagged,
      risk_score_percent: tamperResult.risk_score_percent,
      reasons: tamperResult.reasons,
      ela_score: tamperResult.ela_score,
      edge_consistency_score: tamperResult.edge_consistency_score,
      metadata_findings: tamperResult.metadata_findings,
    };

    const endTime = performance.now();
    const processingTime = Math.round((endTime - startTime) / 10) / 100;

    onProgress?.('Verification complete!', 100);

    return {
      status: 'success',
      document_type: docType,
      extracted_data: extractedData,
      raw_text: rawText,
      tamper_analysis: tamperAnalysis,
      processing_time_sec: processingTime,
      file_name: file.name,
      file_type: file.type || 'unknown',
    };
  } catch (error) {
    const endTime = performance.now();
    const processingTime = Math.round((endTime - startTime) / 10) / 100;

    return {
      status: 'error',
      document_type: 'Unknown',
      extracted_data: { id_number: '', name: '', date: '' },
      raw_text: '',
      tamper_analysis: {
        is_flagged: false,
        risk_score_percent: 0,
        reasons: [error instanceof Error ? error.message : 'Unknown error occurred'],
        ela_score: 0,
        edge_consistency_score: 0,
        metadata_findings: [],
      },
      processing_time_sec: processingTime,
      file_name: file.name,
      file_type: file.type || 'unknown',
    };
  }
}

/**
 * Runs Tesseract.js OCR on a canvas and returns the extracted text.
 */
async function runOCR(
  canvas: HTMLCanvasElement,
  onProgress?: (progress: number) => void
): Promise<string> {
  const result = await Tesseract.recognize(canvas, 'eng', {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(m.progress);
      }
    },
  });

  return result.data.text.trim();
}
