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
// has loaded — PDFs go into an iframe, images are shown directly.
export function openPrintWindow(blob, title) {
  const url = URL.createObjectURL(blob);
  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    URL.revokeObjectURL(url);
    throw new Error("Popup blocked. Please allow popups for printing.");
  }

  const isPDF = blob.type === "application/pdf";

  if (isPDF) {
    // Printing via the outer window prints the HTML page the iframe sits in
    // (scaled to whatever CSS size the iframe has), which is what fragments
    // a single-page PDF across multiple sheets. Calling print() on the
    // iframe's own contentWindow hands off to the PDF viewer's native print
    // path instead — the same one its own toolbar print button uses — which
    // knows the PDF's real page size.
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print - ${title}</title>
          <style>
            @page { margin: 0; }
            html, body { margin: 0; padding: 0; height: 100%; }
            iframe { width: 100vw; height: 100vh; border: none; display: block; }
          </style>
        </head>
        <body>
          <iframe id="pdfFrame" src="${url}"></iframe>
          <script>
            var frame = document.getElementById('pdfFrame');
            frame.addEventListener('load', function () {
              setTimeout(function () {
                try {
                  frame.contentWindow.focus();
                  frame.contentWindow.print();
                } catch (e) {
                  window.print();
                }
              }, 500);
            });
          </script>
        </body>
      </html>
    `);
  } else {
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
  }

  printWindow.document.close();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 10000);
}
