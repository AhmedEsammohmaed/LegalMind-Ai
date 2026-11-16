import { copyFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import mammoth from "mammoth";
import { createWorker, OEM } from "tesseract.js";
import { getDocumentProxy, renderPageAsImage } from "unpdf";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_DOCX_UNCOMPRESSED_BYTES = 40 * 1024 * 1024;
const MAX_DOCX_COMPRESSION_RATIO = 200;
const MAX_PDF_PAGES = 200;
const MAX_EXTRACTED_CHARACTERS = 200_000;
const MAX_OCR_PAGES = 10;
const MAX_OCR_PAGE_PIXELS = 4_500_000;
const OCR_CONFIDENCE_WARNING_THRESHOLD = 70;

type PageTextProvenance = { pageNumber: number; source: "text-layer" | "ocr" | "text-layer+ocr" | "no-text"; ocrConfidence: number | null; ocrSkippedDueToPageLimit: boolean };

type ExtractedContent = {
  text: string;
  pageProvenance: PageTextProvenance[] | null;
  pageCount: number | null;
  truncated: boolean;
  needsOcr: boolean;
  ocrUsed: boolean;
  ocrLanguage: string | null;
  ocrConfidence: number | null;
  ocrLowConfidence: boolean;
  ocrPages: number[];
  ocrPageLimitReached: boolean;
};

function jsonError(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

function isPdf(bytes: Uint8Array) {
  const header = Buffer.from(bytes.subarray(0, Math.min(bytes.length, 1024))).toString("latin1");
  return header.includes("%PDF-");
}

function validateDocxArchive(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const minEocd = Math.max(0, bytes.byteLength - 65_557);
  let eocd = -1;

  for (let offset = bytes.byteLength - 22; offset >= minEocd; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) {
      eocd = offset;
      break;
    }
  }

  if (eocd < 0) return "The Word document is not a valid DOCX archive.";

  const entryCount = view.getUint16(eocd + 10, true);
  const centralDirectorySize = view.getUint32(eocd + 12, true);
  const centralDirectoryOffset = view.getUint32(eocd + 16, true);
  if (entryCount === 0xffff || centralDirectorySize === 0xffffffff || centralDirectoryOffset === 0xffffffff) {
    return "This DOCX archive uses an unsupported ZIP64 format.";
  }
  if (centralDirectoryOffset + centralDirectorySize > eocd || entryCount > 10_000) {
    return "The Word document has an invalid archive directory.";
  }

  let offset = centralDirectoryOffset;
  let totalUncompressed = 0;
  let hasDocumentXml = false;
  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > centralDirectoryOffset + centralDirectorySize || view.getUint32(offset, true) !== 0x02014b50) {
      return "The Word document contains an invalid archive entry.";
    }
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const fileNameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const filenameStart = offset + 46;
    const nextOffset = filenameStart + fileNameLength + extraLength + commentLength;
    if (nextOffset > centralDirectoryOffset + centralDirectorySize) return "The Word document archive is malformed.";
    const filename = Buffer.from(bytes.subarray(filenameStart, filenameStart + fileNameLength)).toString("utf8");

    if (uncompressedSize === 0xffffffff || compressedSize === 0xffffffff) {
      return "This DOCX archive uses an unsupported ZIP64 format.";
    }
    totalUncompressed += uncompressedSize;
    if (totalUncompressed > MAX_DOCX_UNCOMPRESSED_BYTES) {
      return "The expanded Word document is too large to process safely.";
    }
    if (uncompressedSize > 1024 * 1024 && uncompressedSize / Math.max(compressedSize, 1) > MAX_DOCX_COMPRESSION_RATIO) {
      return "The Word document has an unusually high compression ratio and was rejected.";
    }
    if (filename === "word/document.xml") hasDocumentXml = true;
    offset = nextOffset;
  }

  return hasDocumentXml ? null : "The file is not a valid DOCX document.";
}

async function extractPdf(bytes: Uint8Array, ocrLanguage: string): Promise<ExtractedContent> {
  const pdf = await getDocumentProxy(bytes, { maxImageSize: 16_777_216, stopAtErrors: true });
  let worker: Awaited<ReturnType<typeof createWorker>> | undefined;
  let tempLanguageDirectory: string | undefined;
  const confidenceScores: number[] = [];
  const ocrPageNumbers: number[] = [];
  const pageProvenance: PageTextProvenance[] = [];
  try {
    if (pdf.numPages > MAX_PDF_PAGES) {
      throw new Error("This PDF has more than 200 pages. Split it into smaller files and try again.");
    }

    const chunks: string[] = [];
    let characterCount = 0;
    let truncated = false;
    let ocrPageLimitReached = false;
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      chunks.push(`\n[Page ${pageNumber}]\n`);
      let pageTextLength = 0;
      for (const item of content.items) {
        if (!("str" in item)) continue;
        const piece = `${item.str}${item.hasEOL ? "\n" : " "}`;
        pageTextLength = Math.min(20, pageTextLength + item.str.trim().length);
        const remaining = MAX_EXTRACTED_CHARACTERS - characterCount;
        if (remaining <= 0) {
          truncated = true;
          break;
        }
        chunks.push(piece.slice(0, remaining));
        characterCount += Math.min(piece.length, remaining);
        if (piece.length > remaining) truncated = true;
      }

      let pageOcrConfidence: number | null = null;
      let ocrSkippedDueToPageLimit = false;
      let pageSource: PageTextProvenance["source"] = pageTextLength > 0 ? "text-layer" : "no-text";
      if (!truncated && pageTextLength < 20) {
        if (ocrPageNumbers.length >= MAX_OCR_PAGES) {
          ocrPageLimitReached = true;
          ocrSkippedDueToPageLimit = true;
        } else {
          if (!worker) {
            tempLanguageDirectory = await mkdtemp(path.join(tmpdir(), "legalmind-ocr-"));
            for (const language of ocrLanguage.split("+")) {
              const modelDirectory = path.join(process.cwd(), "node_modules", "@tesseract.js-data", language, "4.0.0_best_int");
              await copyFile(
                path.join(modelDirectory, `${language}.traineddata.gz`),
                path.join(tempLanguageDirectory, `${language}.traineddata.gz`),
              );
            }
            worker = await createWorker(ocrLanguage.split("+"), OEM.LSTM_ONLY, {
              langPath: `${tempLanguageDirectory}${path.sep}`,
              cachePath: tempLanguageDirectory,
              cacheMethod: "none",
              gzip: true,
              logger: () => undefined,
            });
          }

          const viewport = page.getViewport({ scale: 1 });
          const scale = Math.min(3, Math.sqrt(MAX_OCR_PAGE_PIXELS / (viewport.width * viewport.height)));
          if (scale < 0.5) throw new Error("A PDF page is too large to OCR safely.");
          const image = await renderPageAsImage(pdf, pageNumber, {
            canvasImport: () => import("@napi-rs/canvas"),
            scale,
            format: "png",
          });
          const result = await worker.recognize(Buffer.from(image));
          const ocrText = result.data.text.trim();
          if (ocrText) {
            chunks.push(`\n${ocrText}\n`);
            characterCount += ocrText.length;
            pageSource = pageTextLength > 0 ? "text-layer+ocr" : "ocr";
          }
          pageOcrConfidence = result.data.confidence;
          confidenceScores.push(result.data.confidence);
          ocrPageNumbers.push(pageNumber);
        }
      }
      pageProvenance.push({ pageNumber, source: pageSource, ocrConfidence: pageOcrConfidence, ocrSkippedDueToPageLimit });
      page.cleanup();
      if (truncated) break;
      chunks.push("\n");
    }
    const text = chunks.join("").trim();
    const averageConfidence = confidenceScores.length
      ? Math.round(confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length)
      : null;
    return {
      text: text.slice(0, MAX_EXTRACTED_CHARACTERS),
      pageProvenance,
      pageCount: pdf.numPages,
      truncated: truncated || characterCount > MAX_EXTRACTED_CHARACTERS,
      needsOcr: text.length === 0,
      ocrUsed: ocrPageNumbers.length > 0,
      ocrLanguage: ocrPageNumbers.length > 0 ? ocrLanguage : null,
      ocrConfidence: averageConfidence,
      ocrLowConfidence: averageConfidence !== null && averageConfidence < OCR_CONFIDENCE_WARNING_THRESHOLD,
      ocrPages: ocrPageNumbers,
      ocrPageLimitReached,
    };
  } finally {
    if (worker) await worker.terminate();
    if (tempLanguageDirectory) await rm(tempLanguageDirectory, { recursive: true, force: true });
    await pdf.cleanup();
  }
}

async function extractDocx(bytes: Uint8Array): Promise<ExtractedContent> {
  const validationError = validateDocxArchive(bytes);
  if (validationError) throw new Error(validationError);

  const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
  const source = result.value.trim();
  const truncated = source.length > MAX_EXTRACTED_CHARACTERS;
  return {
    text: source.slice(0, MAX_EXTRACTED_CHARACTERS),
    pageProvenance: null,
    pageCount: null,
    truncated,
    needsOcr: source.length === 0,
    ocrUsed: false,
    ocrLanguage: null,
    ocrConfidence: null,
    ocrLowConfidence: false,
    ocrPages: [],
    ocrPageLimitReached: false,
  };
}

export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_FILE_BYTES + 64 * 1024) {
    return jsonError(413, "FILE_TOO_LARGE", "Files must be 20 MB or smaller.");
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError(400, "INVALID_MULTIPART", "Send a multipart form with one PDF or DOCX file.");
  }

  const file = formData.get("file");
  if (!(file instanceof File)) return jsonError(400, "FILE_REQUIRED", "Choose a PDF or DOCX file first.");
  if (file.size === 0) return jsonError(400, "EMPTY_FILE", "The selected file is empty.");
  if (file.size > MAX_FILE_BYTES) return jsonError(413, "FILE_TOO_LARGE", "Files must be 20 MB or smaller.");

  const extension = file.name.toLowerCase().split(".").pop();
  if (extension !== "pdf" && extension !== "docx") {
    return jsonError(415, "UNSUPPORTED_TYPE", "Only PDF and DOCX files are supported. Legacy .doc files are not supported.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (extension === "pdf" && !isPdf(bytes)) return jsonError(415, "INVALID_PDF", "The file does not have a valid PDF signature.");
  if (extension === "docx" && (bytes[0] !== 0x50 || bytes[1] !== 0x4b)) {
    return jsonError(415, "INVALID_DOCX", "The file does not have a valid DOCX archive signature.");
  }

  try {
    const requestedLanguage = formData.get("ocrLanguage");
    const allowedLanguages = new Set(["ara", "eng", "ara+eng"]);
    if (requestedLanguage !== null && (typeof requestedLanguage !== "string" || !allowedLanguages.has(requestedLanguage))) {
      return jsonError(400, "INVALID_OCR_LANGUAGE", "Choose Arabic, English, or Arabic and English for scanned pages.");
    }
    const ocrLanguage = typeof requestedLanguage === "string" && allowedLanguages.has(requestedLanguage)
      ? requestedLanguage
      : "ara+eng";
    const extracted = extension === "pdf" ? await extractPdf(bytes, ocrLanguage) : await extractDocx(bytes);
    return Response.json({
      fileName: file.name,
      fileType: extension === "pdf" ? "PDF" : "DOCX",
      ...extracted,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The document could not be processed.";
    if (message.includes("more than 200 pages")) return jsonError(413, "TOO_MANY_PAGES", message);
    if (/docx|Word document|ZIP64|archive/i.test(message)) return jsonError(422, "INVALID_DOCX", message);
    return jsonError(422, "EXTRACTION_FAILED", "We could not read this document. It may be damaged, password-protected, or use unsupported features.");
  }
}
