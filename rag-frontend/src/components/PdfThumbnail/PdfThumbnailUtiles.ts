import { getDocument, GlobalWorkerOptions, PDFDocumentProxy } from "pdfjs-dist";
import { GlobalThumbnailOptions } from "../../types/PdfThumbnail";
// import { version } from "pdfjs-dist/package.json";

// ワーカーファイルのパスを設定
GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();
// GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;

export async function getThumbnail(
  url: string,
  pageNumber: number,
  options: GlobalThumbnailOptions = {}
) {
  // PDFファイルを読み込む
  const loadingTask = getDocument(url);
  const pdf: PDFDocumentProxy = await loadingTask.promise;

  // 指定されたページを取得
  const page = await pdf.getPage(pageNumber);
  // オプションに基づいてビューポートを設定
  let scale = 1.0;
  const viewport = page.getViewport({ scale: scale });
  const targetWidth = options.width;
  const targetHeight = options.height;

  if (targetWidth) {
    scale = targetWidth / viewport.width;
  } else if (targetHeight) {
    scale = targetHeight / viewport.height;
  }

  const scaledViewport = page.getViewport({ scale: scale });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  canvas.width = scaledViewport.width;
  canvas.height = scaledViewport.height;

  await page.render({ canvasContext: context!, viewport: scaledViewport })
    .promise;
  const dataUrl = canvas.toDataURL("image/png");
  return dataUrl;
}
