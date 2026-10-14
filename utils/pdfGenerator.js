

// utils/pdfGenerator.js
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Helper function to capture section and add to PDF
async function captureAndAddToPage(section, pdf, pageWidth, pageHeight, pageIndex) {
  const canvas = await html2canvas(section, {
    scale: 2,
    useCORS: true,
    logging: false,
    allowTaint: true,
    scrollY: -window.scrollY,
  });

  const imgWidth = pageWidth - 20;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  const imgData = canvas.toDataURL("image/png");
  pdf.addImage(
    imgData,
    "PNG",
    10,
    10,
    imgWidth,
    Math.min(imgHeight, pageHeight - 20)
  );

  pdf.setFontSize(10);
  pdf.setTextColor(150);
  pdf.text(`Page ${pageIndex + 1}`, pageWidth - 20, pageHeight - 10);
}

export const generatePDF = async (
  elementId = "content-to-print",
  filename = "download.pdf"
) => {
  try {
    const contentElement = document.getElementById(elementId);
    const sections = contentElement.querySelectorAll(".pdf-section");

    if (!sections.length) throw new Error("No printable sections found");

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const wasHidden = section.classList.contains("d-none");

      try {
        // Force visible for PDF
        if (wasHidden) {
          section.classList.remove("d-none");
          section.style.display = "block";
        }

        if (i > 0) pdf.addPage();
        await captureAndAddToPage(section, pdf, pageWidth, pageHeight, i);
      } finally {
        // Hide again after PDF generation
        if (wasHidden) {
          section.classList.add("d-none");
          section.style.display = ""; // Reset style
        }
      }
    }

    pdf.save(filename);
    return true;
  } catch (error) {
    console.error("PDF generation failed:", error);
    return false;
  }
};

// export const generatePDF = async (
//   elementId = "content-to-print",
//   filename = "download.pdf"
// ) => {
//   try {
//     const contentElement = document.getElementById(elementId);
//     const sections = contentElement.querySelectorAll(".pdf-section");

//     if (!sections.length) throw new Error("No printable sections found");

//     const pdf = new jsPDF({
//       orientation: "landscape",
//       unit: "mm",
//       format: "a4",
//     });

//     const pageWidth = pdf.internal.pageSize.getWidth();
//     const pageHeight = pdf.internal.pageSize.getHeight();

//     for (let i = 0; i < sections.length; i++) {
//       const section = sections[i];
//       const wasHidden = section.classList.contains("d-none");

//       try {
//         if (wasHidden) section.classList.remove("d-none");

//         const largeTable = section.querySelector(".large-table-container");

//         if (i > 0) {
//           pdf.addPage();
//         }

//         if (largeTable) {
//           const tableHeight = largeTable.scrollHeight;
//           const pageContentHeight = pageHeight - 20;
//           const pagesNeeded = Math.ceil(tableHeight / pageContentHeight);

//           if (pagesNeeded > 1) {
//             const sectionClone = section.cloneNode(true);

//             for (let pageNum = 0; pageNum < pagesNeeded; pageNum++) {
//               if (pageNum > 0) pdf.addPage();

//               const startY = pageNum * pageContentHeight;
//               const endY = Math.min((pageNum + 1) * pageContentHeight, tableHeight);

//               const cloneTable = sectionClone.querySelector(".large-table-container");
//               if (cloneTable) {
//                 cloneTable.scrollTop = startY;

//                 const canvas = await html2canvas(sectionClone, {
//                   scale: 2,
//                   useCORS: true,
//                   logging: false,
//                   allowTaint: true,
//                   scrollY: -window.scrollY,
//                   height: Math.min(endY - startY, pageContentHeight),
//                 });

//                 const imgData = canvas.toDataURL("image/png");
//                 pdf.addImage(
//                   imgData,
//                   "PNG",
//                   10,
//                   10,
//                   pageWidth - 20,
//                   Math.min((canvas.height * (pageWidth - 20)) / canvas.width, pageHeight - 20)
//                 );

//                 pdf.setFontSize(10);
//                 pdf.setTextColor(150);
//                 pdf.text(`Page ${i + 1} - ${pageNum + 1}`, pageWidth - 40, pageHeight - 10);
//               }
//             }
//           } else {
//             await captureAndAddToPage(section, pdf, pageWidth, pageHeight, i);
//           }
//         } else {
//           await captureAndAddToPage(section, pdf, pageWidth, pageHeight, i);
//         }
//       } finally {
//         if (wasHidden) section.classList.add("d-none");
//       }
//     }

//     pdf.save(filename);
//     return true;
//   } catch (error) {
//     console.error("PDF generation failed:", error);
//     return false;
//   }
// };

export const handlePrintPDF = () => {
  const customerName =
    document.querySelector(".customer-name")?.textContent || "Customer";
  const filename = `${customerName.replace(/[^a-zA-Z0-9]/g, "_")}_Report.pdf`;

  const printBtn = document.getElementById("print-pdf-btn");
  if (!printBtn) {
    console.error("Print button not found");
    return;
  }

  const originalText = printBtn.innerHTML;
  printBtn.innerHTML =
    '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Generating PDF...';
  printBtn.disabled = true;

  setTimeout(async () => {
    const success = await generatePDF("content-to-print", filename);

    // Always clean up: hide any .d-print-block sections again
    document
      .querySelectorAll(".pdf-section.d-print-block")
      .forEach((el) => el.classList.add("d-none"));

    printBtn.innerHTML = originalText;
    printBtn.disabled = false;

    if (!success) {
      alert("Failed to generate PDF. Please try again.");
    } else {
      console.log("PDF generated successfully!");
    }
  }, 100);
};
