

import React, { useState } from 'react';
import { Download, Loader, AlertCircle } from 'lucide-react';
import msdsMap from 'public/data/msds-map.json';

const VerticalCards = () => {
  const [inputs, setInputs] = useState({
    '3A Label': { itemcode: '', batchnum: '' },
    'Density Label': { itemcode: '', batchnum: '' },
    'QR': { itemcode: '', batchnum: '' },
    'Invoice': { invoiceno: '' },
    '3A MSDS': { itemcode: '' }
  });

  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});

  const cards = [
    { id: 1, title: '3A Label', icon: '🏷️', inputs: ['itemcode', 'batchnum'] },
    { id: 2, title: 'Density Label', icon: '📊', inputs: ['itemcode', 'batchnum'] },
    { id: 3, title: 'QR', icon: '🔲', inputs: ['itemcode', 'batchnum'] },
    { id: 4, title: 'Invoice', icon: '🧾', inputs: ['invoiceno'] },
    { id: 5, title: '3A MSDS', icon: '📄', inputs: ['itemcode'] }
  ];

  const handleInputChange = (cardTitle, inputType, value) => {
    setInputs(prev => ({
      ...prev,
      [cardTitle]: {
        ...prev[cardTitle],
        [inputType]: value
      }
    }));

    if (errors[cardTitle]) {
      setErrors(prev => ({
        ...prev,
        [cardTitle]: null
      }));
    }
  };

  const validateInputs = (cardTitle, cardInputs) => {
    const cardData = inputs[cardTitle];
    const missingFields = cardInputs.filter(inputType => !cardData[inputType]?.trim());

    if (missingFields.length > 0) {
      const fieldLabels = missingFields.map(field => getInputLabel(field));
      return `Please fill in: ${fieldLabels.join(', ')}`;
    }
    return null;
  };

  const handleDownload = async (cardTitle) => {
    const card = cards.find(c => c.title === cardTitle);
    if (!card) return;

    const validationError = validateInputs(cardTitle, card.inputs);
    if (validationError) {
      setErrors(prev => ({
        ...prev,
        [cardTitle]: validationError
      }));
      return;
    }

    setLoading(prev => ({ ...prev, [cardTitle]: true }));
    setErrors(prev => ({ ...prev, [cardTitle]: null }));

    try {
      await downloadFile(card, inputs[cardTitle]);
    } catch (error) {
      console.error(`Download error for ${cardTitle}:`, error);
      setErrors(prev => ({
        ...prev,
        [cardTitle]: error.message || 'Download failed. Please try again.'
      }));
    } finally {
      setLoading(prev => ({ ...prev, [cardTitle]: false }));
    }
  };

  const dataURLToBlob = (dataURL) => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const downloadFile = async (card, cardInputs) => {
    switch (card.title) {
      case '3A Label':
        await download3ALabel(cardInputs);
        break;
      case 'Density Label':
        await downloadDensityLabel(cardInputs);
        break;
      case 'QR':
        await downloadQRCode(cardInputs);
        break;
      case 'Invoice':
        await downloadInvoice(cardInputs);
        break;
      case '3A MSDS':
        await downloadMSDS(cardInputs);
        break;
      default:
        throw new Error('Unknown card type');
    }
  };

  const download3ALabel = async (cardInputs) => {
    const params = new URLSearchParams();
    if (cardInputs.batchnum) {
      params.append('batchNum', cardInputs.batchnum);
    }

    const apiPath = `/api/labels/download/${encodeURIComponent(cardInputs.itemcode)}?${params.toString()}`;
    console.log("Calling 3A Label API:", apiPath);

    const response = await fetch(apiPath);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `3A_Label_${cardInputs.itemcode}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
  };

  const downloadDensityLabel = async (cardInputs) => {
    const url = `/api/density-labels/download/${encodeURIComponent(cardInputs.itemcode)}${cardInputs.batchnum ? `?batchNum=${encodeURIComponent(cardInputs.batchnum)}` : ''}`;

    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `Density_Label_${cardInputs.itemcode}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
  };

  const downloadQRCode = async (cardInputs) => {
    const itemCode = cardInputs.itemcode.trim();
    const batch = cardInputs.batchnum.trim();

    if (!batch || batch.length === 0) {
      throw new Error('Batch number is required for QR code generation');
    }

    const code = itemCode.includes("-") ? itemCode.split("-")[0] : itemCode;
    const energyUrl = `https://energy01.oss-cn-shanghai.aliyuncs.com/upload/COA_FOREIGN/${code}_${batch}.pdf`;

    console.log("Generated Energy URL for QR:", energyUrl);

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
        ctx.textAlign = 'left';

        ctx.fillText(`CAT ${itemCode}`, padding + 10, qrSize + padding + 25);
        ctx.fillText(`LOT ${batch}`, padding + 10, qrSize + padding + 50);

        const finalDataURL = canvas.toDataURL('image/png');
        const blob = dataURLToBlob(finalDataURL);
        const blobUrl = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `QR_${itemCode}_${batch}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);

        resolve();
      };
      qrImage.onerror = reject;
      qrImage.src = qrDataURL;
    });
  };

  const downloadInvoice = async (cardInputs) => {
    const response = await fetch(`/api/invoices/download-pdf/${encodeURIComponent(cardInputs.invoiceno)}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_${cardInputs.invoiceno}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadMSDS = async (cardInputs) => {
    const key = cardInputs.itemcode.trim();
    const msdsUrl = msdsMap[key];
    if (!msdsUrl) throw new Error("MSDS file not found for this ItemCode");

    const fileRes = await fetch(msdsUrl);
    if (!fileRes.ok) throw new Error(`MSDS not available (${fileRes.status})`);

    const blob = await fileRes.blob();
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `${key}_MSDS.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  };

  const getInputLabel = (inputType) => {
    switch (inputType) {
      case 'itemcode': return 'Item Code';
      case 'batchnum': return 'Batch Number';
      case 'invoiceno': return 'Invoice No';
      default: return inputType;
    }
  };

  const getPlaceholder = (cardTitle, inputType) => {
    if (cardTitle === '3A Label') {
      if (inputType === 'itemcode') return 'Ex: A040337-100g';
      if (inputType === 'batchnum') return 'Ex: DX6RRD6X';
    }
    if (cardTitle === 'Density Label') {
      if (inputType === 'itemcode') return 'Ex: B011102-25g';
      if (inputType === 'batchnum') return 'Ex: MSRN4RPA';
    }
    if (cardTitle === 'QR') {
      if (inputType === 'itemcode') return 'Ex: A040337-100g';
      if (inputType === 'batchnum') return 'Ex: DX6RRD6X';
    }
    if (cardTitle === '3A MSDS' && inputType === 'itemcode') {
      return 'Ex: A030043-25g';
    }
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

                return (
                  <div key={card.id} style={{ backgroundColor: 'white', border: '2px solid #86efac', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
                    <div style={{ padding: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', backgroundColor: 'white', border: '2px solid #86efac', borderRadius: '8px', fontSize: '24px' }}>{card.icon}</div>
                          <div>
                            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#15803d', margin: '0 0 4px 0' }}>{card.title}</h3>
                            <p style={{ fontSize: '14px', color: '#16a34a', margin: 0 }}>{card.inputs.map(getInputLabel).join(' + ')}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownload(card.title)}
                          disabled={isLoading}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: '#15803d', color: 'white', fontWeight: '600', borderRadius: '8px', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', transition: 'all 0.2s', opacity: isLoading ? 0.5 : 1 }}
                          onMouseOver={(e) => !isLoading && (e.target.style.backgroundColor = '#166534')}
                          onMouseOut={(e) => !isLoading && (e.target.style.backgroundColor = '#15803d')}
                        >
                          {isLoading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={18} />}
                          <span>{isLoading ? 'Downloading...' : 'Download'}</span>
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: error ? '16px' : '0' }}>
                        {card.inputs.map((inputType) => (
                          <div key={inputType}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#15803d', marginBottom: '8px' }}>{getInputLabel(inputType)}</label>
                            <input
                              type="text"
                              style={{ width: '100%', padding: '12px', border: '1px solid #86efac', borderRadius: '8px', fontSize: '14px', backgroundColor: 'white', boxSizing: 'border-box', transition: 'border-color 0.2s', outline: 'none' }}
                              placeholder={getPlaceholder(card.title, inputType)}
                              value={inputs[card.title][inputType] || ''}
                              onChange={(e) => handleInputChange(card.title, inputType, e.target.value)}
                              onFocus={(e) => e.target.style.borderColor = '#15803d'}
                              onBlur={(e) => e.target.style.borderColor = '#86efac'}
                            />
                          </div>
                        ))}
                      </div>

                      {error && (
                        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <AlertCircle size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
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
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default VerticalCards;
