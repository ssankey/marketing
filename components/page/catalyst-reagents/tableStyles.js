// components/page/catalyst-reagents/tableStyles.js
// Same "card on tinted page + sticky toolbar + bordered table" design system
// as components/page/top-outstanding/tableStyles.js (which itself matches
// Product Master / Catalyst Pricing) — prefix "cr-" here, used only for the
// page chrome (checkboxes, KPI cards, date toolbar); the chart itself keeps
// its own bootstrap look, forked from EnhancedSalesCOGSChart.js.

const TABLE_PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

  .cr {
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

  .cr-card {
    /* No max-width cap — fills the page at any zoom level instead of
       leaving empty side margins once the effective viewport (in CSS px)
       grows past a fixed cap when the user zooms out. */
    width: 100%;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    box-shadow: 0 14px 34px rgba(31, 41, 55, 0.10), 0 2px 8px rgba(31, 41, 55, 0.06);
    padding: 28px 32px 32px;
    margin: 0 auto 24px;
    box-sizing: border-box;
  }

  .cr-truncate {
    display: inline-block;
    max-width: 320px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: middle;
  }

  /* Bootstrap's modal-xl caps at a fixed 1140px — override with a
     viewport-relative width so the drill-down modal also grows when the
     user zooms out, instead of looking tiny against a wider effective page. */
  .cr-modal-dialog {
    max-width: 95vw !important;
    width: 95vw;
  }

  .cr-header { border-bottom: 1px solid var(--border); padding-bottom: 20px; margin-bottom: 20px; }
  .cr-header h1 { font-family: 'IBM Plex Mono', monospace; font-size: 24px; font-weight: 700; margin: 0 0 6px; }
  .cr-header-desc { font-size: 13.5px; color: var(--muted); margin: 0; }

  .cr-controls {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 14px 18px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px 16px;
    align-items: flex-end;
    margin-bottom: 20px;
    box-shadow: 0 6px 16px rgba(31, 41, 55, 0.08);
  }

  .cr-field { display: flex; flex-direction: column; gap: 6px; }
  .cr-field label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    font-weight: 600;
    color: var(--muted);
  }

  .cr-checkbox-group { display: flex; gap: 14px; flex-wrap: wrap; }
  .cr-checkbox-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text);
    cursor: pointer;
    user-select: none;
  }
  .cr-checkbox-label input { width: 15px; height: 15px; cursor: pointer; accent-color: var(--accent); }

  .cr-select, .cr-input {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 8px 10px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
    color: var(--text);
    outline: none;
  }
  .cr-select:focus, .cr-input:focus { border-color: var(--accent); }

  .cr-mode-toggle { display: flex; border: 1px solid var(--border); border-radius: 999px; overflow: hidden; }
  .cr-mode-btn {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11.5px;
    font-weight: 600;
    background: var(--surface);
    color: var(--muted);
    border: none;
    padding: 7px 12px;
    cursor: pointer;
    white-space: nowrap;
  }
  .cr-mode-btn.active { background: var(--accent); color: #ffffff; }

  .cr-spacer { flex: 1 1 auto; }

  .cr-kpi-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 14px;
    margin-bottom: 20px;
  }
  .cr-kpi-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px 18px;
  }
  .cr-kpi-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    font-weight: 600;
    color: var(--muted);
    margin-bottom: 8px;
  }
  .cr-kpi-value { font-family: 'IBM Plex Mono', monospace; font-size: 22px; font-weight: 700; color: var(--text); }
  .cr-kpi-value.good { color: var(--good); }
  .cr-kpi-value.bad { color: var(--bad); }
  .cr-kpi-sub { font-size: 11.5px; color: var(--muted); margin-top: 4px; }

  .cr-loading, .cr-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 48px 20px;
    color: var(--muted);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
    text-align: center;
  }
  .cr-spinner {
    width: 18px; height: 18px; border-radius: 50%;
    border: 2px solid var(--border); border-top-color: var(--accent);
    animation: cr-spin 0.8s linear infinite;
  }
  @keyframes cr-spin { to { transform: rotate(360deg); } }

  .cr-table-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
  /* max-height + its own overflow-y so this scrolls predictably as rows
     expand/collapse, independent of the surrounding Bootstrap modal's own
     scroll-region sizing (which is calculated once at open time and can
     otherwise leave newly-expanded content unreachable). */
  .cr-table-scroll { overflow-x: auto; overflow-y: auto; max-height: 60vh; }
  .cr-table { width: 100%; border-collapse: collapse; }
  .cr-table th {
    position: sticky;
    top: 0;
    z-index: 1;
    background: var(--surface2);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
    color: var(--muted);
    border-bottom: 1px solid var(--border);
    border-right: 1px solid var(--border);
    padding: 9px 12px;
    white-space: nowrap;
    cursor: pointer;
    user-select: none;
  }
  .cr-table th:last-child { border-right: none; }
  .cr-th-left { text-align: left; }
  .cr-th-right { text-align: right; }
  .cr-table td {
    padding: 10px 14px;
    font-size: 15px;
    border-bottom: 1px solid var(--border);
    border-right: 1px solid var(--border);
    white-space: nowrap;
  }
  .cr-table td:last-child { border-right: none; }
  .cr-table tbody tr:last-child td { border-bottom: none; }
  .cr-table tbody tr.cr-row-clickable { cursor: pointer; }
  .cr-table tbody tr.cr-row-clickable:hover { background: var(--surface2); }
  .cr-num { text-align: right; font-family: 'IBM Plex Mono', monospace; }
  .cr-total-row td { background: #f0f4ff; font-weight: 700; color: var(--accent); }

  .cr-badge {
    display: inline-block;
    padding: 2px 9px;
    border-radius: 20px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    font-weight: 700;
  }
  .cr-badge.good { color: var(--good); background: var(--surface-green); }
  .cr-badge.bad { color: var(--bad); background: var(--surface-red); }

  .cr-expand-toggle {
    background: none;
    border: 1px solid var(--border);
    border-radius: 4px;
    width: 20px;
    height: 20px;
    line-height: 1;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    cursor: pointer;
    color: var(--accent);
    margin-right: 8px;
  }
  .cr-indent-1 { padding-left: 28px !important; }
  .cr-indent-2 { padding-left: 48px !important; }
  .cr-indent-3 { padding-left: 68px !important; }

  .cr-modal-title { font-family: 'IBM Plex Mono', monospace; font-weight: 700; font-size: 16px; }
  .cr-modal-subtitle { font-size: 12.5px; color: var(--muted); margin-top: 2px; }
  .cr-export-btn {
    background: var(--good);
    color: #ffffff;
    border: none;
    border-radius: 5px;
    padding: 8px 16px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }
  .cr-export-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .cr-dash { color: var(--muted); }

  .cr-page-btn {
    background: var(--surface2);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 6px 12px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    cursor: pointer;
  }
  .cr-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .cr-cell-clickable { cursor: pointer; }
  .cr-cell-clickable:hover { background: var(--surface2); }
`;

export default TABLE_PAGE_STYLES;
