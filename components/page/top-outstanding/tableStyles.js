// components/page/top-outstanding/tableStyles.js
// Shared "ot-" (outstanding table) styles — same design system as
// components/ProductsTable.js (Product Master) and CatalystPricingConsole.js:
// IBM Plex Mono/Sans, a card on a tinted page background, a sticky filter
// toolbar, and a bordered/mono-header data table with pill badges.

const TABLE_PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

  .ot {
    --page-bg: #e4ebf1;
    --surface: #ffffff;
    --surface2: #e0edf9;
    --surface-green: #dcf3e8;
    --surface-red: #fdecea;
    --border: #c5d2dc;
    --text: #10151c;
    --muted: #52606d;
    --accent: #1f68bf;
    --good: #21875a;
    --bad: #c0402f;

    background: var(--page-bg);
    color: var(--text);
    font-family: 'IBM Plex Sans', sans-serif;
    min-height: 100vh;
    padding: 28px;
  }

  .ot-card {
    width: 100%;
    max-width: 1600px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    box-shadow: 0 14px 34px rgba(31, 41, 55, 0.10), 0 2px 8px rgba(31, 41, 55, 0.06);
    padding: 28px 32px 32px;
    margin: 0 auto 24px;
  }

  .ot-header {
    border-bottom: 1px solid var(--border);
    padding-bottom: 20px;
    margin-bottom: 20px;
  }
  .ot-header h1 {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 24px;
    font-weight: 700;
    margin: 0 0 6px;
  }
  .ot-header-desc { font-size: 13.5px; color: var(--muted); margin: 0; }

  .ot-tabs {
    display: flex;
    gap: 6px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }
  .ot-tab-btn {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12.5px;
    font-weight: 600;
    background: var(--surface2);
    color: var(--muted);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 8px 18px;
    cursor: pointer;
  }
  .ot-tab-btn.active { background: var(--accent); color: #ffffff; border-color: var(--accent); }

  .ot-controls {
    position: sticky;
    top: 12px;
    z-index: 50;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 14px 18px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px 12px;
    align-items: flex-end;
    margin-bottom: 20px;
    box-shadow: 0 6px 16px rgba(31, 41, 55, 0.12);
  }

  .ot-field { display: flex; flex-direction: column; gap: 6px; position: relative; }
  .ot-field label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    font-weight: 600;
    color: var(--muted);
  }

  .ot-input, .ot-select {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 8px 10px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13.5px;
    color: var(--text);
    outline: none;
    transition: border-color 0.15s ease;
  }
  .ot-input:focus, .ot-select:focus { border-color: var(--accent); }
  .ot-input:disabled { opacity: 0.6; cursor: not-allowed; background: var(--surface2); }

  .ot-clear-x {
    position: absolute;
    right: 10px;
    top: 34px;
    cursor: pointer;
    color: var(--muted);
    font-size: 16px;
    line-height: 1;
    background: none;
    border: none;
  }

  .ot-suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 4px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    box-shadow: 0 8px 20px rgba(31, 41, 55, 0.15);
    max-height: 260px;
    overflow-y: auto;
    z-index: 60;
  }
  .ot-suggestion-item {
    padding: 8px 12px;
    cursor: pointer;
    font-size: 13px;
    border-bottom: 1px solid var(--border);
  }
  .ot-suggestion-item:last-child { border-bottom: none; }
  .ot-suggestion-item:hover, .ot-suggestion-item.active { background: var(--surface2); }
  .ot-suggestion-name { font-weight: 600; color: var(--text); }
  .ot-suggestion-code {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    color: var(--muted);
    margin-top: 2px;
  }
  .ot-suggestion-empty, .ot-suggestion-loading {
    padding: 12px;
    text-align: center;
    color: var(--muted);
    font-size: 12.5px;
  }

  .ot-mode-toggle { display: flex; border: 1px solid var(--border); border-radius: 999px; overflow: hidden; }
  .ot-mode-btn {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11.5px;
    font-weight: 600;
    background: var(--surface);
    color: var(--muted);
    border: none;
    padding: 7px 10px;
    cursor: pointer;
    white-space: nowrap;
  }
  .ot-mode-btn.active { background: var(--accent); color: #ffffff; }

  .ot-reset-btn, .ot-search-btn {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 8px 16px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--text);
    cursor: pointer;
    white-space: nowrap;
  }
  .ot-reset-btn:hover { background: var(--surface2); }
  .ot-search-btn { background: var(--accent); color: #ffffff; border-color: var(--accent); }
  .ot-search-btn:hover:not(:disabled) { background: #185294; }
  .ot-reset-btn:disabled, .ot-search-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .ot-spacer { flex: 1 1 auto; }

  .ot-total-pill {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
    color: var(--muted);
    align-self: center;
  }
  .ot-total-pill strong { color: var(--text); }
  .ot-amount-red { color: var(--bad); font-weight: 700; }
  .ot-amount-dark { color: var(--text); font-weight: 700; }

  .ot-export-btn {
    background: var(--good);
    color: #ffffff;
    border: none;
    border-radius: 5px;
    padding: 8px 16px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }
  .ot-export-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .ot-table-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }

  .ot-loading, .ot-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 60px 20px;
    color: var(--muted);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
    text-align: center;
  }
  .ot-empty-icon { font-size: 34px; }
  .ot-empty-title { font-family: 'IBM Plex Sans', sans-serif; font-size: 15px; font-weight: 600; color: var(--text); }
  .ot-spinner {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    animation: ot-spin 0.8s linear infinite;
  }
  @keyframes ot-spin { to { transform: rotate(360deg); } }

  .ot-table-scroll { overflow-x: auto; }
  .ot-table { width: 100%; border-collapse: collapse; }
  .ot-table th {
    background: var(--surface2);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
    color: var(--muted);
    border-bottom: 1px solid var(--border);
    border-right: 1px solid var(--border);
    padding: 10px 12px;
    white-space: nowrap;
  }
  .ot-table th:last-child { border-right: none; }
  .ot-th-left { text-align: left; }
  .ot-th-right { text-align: right; }

  .ot-table td {
    padding: 11px 14px;
    font-size: 13px;
    border-bottom: 1px solid var(--border);
    border-right: 1px solid var(--border);
    white-space: nowrap;
  }
  .ot-table td:last-child { border-right: none; }
  .ot-table tbody tr:last-child td { border-bottom: none; }
  .ot-table tbody tr:hover { background: var(--surface2); }
  .ot-table tbody tr.ot-row-clickable { cursor: pointer; }
  .ot-num { text-align: right; font-family: 'IBM Plex Mono', monospace; }
  .ot-mono { font-family: 'IBM Plex Mono', monospace; }
  .ot-dash { color: var(--muted); }

  .ot-rank { font-family: 'IBM Plex Mono', monospace; font-weight: 700; color: var(--muted); }
  .ot-name-cell { font-weight: 600; color: var(--text); }
  .ot-code-cell { font-family: 'IBM Plex Mono', monospace; font-size: 11.5px; color: var(--muted); }

  .ot-badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 20px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px;
    font-weight: 700;
    white-space: nowrap;
  }
  .ot-badge.good { color: var(--good); background: var(--surface-green); }
  .ot-badge.bad { color: var(--bad); background: var(--surface-red); }
  .ot-badge.info { color: var(--accent); background: var(--surface2); }
  .ot-badge.muted { color: var(--muted); background: #eef1f4; }
  .ot-badge.warn { color: #92400e; background: #fef3c7; }

  .ot-highlight-row td { background: #fffbe6; }
  .ot-highlight-row:hover td { background: #fff6cc; }

  .ot-pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    border-top: 1px solid var(--border);
    flex-wrap: wrap;
    gap: 10px;
  }
  .ot-pagination-info { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--muted); }
  .ot-pagination-controls { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .ot-page-btn {
    background: var(--surface2);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 6px 11px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    cursor: pointer;
  }
  .ot-page-btn.active { background: var(--accent); color: #ffffff; border-color: var(--accent); font-weight: 700; }
  .ot-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .ot-modal { font-family: 'IBM Plex Sans', sans-serif; color: var(--text); }
  .ot-modal-title { font-family: 'IBM Plex Mono', monospace; font-weight: 700; font-size: 16px; }
  .ot-modal-subtitle { font-size: 12.5px; color: var(--muted); margin-top: 2px; }
  .ot-modal-filters {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    padding: 12px 0 16px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 12px;
  }
`;

export default TABLE_PAGE_STYLES;
