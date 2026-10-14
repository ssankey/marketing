// utils/energySeal/constants.js

// Fixed SKU list for the "Energy Seal" product line (Item No. incl. pack size).
export const ENERGY_SEAL_ITEM_CODES = [
  "D040615-100ml",
  "D040615-1L",
  "D040615-500ml",
  "W310130-100ml",
  "W310130-1L",
  "W310130-500ml",
  "W310132-100ml",
  "W310132-1L",
  "W310132-500ml",
  "W320649-100ml",
  "W320649-1L",
  "W320649-500ml",
  "W420444-100ml",
  "W420444-1L",
  "W420444-500ml",
  "W420491-100ml",
  "W420491-1L",
  "W420491-500ml",
  "W610492-100ml",
  "W610492-1L",
  "W610492-500ml",
  "W610492-SPEC",
  "W610942-100ml",
  "W610942-1L",
  "W610942-500ml",
  "W610944-100ml",
  "W610944-1L",
  "W610944-500ml",
  "W610154-100ml",
  "W310075-100ml",
  "W320079-100ml",
  "W330237-100ml",
];

// CAS numbers per SKU, from the same source list as ENERGY_SEAL_ITEM_CODES.
// OINV/INV1 don't carry CAS, so the line-items API attaches it from here.
export const ENERGY_SEAL_CAS_BY_CODE = {
  "D040615-100ml": "75-05-8",
  "D040615-1L": "75-05-8",
  "D040615-500ml": "75-05-8",
  "W310130-100ml": "109-99-9",
  "W310130-1L": "109-99-9",
  "W310130-500ml": "109-99-9",
  "W310132-100ml": "109-99-9",
  "W310132-1L": "109-99-9",
  "W310132-500ml": "109-99-9",
  "W320649-100ml": "123-91-1",
  "W320649-1L": "123-91-1",
  "W320649-500ml": "123-91-1",
  "W420444-100ml": "872-50-4",
  "W420444-1L": "872-50-4",
  "W420444-500ml": "872-50-4",
  "W420491-100ml": "872-50-4",
  "W420491-1L": "872-50-4",
  "W420491-500ml": "872-50-4",
  "W610492-100ml": "127-19-5",
  "W610492-1L": "127-19-5",
  "W610492-500ml": "127-19-5",
  "W610492-SPEC": "127-19-5",
  "W610942-100ml": "75-09-2",
  "W610942-1L": "75-09-2",
  "W610942-500ml": "75-09-2",
  "W610944-100ml": "68-12-2",
  "W610944-1L": "68-12-2",
  "W610944-500ml": "68-12-2",
  "W610154-100ml": "75-09-2",
  "W310075-100ml": "109-99-9",
  "W320079-100ml": "123-91-1",
  "W330237-100ml": "75-05-8",
};

// Static "Ultra dry solvents" catalog snapshot (the source list handed over
// for the Energy Seal line) — Item No., Description, In Stock, HSN (Chapter
// ID), CAS No., Item Group. In Stock is a point-in-time snapshot, not live.
export const ULTRA_DRY_SOLVENTS_PRODUCTS = [
  { itemNo: "D040615-100ml", description: "Acetonitrile, 99.9%, Extra Dry,with molecular sieves, Water≤10 ppm (by K.F.),EnergySeal", inStock: 0, hsn: "29269090", cas: "75-05-8", itemGroup: "3A Chemicals" },
  { itemNo: "D040615-1L", description: "Acetonitrile, 99.9%, Extra Dry,with molecular sieves, Water≤10 ppm (by K.F.),EnergySeal", inStock: 0, hsn: "29269090", cas: "75-05-8", itemGroup: "3A Chemicals" },
  { itemNo: "D040615-500ml", description: "Acetonitrile, 99.9%, Extra Dry,with molecular sieves, Water≤10 ppm (by K.F.),EnergySeal", inStock: 22, hsn: "29269090", cas: "75-05-8", itemGroup: "3A Chemicals" },
  { itemNo: "W310130-100ml", description: "Tetrahydrofuran, 99.9%, Extra Dry,Water≤30ppm(byK.F.),Energyseal", inStock: 0, hsn: "29321100", cas: "109-99-9", itemGroup: "3A Chemicals" },
  { itemNo: "W310130-1L", description: "Tetrahydrofuran, 99.9%, Extra Dry,Water≤30ppm(byK.F.),Energyseal", inStock: 0, hsn: "29321100", cas: "109-99-9", itemGroup: "3A Chemicals" },
  { itemNo: "W310130-500ml", description: "Tetrahydrofuran, 99.9%, Extra Dry,Water≤30ppm(byK.F.),Energyseal", inStock: 0, hsn: "29321100", cas: "109-99-9", itemGroup: "3A Chemicals" },
  { itemNo: "W310132-100ml", description: "Tetrahydrofuran,99.9%,Extra Dry,with molecular sieves,Water≤30ppm(byK.F.),Energyseal", inStock: 0, hsn: "29321100", cas: "109-99-9", itemGroup: "3A Chemicals" },
  { itemNo: "W310132-1L", description: "Tetrahydrofuran,99.9%,Extra Dry,with molecular sieves,Water≤30ppm(byK.F.),Energyseal", inStock: 0, hsn: "29321100", cas: "109-99-9", itemGroup: "3A Chemicals" },
  { itemNo: "W310132-500ml", description: "Tetrahydrofuran,99.9%,Extra Dry,with molecular sieves,Water≤30ppm(byK.F.),Energyseal", inStock: 15, hsn: "29321100", cas: "109-99-9", itemGroup: "3A Chemicals" },
  { itemNo: "W320649-100ml", description: "1,4-Dioxane, 99.7%, Extra Dry, with molecular sieves, stabilized with BHT, Water≤30 ppm (by K.F.), EnergySeal", inStock: 0, hsn: "29329990", cas: "123-91-1", itemGroup: "3A Chemicals" },
  { itemNo: "W320649-1L", description: "1,4-Dioxane, 99.7%, Extra Dry, with molecular sieves, stabilized with BHT, Water≤30 ppm (by K.F.), EnergySeal", inStock: 0, hsn: "29329990", cas: "123-91-1", itemGroup: "3A Chemicals" },
  { itemNo: "W320649-500ml", description: "1,4-Dioxane, 99.7%, Extra Dry, with molecular sieves, stabilized with BHT, Water≤30 ppm (by K.F.), EnergySeal", inStock: 20, hsn: "29329990", cas: "123-91-1", itemGroup: "3A Chemicals" },
  { itemNo: "W420444-100ml", description: "N-Methyl-2-pyrrolidinone 99.5%, Extra Dry, Water≤50 ppm (by K.F.), EnergySeal", inStock: 3, hsn: "29152990", cas: "872-50-4", itemGroup: "3A Chemicals" },
  { itemNo: "W420444-1L", description: "N-Methyl-2-pyrrolidinone 99.5%, Extra Dry, Water≤50 ppm (by K.F.), EnergySeal", inStock: 1, hsn: "29152990", cas: "872-50-4", itemGroup: "3A Chemicals" },
  { itemNo: "W420444-500ml", description: "N-Methyl-2-pyrrolidinone 99.5%, Extra Dry, Water≤50 ppm (by K.F.), EnergySeal", inStock: 1, hsn: "29152990", cas: "872-50-4", itemGroup: "3A Chemicals" },
  { itemNo: "W420491-100ml", description: "N-Methyl-2-pyrrolidinone 99.5%, Extra Dry, Water≤30 ppm (by K.F.), EnergySeal", inStock: 3, hsn: "29152990", cas: "872-50-4", itemGroup: "3A Chemicals" },
  { itemNo: "W420491-1L", description: "N-Methyl-2-pyrrolidinone 99.5%, Extra Dry, Water≤30 ppm (by K.F.), EnergySeal", inStock: 1, hsn: "29152990", cas: "872-50-4", itemGroup: "3A Chemicals" },
  { itemNo: "W420491-500ml", description: "N-Methyl-2-pyrrolidinone 99.5%, Extra Dry, Water≤30 ppm (by K.F.), EnergySeal", inStock: 3, hsn: "29152990", cas: "872-50-4", itemGroup: "3A Chemicals" },
  { itemNo: "W610492-100ml", description: "N,N-Dimethyl acetamide, 99.8%, Extra Dry, with molecular sieves, Water≤50 ppm (by K.F.), EnergySeal", inStock: 9, hsn: "29211190", cas: "127-19-5", itemGroup: "3A Chemicals" },
  { itemNo: "W610492-1L", description: "N,N-Dimethyl acetamide, 99.8%, Extra Dry, with molecular sieves, Water≤50 ppm (by K.F.), EnergySeal", inStock: 0, hsn: "29152990", cas: "127-19-5", itemGroup: "3A Chemicals" },
  { itemNo: "W610492-500ml", description: "N,N-Dimethyl acetamide, 99.8%, Extra Dry, with molecular sieves, Water≤50 ppm (by K.F.), EnergySeal", inStock: 4, hsn: "29152990", cas: "127-19-5", itemGroup: "3A Chemicals" },
  { itemNo: "W610492-SPEC", description: "N,N-Dimethyl acetamide, 99.8%, Extra Dry, with molecular sieves, Water≤50 ppm (by K.F.), EnergySeal", inStock: 0, hsn: "29021990", cas: "127-19-5", itemGroup: "3A Chemicals" },
  { itemNo: "W610942-100ml", description: "Dichloromethane,99.9%, Extra Dry,with molecular sieves,Water≤30 ppm (by K.F.),EnergySeal", inStock: 0, hsn: "29031200", cas: "75-09-2", itemGroup: "3A Chemicals" },
  { itemNo: "W610942-1L", description: "Dichloromethane,99.9%, Extra Dry,with molecular sieves,Water≤30 ppm (by K.F.),EnergySeal", inStock: 0, hsn: "29031200", cas: "75-09-2", itemGroup: "3A Chemicals" },
  { itemNo: "W610942-500ml", description: "Dichloromethane,99.9%, Extra Dry,with molecular sieves,Water≤30 ppm (by K.F.),EnergySeal", inStock: 24, hsn: "29031200", cas: "75-09-2", itemGroup: "3A Chemicals" },
  { itemNo: "W610944-100ml", description: "N,N-Dimethylformamide, 99.9%, Extra Dry, with molecular sieves, Water≤30 ppm (by K.F.), EnergySeal", inStock: 0, hsn: "29152990", cas: "68-12-2", itemGroup: "3A Chemicals" },
  { itemNo: "W610944-1L", description: "N,N-Dimethylformamide, 99.9%, Extra Dry, with molecular sieves, Water≤30 ppm (by K.F.), EnergySeal", inStock: 0, hsn: "29152990", cas: "68-12-2", itemGroup: "3A Chemicals" },
  { itemNo: "W610944-500ml", description: "N,N-Dimethylformamide, 99.9%, Extra Dry, with molecular sieves, Water≤30 ppm (by K.F.), EnergySeal", inStock: 23, hsn: "29152990", cas: "68-12-2", itemGroup: "3A Chemicals" },
  { itemNo: "W610154-100ml", description: "Dichloromethane,99.9%, Extra Dry,Water≤50 ppm (by K.F.)", inStock: 3, hsn: "29031200", cas: "75-09-2", itemGroup: "3A Chemicals" },
  { itemNo: "W310075-100ml", description: "Tetrahydrofuran,99.5%, Extra Dry, stabilized with BHT,Water≤50 ppm (by K.F.)", inStock: 2, hsn: "29321100", cas: "109-99-9", itemGroup: "3A Chemicals" },
  { itemNo: "W320079-100ml", description: "1,4-Dioxane, 99.7%, Extra Dry,stabilized with BHT,Water≤50 ppm (by K.F.)", inStock: 3, hsn: "29329990", cas: "123-91-1", itemGroup: "3A Chemicals" },
  { itemNo: "W330237-100ml", description: "Acetonitrile,99.9%, Extra Dry,Water≤50 ppm (by K.F.)", inStock: 3, hsn: "29269090", cas: "75-05-8", itemGroup: "3A Chemicals" },
];

// Earliest month selectable in the Energy Seal analytics UI.
export const ENERGY_SEAL_START_YEAR = 2026;
export const ENERGY_SEAL_START_MONTH = 4; // April

// Builds ascending {value: "YYYY-MM", label: "April 2026"} options from the
// start month through the current month (inclusive).
export function getEnergySealMonthOptions(now = new Date()) {
  const options = [];
  let y = ENERGY_SEAL_START_YEAR;
  let m = ENERGY_SEAL_START_MONTH;
  const endY = now.getFullYear();
  const endM = now.getMonth() + 1;

  while (y < endY || (y === endY && m <= endM)) {
    options.push({
      value: `${y}-${String(m).padStart(2, "0")}`,
      label: new Date(y, m - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" }),
    });
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return options;
}
