// utils/printBlob.js
import { PDFDocument } from "pdf-lib";

// Merge multiple PDF blobs (e.g. one COA/MSDS per line item) into a single PDF.
export async function mergePdfBlobs(blobs) {
  const mergedPdf = await PDFDocument.create();
  for (const blob of blobs) {
    const bytes = await blob.arrayBuffer();
    const pdf = await PDFDocument.load(bytes);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((page) => mergedPdf.addPage(page));
  }
  const mergedBytes = await mergedPdf.save();
  return new Blob([mergedBytes], { type: "application/pdf" });
}

// Combine multiple PNG image blobs (e.g. one QR code per line item) into a
// single PDF, one image per page, so they print as one job.
export async function imagesToPdfBlob(imageBlobs) {
  const pdfDoc = await PDFDocument.create();
  for (const blob of imageBlobs) {
    const bytes = await blob.arrayBuffer();
    const img = await pdfDoc.embedPng(bytes);
    const page = pdfDoc.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }
  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: "application/pdf" });
}

// Opens a blob in a new window and triggers the browser print dialog once it
// has loaded — PDFs are navigated to directly (their whole window IS the PDF,
// handled by the browser's native PDF viewer), images are shown in a small
// wrapper page.
export function openPrintWindow(blob, title) {
  const url = URL.createObjectURL(blob);
  const isPDF = blob.type === "application/pdf";

  if (isPDF) {
    // Navigating the new window straight to the PDF blob (instead of
    // wrapping it in an HTML page with an <iframe>) means the window's whole
    // document IS the PDF, rendered by the browser's native PDF viewer.
    // window.print() on that window then goes through the PDF viewer's own
    // print path — the same one its toolbar print button uses — which never
    // adds the browser's page-print header/footer (title/URL/date/page
    // count), because that's an HTML-page print feature, not something the
    // native PDF viewer does. The previous iframe-based approach tried to
    // reach this same path via frame.contentWindow.print(), but that call
    // was unreliable and silently fell back to printing the wrapper page
    // itself — which is exactly the title/about:blank header/footer that
    // was showing up.
    const printWindow = window.open(url, "_blank");
    if (!printWindow) {
      URL.revokeObjectURL(url);
      throw new Error("Popup blocked. Please allow popups for printing.");
    }
    const triggerPrint = () => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch (e) {
        // ignore — best-effort, user can still print manually from the tab
      }
    };
    // 'load' fires once the PDF viewer has rendered; a fallback timer covers
    // cases where it doesn't fire reliably for a PDF document.
    printWindow.addEventListener("load", () => setTimeout(triggerPrint, 400));
    setTimeout(triggerPrint, 1500);
  } else {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      URL.revokeObjectURL(url);
      throw new Error("Popup blocked. Please allow popups for printing.");
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print - ${title}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: white;
            }
            img { max-width: 100%; max-height: 100%; object-fit: contain; }
            @media print {
              body { padding: 0; }
              img { max-width: 100%; height: auto; }
            }
          </style>
        </head>
        <body>
          <img src="${url}" onload="setTimeout(() => window.print(), 500);" alt="Print Document" />
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 10000);
}
