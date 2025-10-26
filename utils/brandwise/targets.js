// utils/brandwise/targets.js
export const CATEGORY_CANONICAL = [
  "3A Chemicals","BIKAI","CATO","FD Cell","KANTO",
  "Capricorn","VOLAB","Density","Deutero","Trading",
  "Life Science","Other"
];

export const TARGET_MARGIN_VALUES = {
  "3A Chemicals": 25,
  "BIKAI": 20,
  "CATO": 30,
  "FD Cell": 25,
  "KANTO": 25,
  "Capricorn": 20,
  "VOLAB": 20,
  "Density": 20,
  "Deutero": 25,
  "Trading": 15,
  "Life Science": 25,
  "Other": 20,
};

export const FY_2025_26_MONTHS = [
  { key: "2025-04", label: "Apr 2025" },
  { key: "2025-05", label: "May 2025" },
  { key: "2025-06", label: "Jun 2025" },
  { key: "2025-07", label: "Jul 2025" },
  { key: "2025-08", label: "Aug 2025" },
  { key: "2025-09", label: "Sep 2025" },
  { key: "2025-10", label: "Oct 2025" },
  { key: "2025-11", label: "Nov 2025" },
  { key: "2025-12", label: "Dec 2025" },
  { key: "2026-01", label: "Jan 2026" },
  { key: "2026-02", label: "Feb 2026" },
  { key: "2026-03", label: "Mar 2026" },
];

// 🔒 NO helper: fully hardcoded 1.1 Cr everywhere (edit any value later)
export const TARGET_SALES_CR_FY_2025_26 = {
  "2025-04": {
    "3A Chemicals": 0.2, BIKAI: 0, CATO: 0.05, "FD Cell":0, KANTO: 0,
    Capricorn: 0.02, VOLAB: 0, Density: 0.3, Deutero: 1, Trading: 1,
    "Life Science": 0, Other: 1.1
  },
  "2025-05": {
    "3A Chemicals": 0.2, BIKAI: 0, CATO: 0.05, "FD Cell":0, KANTO: 0.04,
    Capricorn: 0.02, VOLAB: 0, Density: 0.3, Deutero: 1, Trading: 1,
    "Life Science": 0, Other: 1.1
  },
  "2025-06": {
    "3A Chemicals": 0.3, BIKAI: 0, CATO: 0.05, "FD Cell":0, KANTO: 0.04,
    Capricorn: 0.02, VOLAB: 0, Density: 0.3, Deutero: 1, Trading: 1,
    "Life Science": 0, Other: 1.1
  },
  "2025-07":{
    "3A Chemicals": 0.3, BIKAI: 0.2, CATO: 0.05, "FD Cell":0.02, KANTO: 0.04,
    Capricorn: 0.02, VOLAB: 0, Density: 0.3, Deutero: 1, Trading: 1,
    "Life Science": 0, Other: 1.1
  },
  "2025-08": {
    "3A Chemicals": 0.5, BIKAI: 0.2, CATO: 0.05, "FD Cell":0.02, KANTO: 0.04,
    Capricorn: 0.02, VOLAB: 0, Density: 0.3, Deutero: 1, Trading: 1,
    "Life Science": 0, Other: 1.1
  },
  "2025-09": {
    "3A Chemicals": 0.5, BIKAI: 0.2, CATO: 0.1, "FD Cell":0.02, KANTO: 0.04,
    Capricorn: 0.02, VOLAB: 0, Density: 0.3, Deutero: 1, Trading: 2,
    "Life Science": 0, Other: 1.1
  },
  "2025-10": {
    "3A Chemicals": 0.5, BIKAI: 0.4, CATO: 0.2, "FD Cell":0.1, KANTO: 0.1,
    Capricorn: 0.04, VOLAB: 0, Density: 0.5, Deutero: 1, Trading: 2,
    "Life Science": 0, Other: 1.1
  },
  "2025-11": {
    "3A Chemicals": 0.7, BIKAI: 0.5, CATO: 0.2, "FD Cell":0.1, KANTO: 0.1,
    Capricorn: 0.1, VOLAB: 0.04, Density: 0.5, Deutero: 1, Trading: 2,
    "Life Science": 0, Other: 1.1
  },
  "2025-12": {
    "3A Chemicals": 1.1, BIKAI: 1.1, CATO: 1.1, "FD Cell": 1.1, KANTO: 1.1,
    Capricorn: 1.1, VOLAB: 1.1, Density: 1.1, Deutero: 1.1, Trading: 1.1,
    "Life Science": 0, Other: 1.1
  },
  "2026-01": {
    "3A Chemicals": 1.1, BIKAI: 1.1, CATO: 1.1, "FD Cell": 1.1, KANTO: 1.1,
    Capricorn: 1.1, VOLAB: 1.1, Density: 1.1, Deutero: 1.1, Trading: 1.1,
    "Life Science": 0, Other: 1.1
  },
  "2026-02": {
    "3A Chemicals": 1.1, BIKAI: 1.1, CATO: 1.1, "FD Cell": 1.1, KANTO: 1.1,
    Capricorn: 1.1, VOLAB: 1.1, Density: 1.1, Deutero: 1.1, Trading: 1.1,
    "Life Science": 0, Other: 1.1
  },
  "2026-03": {
    "3A Chemicals": 1.1, BIKAI: 1.1, CATO: 1.1, "FD Cell": 1.1, KANTO: 1.1,
    Capricorn: 1.1, VOLAB: 1.1, Density: 1.1, Deutero: 1.1, Trading: 1.1,
    "Life Science": 0, Other: 1.1
  }
};

// simple utils (you can inline if you prefer)
export const fmtCr = (n) => (Math.round(n * 100) / 100).toFixed(2);

export const calcRowTotal = (monthKey) =>
  CATEGORY_CANONICAL.reduce(
    (sum, cat) => sum + (TARGET_SALES_CR_FY_2025_26[monthKey]?.[cat] || 0), 0
  );

export const calcColTotal = (category) =>
  Object.keys(TARGET_SALES_CR_FY_2025_26).reduce(
    (sum, m) => sum + (TARGET_SALES_CR_FY_2025_26[m]?.[category] || 0), 0
  );

export const calcGrandTotal = () =>
  Object.keys(TARGET_SALES_CR_FY_2025_26).reduce(
    (sum, m) => sum + calcRowTotal(m), 0
  );
