
import React, { useState } from 'react';
import { Download, Loader, AlertCircle, Printer } from 'lucide-react';
import msdsMap from 'public/data/msds-map.json';

const COMPANY_ADDRESS = {
  name: 'Density Pharmachem Private Limited',
  lines: [
    'Survey number 615/A & 624/2/1 Pudur Village,',
    'Medchal mandal, Medchal-Malkajgiri District,',
    'Hyderabad, Telangana, India, 501401',
  ],
  website: 'www.densitypharmachem.com',
  email: 'sales@densitypharmachem.com',
};

// Which COA source each COA card resolves against — mirrors the CoaSource
// logic already used on the product detail page / header invoices:
// ENERGY = foreign vendor batch, hosted on the Aliyun COA_FOREIGN bucket ("3A")
// LOCAL  = our own SAP attachment (OIBT.U_COA / its "-SPEC" fallback) ("Density")
const COA_SOURCE_BY_CARD = {
  '3A COA': 'ENERGY',
  'Density COA': 'LOCAL',
};

const VerticalCards = () => {
  const [inputs, setInputs] = useState({
    'Invoice': { invoiceno: '' },
    '3A COA': { itemcode: '', packsize: '', batchnum: '' },
    'Density COA': { itemcode: '', packsize: '', batchnum: '' },
    '3A Label': { itemcode: '', packsize: '', batchnum: '' },
    'Density Label': { itemcode: '', packsize: '', batchnum: '' },
    'QR': { itemcode: '', packsize: '', batchnum: '' },
  });

  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});
  const [suggestions, setSuggestions] = useState({});
  const [showSuggestions, setShowSuggestions] = useState({});
  const [packSizes, setPackSizes] = useState({});
  const [batchNums, setBatchNums] = useState({});
  // Only populated for the two COA cards: cardTitle -> { [batchNum]: localCOAFilename }
  const [coaFileLookup, setCoaFileLookup] = useState({});

  const cards = [
    { id: 1, title: 'Invoice', icon: '🧾', inputs: ['invoiceno'] },
    { id: 2, title: '3A COA', icon: '📑', inputs: ['itemcode', 'packsize', 'batchnum'] },
    { id: 3, title: 'Density COA', icon: '📃', inputs: ['itemcode', 'packsize', 'batchnum'] },
    { id: 4, title: '3A Label', icon: '🏷️', inputs: ['itemcode', 'packsize', 'batchnum'] },
    { id: 5, title: 'Density Label', icon: '📊', inputs: ['itemcode', 'packsize', 'batchnum'] },
    { id: 6, title: 'QR', icon: '🔲', inputs: ['itemcode', 'packsize', 'batchnum'] },
  ];

  // 🔹 Handle typing
  const handleInputChange = async (cardTitle, inputType, value) => {
    setInputs(prev => ({
      ...prev,
      [cardTitle]: { ...prev[cardTitle], [inputType]: value.toUpperCase() }
    }));

    if (errors[cardTitle]) {
      setErrors(prev => ({ ...prev, [cardTitle]: null }));
    }

    if (inputType === 'itemcode' && value.length >= 2) {
      try {
        const res = await fetch(`/api/density-labels/suggestions/${value.toUpperCase()}`);
        const data = await res.json();
        if (data.suggestions?.length > 0) {
          setSuggestions(prev => ({ ...prev, [cardTitle]: data.suggestions }));
          setShowSuggestions(prev => ({ ...prev, [cardTitle]: true }));
        } else {
          setShowSuggestions(prev => ({ ...prev, [cardTitle]: false }));
        }
      } catch (err) {
        console.error('Suggestions fetch error:', err);
      }
    } else if (inputType === 'itemcode') {
      setShowSuggestions(prev => ({ ...prev, [cardTitle]: false }));
    }
  };

  // 🔹 Once a pack size is picked, fetch the lot numbers available for it.
  // COA cards look up COA-specific batch info (filtered to their source);
  // everything else keeps the existing vendor-batch-number lookup.
  const handlePackSizeSelect = async (cardTitle, selectedPackSize, selectedObj) => {
    setInputs((prev) => ({
      ...prev,
      [cardTitle]: {
        ...prev[cardTitle],
        packsize: selectedPackSize,
        catSizeMain: selectedObj?.Cat_size_main || '',
        batchnum: '',
      },
    }));

    setBatchNums(prev => ({ ...prev, [cardTitle]: [] }));
    setCoaFileLookup(prev => ({ ...prev, [cardTitle]: {} }));

    if (!selectedObj?.Cat_size_main) return;

    const coaSource = COA_SOURCE_BY_CARD[cardTitle];

    try {
      if (coaSource) {
        // 3A COA / Density COA — look up batches for this exact COA source
        const res = await fetch(`/api/coa/lookup/${encodeURIComponent(selectedObj.Cat_size_main)}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        const rows = (data.batches || []).filter((b) => b.CoaSource === coaSource);

        const lotField = coaSource === 'ENERGY' ? 'VendorBatchNum' : 'BatchNum';
        const options = rows
          .map((b) => b[lotField])
          .filter((v) => v && v.trim() !== '');

        const fileMap = {};
        if (coaSource === 'LOCAL') {
          rows.forEach((b) => {
            if (b.BatchNum) fileMap[b.BatchNum] = b.LocalCOAFilename;
          });
        }

        setBatchNums((prev) => ({
          ...prev,
          [cardTitle]: options.map((v) => ({ batchNum: v })),
        }));
        setCoaFileLookup((prev) => ({ ...prev, [cardTitle]: fileMap }));
      } else {
        // 3A Label / Density Label / QR — unchanged vendor-batch-number lookup
        const res = await fetch(
          `/api/density-labels/batchnums/${encodeURIComponent(selectedObj.Cat_size_main)}`
        );
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setBatchNums((prev) => ({ ...prev, [cardTitle]: data.batchNums || [] }));
      }
    } catch (err) {
      console.error('BatchNum fetch error:', err);
      setBatchNums((prev) => ({ ...prev, [cardTitle]: [] }));
    }
  };

  // 🔹 Validation
  const validateInputs = (cardTitle, cardInputs) => {
    const cardData = inputs[cardTitle];
    const missingFields = cardInputs.filter(inputType => !cardData[inputType]?.trim());
    if (missingFields.length > 0) {
      const fieldLabels = missingFields.map(field => getInputLabel(field));
      return `Please fill in: ${fieldLabels.join(', ')}`;
    }
    return null;
  };

  // 🔹 Handle download
  const handleDownload = async (cardTitle) => {
    const card = cards.find(c => c.title === cardTitle);
    if (!card) return;

    const validationError = validateInputs(cardTitle, card.inputs);
    if (validationError) {
      setErrors(prev => ({ ...prev, [cardTitle]: validationError }));
      return;
    }

    setLoading(prev => ({ ...prev, [cardTitle]: true }));
    setErrors(prev => ({ ...prev, [cardTitle]: null }));

    try {
      await downloadFile(card, inputs[cardTitle]);
    } catch (error) {
      console.error(`Download error for ${cardTitle}:`, error);
      setErrors(prev => ({ ...prev, [cardTitle]: error.message || 'Download failed. Please try again.' }));
    } finally {
      setLoading(prev => ({ ...prev, [cardTitle]: false }));
    }
  };

  // 🔹 Handle print
  const handlePrint = async (cardTitle) => {
    const card = cards.find(c => c.title === cardTitle);
    if (!card) return;

    const validationError = validateInputs(cardTitle, card.inputs);
    if (validationError) {
      setErrors(prev => ({ ...prev, [cardTitle]: validationError }));
      return;
    }

    setLoading(prev => ({ ...prev, [cardTitle]: true }));
    setErrors(prev => ({ ...prev, [cardTitle]: null }));

    try {
      await printFile(card, inputs[cardTitle]);
    } catch (error) {
      console.error(`Print error for ${cardTitle}:`, error);
      setErrors(prev => ({ ...prev, [cardTitle]: error.message || 'Print failed. Please try again.' }));
    } finally {
      setLoading(prev => ({ ...prev, [cardTitle]: false }));
    }
  };

  // 🔹 Router for printing
  const printFile = async (card, cardInputs) => {
    switch (card.title) {
      case '3A Label': return print3ALabel(cardInputs);
      case 'Density Label': return printDensityLabel(cardInputs);
      case 'QR': return printQRCode(cardInputs);
      case 'Invoice': return printInvoice(cardInputs);
      case '3A COA': return print3ACOA(cardInputs);
      case 'Density COA': return printDensityCOA(cardInputs);
      default: throw new Error('Unknown card type');
    }
  };

  // 🔹 Router
  const downloadFile = async (card, cardInputs) => {
    switch (card.title) {
      case '3A Label': return download3ALabel(cardInputs);
      case 'Density Label': return downloadDensityLabel(cardInputs);
      case 'QR': return downloadQRCode(cardInputs);
      case 'Invoice': return downloadInvoice(cardInputs);
      case '3A COA': return download3ACOA(cardInputs);
      case 'Density COA': return downloadDensityCOA(cardInputs);
      default: throw new Error('Unknown card type');
    }
  };

  const buildCodeWithPacksize = (itemcode, packsize) => {
    if (!itemcode) return '';
    return packsize ? `${itemcode}-${packsize}` : itemcode;
  };

  // ── COA fetch helpers (shared by download/print) ──────────────────────────
  const fetch3ACOABlob = async ({ itemcode, packsize, batchnum }) => {
    const combinedCode = buildCodeWithPacksize(itemcode, packsize);
    if (!batchnum) throw new Error('Lot number is required for 3A COA');

    const res = await fetch(
      `/api/coa/download-energy/${encodeURIComponent(combinedCode)}/${encodeURIComponent(batchnum)}`
    );
    if (!res.ok) throw new Error('3A COA not found for this item/lot');
    return { blob: await res.blob(), combinedCode };
  };

  const fetchDensityCOABlob = async ({ itemcode, packsize, batchnum }) => {
    const combinedCode = buildCodeWithPacksize(itemcode, packsize);
    if (!batchnum) throw new Error('Lot number is required for Density COA');

    const filename = coaFileLookup['Density COA']?.[batchnum];
    if (!filename) throw new Error('COA file not found for this lot number');

    let cleanName = filename;
    if (cleanName.includes('\\')) cleanName = cleanName.split('\\').pop();
    if (cleanName.includes('/')) cleanName = cleanName.split('/').pop();

    const res = await fetch(`/api/coa/download/${encodeURIComponent(cleanName)}`);
    if (!res.ok) throw new Error('Density COA not available');
    return { blob: await res.blob(), combinedCode };
  };

  const download3ALabel = async ({ itemcode, packsize, batchnum }) => {
    const combinedCode = buildCodeWithPacksize(itemcode, packsize);
    const params = new URLSearchParams();
    if (batchnum) params.append('batchNum', batchnum);

    const res = await fetch(`/api/labels/download/${encodeURIComponent(combinedCode)}?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to download 3A Label");

    const blob = await res.blob();
    triggerDownload(blob, `3A_Label_${combinedCode}_${batchnum}.png`);
  };

  const downloadDensityLabel = async ({ itemcode, packsize, batchnum }) => {
    const combinedCode = buildCodeWithPacksize(itemcode, packsize);
    const res = await fetch(`/api/density-labels/download/${encodeURIComponent(combinedCode)}${batchnum ? `?batchNum=${encodeURIComponent(batchnum)}` : ''}`);
    if (!res.ok) throw new Error("Failed to download Density Label");

    const blob = await res.blob();
    triggerDownload(blob, `Density_Label_${combinedCode}_${batchnum}.png`);
  };

  const downloadQRCode = async ({ itemcode, packsize, batchnum }) => {
    const combinedCode = buildCodeWithPacksize(itemcode, packsize);
    const batch = batchnum?.trim();
    if (!batch) throw new Error('Batch number is required for QR');

    const code = combinedCode.includes("-") ? combinedCode.split("-")[0] : combinedCode;
    const energyUrl = `https://energy01.oss-cn-shanghai.aliyuncs.com/upload/COA_FOREIGN/${code}_${batch}.pdf`;

    const QRCode = await import('qrcode');
    const qrDataURL = await QRCode.toDataURL(energyUrl, { width: 300, margin: 2 });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const qrImage = new Image();

    return new Promise((resolve, reject) => {
      qrImage.onload = () => {
        const qrSize = qrImage.width;
        const textHeight = 80;
        const padding = 20;

        canvas.width = qrSize + (padding * 2);
        canvas.height = qrSize + textHeight + (padding * 2);

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(qrImage, padding, padding, qrSize, qrSize);

        ctx.fillStyle = 'black';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`CAT ${combinedCode}`, padding + 10, qrSize + padding + 25);
        ctx.fillText(`LOT ${batch}`, padding + 10, qrSize + padding + 50);

        canvas.toBlob((blob) => {
          triggerDownload(blob, `QR_${combinedCode}_${batch}.png`);
          resolve();
        });
      };
      qrImage.onerror = reject;
      qrImage.src = qrDataURL;
    });
  };

  const downloadInvoice = async ({ invoiceno }) => {
    const res = await fetch(`/api/invoices/download-pdf/${encodeURIComponent(invoiceno)}`);
    if (!res.ok) throw new Error("Failed to download Invoice");

    const blob = await res.blob();
    triggerDownload(blob, `Invoice_${invoiceno}.pdf`);
  };

  const download3ACOA = async (cardInputs) => {
    const { blob, combinedCode } = await fetch3ACOABlob(cardInputs);
    triggerDownload(blob, `3A_COA_${combinedCode}_${cardInputs.batchnum}.pdf`);
  };

  const downloadDensityCOA = async (cardInputs) => {
    const { blob, combinedCode } = await fetchDensityCOABlob(cardInputs);
    triggerDownload(blob, `Density_COA_${combinedCode}_${cardInputs.batchnum}.pdf`);
  };

  // 🔹 Print functions
  const print3ALabel = async ({ itemcode, packsize, batchnum }) => {
    const combinedCode = buildCodeWithPacksize(itemcode, packsize);
    const params = new URLSearchParams();
    if (batchnum) params.append('batchNum', batchnum);

    const res = await fetch(`/api/labels/download/${encodeURIComponent(combinedCode)}?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to load 3A Label for printing");

    const blob = await res.blob();
    openPrintWindow(blob, `3A_Label_${combinedCode}_${batchnum}`);
  };

  const printDensityLabel = async ({ itemcode, packsize, batchnum }) => {
    const combinedCode = buildCodeWithPacksize(itemcode, packsize);
    const res = await fetch(`/api/density-labels/download/${encodeURIComponent(combinedCode)}${batchnum ? `?batchNum=${encodeURIComponent(batchnum)}` : ''}`);
    if (!res.ok) throw new Error("Failed to load Density Label for printing");

    const blob = await res.blob();
    openPrintWindow(blob, `Density_Label_${combinedCode}_${batchnum}`);
  };

  const printQRCode = async ({ itemcode, packsize, batchnum }) => {
    const combinedCode = buildCodeWithPacksize(itemcode, packsize);
    const batch = batchnum?.trim();
    if (!batch) throw new Error('Batch number is required for QR');

    const code = combinedCode.includes("-") ? combinedCode.split("-")[0] : combinedCode;
    const energyUrl = `https://energy01.oss-cn-shanghai.aliyuncs.com/upload/COA_FOREIGN/${code}_${batch}.pdf`;

    const QRCode = await import('qrcode');
    const qrDataURL = await QRCode.toDataURL(energyUrl, { width: 300, margin: 2 });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const qrImage = new Image();

    return new Promise((resolve, reject) => {
      qrImage.onload = () => {
        const qrSize = qrImage.width;
        const textHeight = 80;
        const padding = 20;

        canvas.width = qrSize + (padding * 2);
        canvas.height = qrSize + textHeight + (padding * 2);

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(qrImage, padding, padding, qrSize, qrSize);

        ctx.fillStyle = 'black';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`CAT ${combinedCode}`, padding + 10, qrSize + padding + 25);
        ctx.fillText(`LOT ${batch}`, padding + 10, qrSize + padding + 50);

        canvas.toBlob((blob) => {
          openPrintWindow(blob, `QR_${combinedCode}_${batch}`);
          resolve();
        });
      };
      qrImage.onerror = reject;
      qrImage.src = qrDataURL;
    });
  };

  const printInvoice = async ({ invoiceno }) => {
    const res = await fetch(`/api/invoices/download-pdf/${encodeURIComponent(invoiceno)}`);
    if (!res.ok) throw new Error("Failed to load Invoice for printing");

    const blob = await res.blob();
    openPrintWindow(blob, `Invoice_${invoiceno}`);
  };

  const print3ACOA = async (cardInputs) => {
    const { blob, combinedCode } = await fetch3ACOABlob(cardInputs);
    openPrintWindow(blob, `3A_COA_${combinedCode}_${cardInputs.batchnum}`);
  };

  const printDensityCOA = async (cardInputs) => {
    const { blob, combinedCode } = await fetchDensityCOABlob(cardInputs);
    openPrintWindow(blob, `Density_COA_${combinedCode}_${cardInputs.batchnum}`);
  };

  // 🔹 Helper functions
  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const openPrintWindow = (blob, title) => {
    const url = URL.createObjectURL(blob);
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      throw new Error('Popup blocked. Please allow popups for printing.');
    }

    const isPDF = blob.type === 'application/pdf';

    if (isPDF) {
      // Printing via the outer window prints the HTML page the iframe sits in
      // (scaled to the iframe's CSS size), which is what fragments a
      // single-page PDF across multiple sheets. Calling print() on the
      // iframe's own contentWindow hands off to the PDF viewer's native print
      // path instead — the same one its own toolbar print button uses.
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
      // For images, display and print
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
              img {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
              }
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

    // Clean up URL after a delay
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 10000);
  };

  const getInputLabel = (inputType) => {
    switch (inputType) {
      case 'itemcode': return 'Item Code';
      case 'packsize': return 'Pack Size';
      case 'batchnum': return 'Lot No.';
      case 'invoiceno': return 'Invoice No';
      default: return inputType;
    }
  };

  const getPlaceholder = (cardTitle, inputType) => {
    if (inputType === 'itemcode') return 'Type ItemCode...';
    if (inputType === 'batchnum') return 'Enter Lot Number';
    if (inputType === 'invoiceno') return 'Enter Invoice Number';
    return `Enter ${getInputLabel(inputType).toLowerCase()}`;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #eff6ff 100%)', padding: '24px' }}>
      <div style={{ width: '100%' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #dbeafe' }}>
          <div style={{ padding: '32px', borderBottom: '1px solid #93c5fd', background: 'linear-gradient(90deg, #dcfce7 0%, #bbf7d0 100%)', borderRadius: '16px 16px 0 0' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#15803d', margin: 0 }}>Download Center</h2>
            <p style={{ fontSize: '16px', color: '#16a34a', margin: '8px 0 0 0' }}>Generate and download labels, documents, and QR codes</p>
          </div>

          <div style={{ padding: '32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {cards.map((card) => {
                const isLoading = loading[card.title];
                const error = errors[card.title];
                const cardSuggestions = suggestions[card.title] || [];
                const showDropdown = showSuggestions[card.title] && cardSuggestions.length > 0;

                return (
                  <div key={card.id} style={{ backgroundColor: 'white', border: '2px solid #86efac', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                    <div style={{ padding: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', backgroundColor: 'white', border: '2px solid #86efac', borderRadius: '8px', fontSize: '24px' }}>{card.icon}</div>
                          <div>
                            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#15803d', margin: '0 0 4px 0' }}>{card.title}</h3>
                            <p style={{ fontSize: '14px', color: '#16a34a', margin: 0 }}>{card.inputs.map(getInputLabel).join(' + ')}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button
                            onClick={() => handlePrint(card.title)}
                            disabled={isLoading}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '12px 20px',
                              backgroundColor: '#059669',
                              color: 'white',
                              fontWeight: '600',
                              borderRadius: '8px',
                              border: 'none',
                              cursor: isLoading ? 'not-allowed' : 'pointer',
                              opacity: isLoading ? 0.6 : 1
                            }}
                          >
                            {isLoading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Printer size={18} />}
                            <span>Print</span>
                          </button>
                          <button
                            onClick={() => handleDownload(card.title)}
                            disabled={isLoading}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: '#15803d', color: 'white', fontWeight: '600', borderRadius: '8px', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer' }}
                          >
                            {isLoading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={18} />}
                            <span>{isLoading ? 'Processing...' : 'Download'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Inputs */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: error ? '16px' : '0' }}>
                        {card.inputs.map((inputType) => (
                          <div key={inputType} style={{ position: 'relative' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#15803d', marginBottom: '8px' }}>{getInputLabel(inputType)}</label>

                            {/* ItemCode with suggestions */}
                            {inputType === 'itemcode' && (
                              <>
                                <input
                                  type="text"
                                  style={{ width: '100%', padding: '12px', border: '1px solid #86efac', borderRadius: showDropdown ? '8px 8px 0 0' : '8px', fontSize: '14px' }}
                                  placeholder={getPlaceholder(card.title, inputType)}
                                  value={inputs[card.title][inputType] || ''}
                                  onChange={(e) => handleInputChange(card.title, inputType, e.target.value)}
                                />
                                {showDropdown && (
                                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #86efac', maxHeight: '200px', overflowY: 'auto', zIndex: 9999 }}>
                                    {cardSuggestions.map((s, idx) => (
                                      <div
                                        key={idx}
                                        style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                                        onMouseDown={async () => {
                                          setInputs(prev => ({ ...prev, [card.title]: { ...prev[card.title], itemcode: s.itemCode, packsize: '', batchnum: '' } }));
                                          setShowSuggestions(prev => ({ ...prev, [card.title]: false }));
                                          try {
                                            const res = await fetch(`/api/density-labels/pack-sizes/${s.itemCode}`);
                                            const data = await res.json();
                                            setPackSizes(prev => ({ ...prev, [card.title]: data.packSizes || [] }));
                                          } catch (err) {
                                            console.error("PackSize fetch error:", err);
                                          }
                                        }}
                                      >
                                        <strong>{s.itemCode}</strong> — {s.itemName}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}

                            {/* Packsize dropdown */}
                            {inputType === 'packsize' && packSizes[card.title]?.length > 0 && (
                              <select
                                value={inputs[card.title].packsize || ''}
                                onChange={(e) => {
                                  const selectedPackSize = e.target.value; // "1g"
                                  const selectedObj = packSizes[card.title].find(
                                    (p) => p.displayValue === selectedPackSize
                                  );
                                  handlePackSizeSelect(card.title, selectedPackSize, selectedObj);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '12px',
                                  border: '1px solid #86efac',
                                  borderRadius: '8px',
                                  fontSize: '14px',
                                }}
                              >
                                <option value="">Pack Size</option>
                                {packSizes[card.title].map((p, idx) => (
                                  <option key={idx} value={p.displayValue}>{p.displayValue}</option>
                                ))}
                              </select>
                            )}

                            {/* Batchnum / Lot No dropdown */}
                            {inputType === 'batchnum' && batchNums[card.title]?.length > 0 && (
                              <select
                                value={inputs[card.title].batchnum || ''}
                                onChange={(e) => setInputs(prev => ({ ...prev, [card.title]: { ...prev[card.title], batchnum: e.target.value } }))}
                                style={{ width: '100%', padding: '12px', border: '1px solid #86efac', borderRadius: '8px', fontSize: '14px' }}
                              >
                                <option value="">Select Lot Number</option>
                                {batchNums[card.title].map((b, idx) => (
                                  <option key={idx} value={b.batchNum}>{b.batchNum}</option>
                                ))}
                              </select>
                            )}

                            {/* Fallback input */}
                            {inputType !== 'itemcode' && inputType !== 'packsize' && inputType !== 'batchnum' && (
                              <input
                                type="text"
                                style={{ width: '100%', padding: '12px', border: '1px solid #86efac', borderRadius: '8px', fontSize: '14px' }}
                                placeholder={getPlaceholder(card.title, inputType)}
                                value={inputs[card.title][inputType] || ''}
                                onChange={(e) => handleInputChange(card.title, inputType, e.target.value)}
                              />
                            )}
                          </div>
                        ))}
                      </div>

                      {error && (
                        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <AlertCircle size={16} style={{ color: '#dc2626' }} />
                          <span style={{ color: '#dc2626', fontSize: '14px' }}>{error}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Company address footer */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 25px -8px rgba(0, 0, 0, 0.15)', border: '1px solid #dbeafe', marginTop: '24px', padding: '24px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#15803d', marginBottom: '6px' }}>{COMPANY_ADDRESS.name}</div>
          {COMPANY_ADDRESS.lines.map((line, i) => (
            <div key={i} style={{ fontSize: '13.5px', color: '#4b5563' }}>{line}</div>
          ))}
          <div style={{ fontSize: '13.5px', color: '#1d4ed8', marginTop: '8px' }}>
            Website: {COMPANY_ADDRESS.website} &nbsp;|&nbsp; Email: {COMPANY_ADDRESS.email}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}
      </style>

    </div>
   );
 };

 export default VerticalCards;
