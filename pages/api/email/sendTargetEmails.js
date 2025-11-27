
// curl -X POST "http://localhost:3000/api/email/sendTargetEmails"
// curl -X POST "https://marketing.densitypharmachem.com/api/email/sendTargetEmails"

// pages/api/email/sendTargetEmails.js

import { queryDatabase } from "../../../lib/db";
import { formatNumberWithIndianCommas } from "utils/formatNumberWithIndianCommas";

// Category to Salesperson mapping
const CATEGORY_SALESPERSON_MAPPING = {
  "3A Chemicals": { name: "Dinesh Kumar", email: "dinesh@densitypharmachem.com" },
  "BIKAI": { name: "Jagadish Naidu", email: "Jagadish@densitypharmachem.com" },
  "Capricorn": { name: "Pratik Patil", email: "pratik@densitypharmachem.com" },
  "CATO": { 
    name: "Pratisha Dabhane and Kalyan", 
    email: ["pratiksha@densitypharmachem.com", "kalyan@densitypharmachem.com"] 
  },
  "Density": { name: "Dinesh", email: "dinesh@densitypharmachem.com" },
  "Deutero": { name: "Kamal", email: "kamal@densitypharmachem.com" },
  "FD Cell": { name: "Pratik Patil", email: "pratik@densitypharmachem.com" },
  "KANTO": { name: "Ravindra Patil", email: "ravindra@densitypharmachem.com" },
  "Life Science": { name: "Pratik Patil", email: "pratik@densitypharmachem.com" },
  "Trading": { name: "Rama sir", email: "rama@densitypharmachem.com" }
};

// ✅ CORRECTED Target values for FY 2025-26 (in Crores) - Only 10 active categories
const TARGET_SALES_CR_FY_2025_26 = {
  "2025-04": {
    "3A Chemicals": 0.2, BIKAI: 0, CATO: 0.05, "FD Cell": 0, KANTO: 0,
    Capricorn: 0.02, Density: 0.3, Deutero: 1, Trading: 1, "Life Science": 0
  },
  "2025-05": {
    "3A Chemicals": 0.2, BIKAI: 0, CATO: 0.05, "FD Cell": 0, KANTO: 0.04,
    Capricorn: 0.02, Density: 0.3, Deutero: 1, Trading: 1, "Life Science": 0
  },
  "2025-06": {
    "3A Chemicals": 0.3, BIKAI: 0, CATO: 0.05, "FD Cell": 0, KANTO: 0.04,
    Capricorn: 0.02, Density: 0.3, Deutero: 1, Trading: 1, "Life Science": 0
  },
  "2025-07": {
    "3A Chemicals": 0.3, BIKAI: 0.2, CATO: 0.05, "FD Cell": 0.02, KANTO: 0.04,
    Capricorn: 0.02, Density: 0.3, Deutero: 1, Trading: 1, "Life Science": 0
  },
  "2025-08": {
    "3A Chemicals": 0.5, BIKAI: 0.2, CATO: 0.05, "FD Cell": 0.02, KANTO: 0.04,
    Capricorn: 0.02, Density: 0.3, Deutero: 1, Trading: 1, "Life Science": 0
  },
  "2025-09": {
    "3A Chemicals": 0.5, BIKAI: 0.2, CATO: 0.1, "FD Cell": 0.02, KANTO: 0.04,
    Capricorn: 0.02, Density: 0.3, Deutero: 1, Trading: 2, "Life Science": 0
  },
  "2025-10": {
    "3A Chemicals": 0.5, BIKAI: 0.4, CATO: 0.2, "FD Cell": 0.1, KANTO: 0.1,
    Capricorn: 0.04, Density: 0.5, Deutero: 1, Trading: 2, "Life Science": 0
  },
  "2025-11": {
    "3A Chemicals": 0.7, BIKAI: 0.5, CATO: 0.5, "FD Cell": 0.2, KANTO: 0.1,
    Capricorn: 0.1, Density: 0.5, Deutero: 1, Trading: 2, "Life Science": 0
  },
  "2025-12": {
    "3A Chemicals": 0.8, BIKAI: 0.8, CATO: 0.5, "FD Cell": 0.5, KANTO: 0.1,
    Capricorn: 0.1, Density: 1, Deutero: 2, Trading: 2, "Life Science": 0
  },
  "2026-01": {
    "3A Chemicals": 1.2, BIKAI: 0.8, CATO: 0.8, "FD Cell": 0.6, KANTO: 0.3,
    Capricorn: 0.1, Density: 1, Deutero: 2, Trading: 2, "Life Science": 0
  },
  "2026-02": {
    "3A Chemicals": 1.5, BIKAI: 1, CATO: 0.8, "FD Cell": 1, KANTO: 0.3,
    Capricorn: 0.2, Density: 1, Deutero: 2.5, Trading: 2, "Life Science": 0
  },
  "2026-03": {
    "3A Chemicals": 2.0, BIKAI: 1.2, CATO: 1, "FD Cell": 1, KANTO: 0.3,
    Capricorn: 0.2, Density: 1, Deutero: 2.5, Trading: 3, "Life Science": 0
  }
};

// ✅ CORRECTED Target GM percentages - Only 10 active categories
const TARGET_GM_PERCENTAGES = {
  "3A Chemicals": 25,
  "BIKAI": 20,
  "CATO": 30,
  "FD Cell": 25,
  "KANTO": 25,
  "Capricorn": 20,
  "Density": 20,
  "Deutero": 25,
  "Trading": 15,
 
};

// Category mapping (same as in your frontend)
const categoryMapping = {
  Items: "Trading",
  "3A Chemicals": "3A Chemicals",
  Catalyst: "Density",
  Solvent: "Density",
  Polymer: "Density",
  "Fine Chemicals": "Density",
  Reagent: "Density",
  "Biological Buffers": "Life Science",
  Intermediates: "Density",
  API: "CATO",
  "Stable Isotope reagents": "Deutero",
  "Building Blocks": "Density",
  Membranes: "Life Science",
  "Laboratory Containers & Storage": "FD Cell",
  Enzyme: "Life Science",
  Biochemicals: "Life Science",
  "Reference Materials": "KANTO",
  "Secondary Standards": "KANTO",
  Instruments: "BIKAI",
  Services: "NULL",
  "Analytical Standards": "KANTO",
  "Nucleosides and Nucleotides": "Life Science",
  Nitrosamine: "CATO",
  "Pesticide Standards": "CATO",
  Trading: "Trading",
  Carbohydrates: "Life Science",
  "USP Standards": "CATO",
  "EP Standards": "CATO",
  "Indian pharmacopoeia": "CATO",
  "British Pharmacopoeia": "CATO",
  Impurity: "CATO",
  "NMR Solvents": "Deutero",
  "Stable isotopes": "Deutero",
  Glucuronides: "CATO",
  Metabolites: "CATO",
  Capricorn: "Capricorn",
  "Analytical Instruments": "BIKAI",
  "Lab Consumables": "FD Cell",
  "Equipment and Instruments": "BIKAI",
  Ultrapur: "KANTO",
  Dyes: "Density",
  "New Life Biologics": "Life Science",
  "Food Grade": "Life Science",
  "Lab Systems & Fixtures": "BIKAI",
  Peptides: "Life Science",
  "Ultrapur-100": "KANTO",
  "Amino Acids": "Life Science",
  "Cell Culture": "Life Science",
  "Natural Products": "Life Science",
  "Multiple Pharmacopoeia": "CATO",
  "Metal Standard Solutions": "KANTO",
  "High Purity Acids": "KANTO",
  "HPLC consumables": "BIKAI",
  "HPLC configurations": "BIKAI",
  VOLAB: "VOLAB",
  "Life science": "Life Science",
  Kanto: "KANTO",
  "Meatls&materials": "Density"
};

const MONTH_ORDER = [
  { year: 2025, month: 4, name: "April" },
  { year: 2025, month: 5, name: "May" },
  { year: 2025, month: 6, name: "June" },
  { year: 2025, month: 7, name: "July" },
  { year: 2025, month: 8, name: "August" },
  { year: 2025, month: 9, name: "September" },
  { year: 2025, month: 10, name: "October" },
  { year: 2025, month: 11, name: "November" },
  { year: 2025, month: 12, name: "December" },
  { year: 2026, month: 1, name: "January" },
  { year: 2026, month: 2, name: "February" },
  { year: 2026, month: 3, name: "March" }
];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Fetch sales data for all categories for FY 2025-26
    const query = `
      SELECT 
        YEAR(T0.DocDate) AS Year,
        MONTH(T0.DocDate) AS MonthNumber,
        T6.ItmsGrpNam AS Category,
        SUM(T1.LineTotal) AS Sales,
        CASE 
          WHEN SUM(T1.LineTotal) = 0 THEN 0
          ELSE ROUND(
            ((SUM(T1.LineTotal) - SUM(T1.GrossBuyPr * T1.Quantity)) * 100.0) / SUM(T1.LineTotal),
            2
          )
        END AS Margin
      FROM OINV T0
      JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
      JOIN OITM T5 ON T1.ItemCode = T5.ItemCode
      JOIN OITB T6 ON T5.ItmsGrpCod = T6.ItmsGrpCod
      WHERE T0.CANCELED = 'N' 
        AND T0.[IssReason] <> '4'
        AND ((YEAR(T0.DocDate) = 2025 AND MONTH(T0.DocDate) >= 4) 
             OR (YEAR(T0.DocDate) = 2026 AND MONTH(T0.DocDate) <= 3))
      GROUP BY YEAR(T0.DocDate), MONTH(T0.DocDate), T6.ItmsGrpNam
      ORDER BY Year, MonthNumber
    `;

    const salesData = await queryDatabase(query, []);

    // Merge categories
    const mergedData = mergeCategories(salesData);

    // Process data by category
    const categoryData = processByCategoryForEmail(mergedData);

    let successCount = 0;
    let failureCount = 0;

    // Send email for each category
    for (const [category, data] of Object.entries(categoryData)) {
      const salesperson = CATEGORY_SALESPERSON_MAPPING[category];
      
      if (!salesperson) {
        console.warn(`⚠️ No salesperson mapping for category: ${category}`);
        continue;
      }

      try {
        const emailBody = generateEmailBody(category, data, salesperson.name);
        
        const toEmails = Array.isArray(salesperson.email) 
          ? salesperson.email 
          : [salesperson.email];

       
        const emailRes = await fetch(
          `${process.env.API_BASE_URL}/api/email/base_mail`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "sales@densitypharmachem.com",
              to: toEmails,
              // cc: ["rama@densitypharmachem.com", "satish@densitypharmachem.com"],
              bcc: ["chandraprakashyadav1110@gmail.com"],
              subject: `FY 2025-26 Sales Target & Performance - ${category}`,
              body: emailBody,
            }),
          }
        );

        // 🧪 TESTING: Comment this out for production
        // const emailRes = await fetch(
        //   `${process.env.API_BASE_URL}/api/email/base_mail`,
        //   {
        //     method: "POST",
        //     headers: { "Content-Type": "application/json" },
        //     body: JSON.stringify({
        //       from: "prakash@densitypharmachem.com",
        //       to: "chandraprakashyadav1110@gmail.com",
        //       subject: `FY 2025-26 Sales Target & Performance - ${category}`,
        //       body: emailBody,
        //     }),
        //   }
        // );

        const result = await emailRes.json();
        if (!emailRes.ok) {
          throw new Error(result.message || "Failed to send email");
        }

        console.log(`✅ Email sent for category: ${category} to ${toEmails.join(", ")}`);
        successCount++;
      } catch (err) {
        console.error(`❌ Error sending email for ${category}: ${err.message}`);
        failureCount++;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Emails processed. Sent: ${successCount}, Failed: ${failureCount}`,
      successCount,
      failureCount
    });
  } catch (error) {
    console.error("Send Target Email Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

function mergeCategories(rawData) {
  const mergedData = {};

  rawData.forEach((row) => {
    const key = `${row.Year}-${row.MonthNumber}`;

    if (!mergedData[key]) {
      mergedData[key] = {
        Year: row.Year,
        MonthNumber: row.MonthNumber,
      };
    }

    const originalCategory = row.Category;
    const targetCategory = categoryMapping[originalCategory] || "Other";

    if (targetCategory === "NULL") return;

    const salesKey = `${targetCategory}_Sales`;
    const marginKey = `${targetCategory}_Margin`;

    if (!mergedData[key][salesKey]) {
      mergedData[key][salesKey] = 0;
      mergedData[key][marginKey] = 0;
      mergedData[key][`_temp_${targetCategory}`] = { totalWeightedMargin: 0, totalSales: 0 };
    }

    mergedData[key][salesKey] += row.Sales || 0;
    
    const sales = row.Sales || 0;
    const margin = row.Margin || 0;
    mergedData[key][`_temp_${targetCategory}`].totalWeightedMargin += sales * (margin / 100);
    mergedData[key][`_temp_${targetCategory}`].totalSales += sales;
  });

  // Calculate weighted margins
  Object.keys(mergedData).forEach((key) => {
    const row = mergedData[key];
    Object.keys(row).forEach((k) => {
      if (k.startsWith("_temp_")) {
        const category = k.replace("_temp_", "");
        const { totalWeightedMargin, totalSales } = row[k];
        const marginKey = `${category}_Margin`;
        row[marginKey] = totalSales > 0 ? (totalWeightedMargin / totalSales) * 100 : 0;
        delete row[k];
      }
    });
  });

  return Object.values(mergedData);
}

function processByCategoryForEmail(mergedData) {
  const categoryData = {};
  
  const categories = Object.keys(CATEGORY_SALESPERSON_MAPPING);
  
  categories.forEach(category => {
    categoryData[category] = {
      totalTarget: 0,
      totalSales: 0,
      totalWeightedMargin: 0,
      percentageAchieved: 0,
      months: []
    };

    MONTH_ORDER.forEach(monthInfo => {
      const monthKey = `${monthInfo.year}-${String(monthInfo.month).padStart(2, "0")}`;
      const targetCr = TARGET_SALES_CR_FY_2025_26[monthKey]?.[category] || 0;
      const targetGM = TARGET_GM_PERCENTAGES[category] || 20;

      // Find sales data for this month
      const monthData = mergedData.find(
        d => d.Year === monthInfo.year && d.MonthNumber === monthInfo.month
      );

      const sales = monthData ? (monthData[`${category}_Sales`] || 0) : 0;
      const margin = monthData ? (monthData[`${category}_Margin`] || 0) : 0;

      categoryData[category].months.push({
        year: monthInfo.year,
        month: monthInfo.name,
        targetCr: targetCr,
        salesCr: sales / 10000000, // Convert to Crores
        gmPercent: sales > 0 ? margin.toFixed(2) : "-",
        targetGM: targetGM
      });

      categoryData[category].totalTarget += targetCr;
      categoryData[category].totalSales += sales;
      if (sales > 0) {
        categoryData[category].totalWeightedMargin += sales * (margin / 100);
      }
    });

    // Calculate percentage achieved
    const totalTargetInRupees = categoryData[category].totalTarget * 10000000;
    categoryData[category].percentageAchieved = totalTargetInRupees > 0 
      ? ((categoryData[category].totalSales / totalTargetInRupees) * 100).toFixed(2)
      : 0;

    // Calculate overall GM
    categoryData[category].overallGM = categoryData[category].totalSales > 0
      ? ((categoryData[category].totalWeightedMargin / categoryData[category].totalSales) * 100).toFixed(2)
      : 0;
  });

  return categoryData;
}

// function generateEmailBody(category, data, salesPersonName) {
//   const targetGM = TARGET_GM_PERCENTAGES[category] || 20;
  
//   // Calculate totals for the final row
//   let totalTargetSum = 0;
//   let totalSalesSum = 0;
//   let totalWeightedMarginSum = 0;
//   let totalSalesForGM = 0;
  
//   // Generate monthly rows with quarterly summaries
//   let tableRows = '';
//   let quarterData = { target: 0, sales: 0, weightedMargin: 0, totalSales: 0 };
//   const quarterMonths = [3, 6, 9, 12]; // Indices where quarters end
  
//   data.months.forEach((month, index) => {
//     const salesDisplay = month.salesCr > 0 ? `₹${month.salesCr.toFixed(2)} Cr` : "-";
//     const gmDisplay = month.gmPercent !== "-" ? `${month.gmPercent}%` : "-";
    
//     // Accumulate quarter data
//     quarterData.target += month.targetCr;
//     quarterData.sales += month.salesCr;
//     if (month.salesCr > 0 && month.gmPercent !== "-") {
//       quarterData.weightedMargin += month.salesCr * parseFloat(month.gmPercent);
//       quarterData.totalSales += month.salesCr;
//     }
    
//     // Accumulate totals for final row
//     totalTargetSum += month.targetCr;
//     totalSalesSum += month.salesCr;
//     if (month.salesCr > 0 && month.gmPercent !== "-") {
//       totalWeightedMarginSum += month.salesCr * parseFloat(month.gmPercent);
//       totalSalesForGM += month.salesCr;
//     }
    
//     // Add monthly row
//     tableRows += `
//       <tr>
//         <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">${month.year}</td>
//         <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">${month.month}</td>
//         <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right;">₹${month.targetCr.toFixed(2)} Cr</td>
//         <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right;">${salesDisplay}</td>
//         <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">${gmDisplay}</td>
//       </tr>
//     `;
    
//     // Add quarter summary row after every 3 months
//     if (quarterMonths.includes(index + 1)) {
//       const quarterNum = quarterMonths.indexOf(index + 1) + 1;
//       const quarterGM = quarterData.totalSales > 0 
//         ? (quarterData.weightedMargin / quarterData.totalSales).toFixed(2) 
//         : "-";
//       const quarterSalesDisplay = quarterData.sales > 0 ? `₹${quarterData.sales.toFixed(2)} Cr` : "-";
      
//       tableRows += `
//         <tr style="background-color: #86efac; font-weight: 600;">
//           <td style="padding: 10px; border: 1px solid #ffffff; text-align: center;" colspan="2">Q${quarterNum} Total</td>
//           <td style="padding: 10px; border: 1px solid #ffffff; text-align: right; color: #065f46;">₹${quarterData.target.toFixed(2)} Cr</td>
//           <td style="padding: 10px; border: 1px solid #ffffff; text-align: right; color: #065f46;">${quarterSalesDisplay}</td>
//           <td style="padding: 10px; border: 1px solid #ffffff; text-align: center; color: #065f46;">${quarterGM}%</td>
//         </tr>
//       `;
      
//       // Reset quarter data
//       quarterData = { target: 0, sales: 0, weightedMargin: 0, totalSales: 0 };
//     }
//   });
  
//   // Add final TOTAL row
//   const totalGM = totalSalesForGM > 0 
//     ? (totalWeightedMarginSum / totalSalesForGM).toFixed(2) 
//     : "-";
//   const totalSalesDisplay = totalSalesSum > 0 ? `₹${totalSalesSum.toFixed(2)} Cr` : "-";
  
//   tableRows += `
//     <tr style="background-color: #15803d; color: white; font-weight: bold; font-size: 1.05em;">
//       <td style="padding: 12px; border: 1px solid #ffffff; text-align: center;" colspan="2">TOTAL</td>
//       <td style="padding: 12px; border: 1px solid #ffffff; text-align: right;">₹${totalTargetSum.toFixed(2)} Cr</td>
//       <td style="padding: 12px; border: 1px solid #ffffff; text-align: right;">${totalSalesDisplay}</td>
//       <td style="padding: 12px; border: 1px solid #ffffff; text-align: center;">${totalGM}%</td>
//     </tr>
//   `;

//   return `
//     <div style="font-family: Arial, sans-serif; color: #374151;">
//       <p>Dear ${salesPersonName},</p>
      
//       <p>The target for the <strong>${category}</strong> category for <strong>FY 2025-26</strong> is <strong>₹${data.totalTarget.toFixed(2)} Cr</strong>. Out of which <strong>${data.percentageAchieved}%</strong> is achieved.</p>
      
//       <p><strong>Below is the monthly breakdown:</strong></p>
      
//       <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
//         <thead style="background-color: #15803d; color: white;">
//           <tr>
//             <th style="padding: 12px; border: 1px solid #ffffff; text-align: center;">Year</th>
//             <th style="padding: 12px; border: 1px solid #ffffff; text-align: center;">Month</th>
//             <th style="padding: 12px; border: 1px solid #ffffff; text-align: center;">Target (in Cr)</th>
//             <th style="padding: 12px; border: 1px solid #ffffff; text-align: center;">Sales (in Cr)</th>
//             <th style="padding: 12px; border: 1px solid #ffffff; text-align: center;">GM %</th>
//           </tr>
//         </thead>
//         <tbody>
//           ${tableRows}
//         </tbody>
//       </table>
      
//       <p><strong>Overall Performance Summary:</strong></p>
//       <ul>
//         <li>Total Target: ₹${data.totalTarget.toFixed(2)} Cr</li>
//         <li>Total Sales: ₹${(data.totalSales / 10000000).toFixed(2)} Cr</li>
//         <li>Achievement: ${data.percentageAchieved}%</li>
//         <li>Target GM: ${targetGM}%</li>
//         <li>Achieved GM: ${data.overallGM}%</li>
//       </ul>
      
//       <p>Thank you for your continued efforts and dedication.</p>
      
//       <br/>
//       <p><strong>Best Regards,</strong><br/>
      
//       Density Pharmachem Private Limited</p>
//     </div>
//   `;
// }


function generateEmailBody(category, data, salesPersonName) {
  const targetGM = TARGET_GM_PERCENTAGES[category] || 20;
  
  // Calculate totals for the final row
  let totalTargetSum = 0;
  let totalSalesSum = 0;
  let totalWeightedMarginSum = 0;
  let totalSalesForGM = 0;
  
  // Generate monthly rows with quarterly summaries
  let tableRows = '';
  let quarterData = { target: 0, sales: 0, weightedMargin: 0, totalSales: 0 };
  const quarterMonths = [3, 6, 9, 12]; // Indices where quarters end
  
  data.months.forEach((month, index) => {
    const salesDisplay = month.salesCr > 0 ? `₹${month.salesCr.toFixed(2)} Cr` : "-";
    const gmDisplay = month.gmPercent !== "-" ? `${month.gmPercent}%` : "-";
    
    // Accumulate quarter data
    quarterData.target += month.targetCr;
    quarterData.sales += month.salesCr;
    if (month.salesCr > 0 && month.gmPercent !== "-") {
      quarterData.weightedMargin += month.salesCr * parseFloat(month.gmPercent);
      quarterData.totalSales += month.salesCr;
    }
    
    // Accumulate totals for final row
    totalTargetSum += month.targetCr;
    totalSalesSum += month.salesCr;
    if (month.salesCr > 0 && month.gmPercent !== "-") {
      totalWeightedMarginSum += month.salesCr * parseFloat(month.gmPercent);
      totalSalesForGM += month.salesCr;
    }
    
    // Add monthly row
    tableRows += `
      <tr>
        <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">${month.year}</td>
        <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">${month.month}</td>
        <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right;">₹${month.targetCr.toFixed(2)} Cr</td>
        <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right;">${salesDisplay}</td>
        <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">${gmDisplay}</td>
      </tr>
    `;
    
    // Add quarter summary row after every 3 months
    if (quarterMonths.includes(index + 1)) {
      const quarterNum = quarterMonths.indexOf(index + 1) + 1;
      const quarterGM = quarterData.totalSales > 0 
        ? (quarterData.weightedMargin / quarterData.totalSales).toFixed(2) 
        : "-";
      const quarterSalesDisplay = quarterData.sales > 0 ? `₹${quarterData.sales.toFixed(2)} Cr` : "-";
      
      tableRows += `
        <tr style="background-color: #86efac; font-weight: 600;">
          <td style="padding: 10px; border: 1px solid #ffffff; text-align: center;" colspan="2">Q${quarterNum} Total</td>
          <td style="padding: 10px; border: 1px solid #ffffff; text-align: right; color: #065f46;">₹${quarterData.target.toFixed(2)} Cr</td>
          <td style="padding: 10px; border: 1px solid #ffffff; text-align: right; color: #065f46;">${quarterSalesDisplay}</td>
          <td style="padding: 10px; border: 1px solid #ffffff; text-align: center; color: #065f46;">${quarterGM}%</td>
        </tr>
      `;
      
      // Reset quarter data
      quarterData = { target: 0, sales: 0, weightedMargin: 0, totalSales: 0 };
    }
  });
  
  // Add final TOTAL row
  const totalGM = totalSalesForGM > 0 
    ? (totalWeightedMarginSum / totalSalesForGM).toFixed(2) 
    : "-";
  const totalSalesDisplay = totalSalesSum > 0 ? `₹${totalSalesSum.toFixed(2)} Cr` : "-";
  
  tableRows += `
    <tr style="background-color: #15803d; color: white; font-weight: bold; font-size: 1.05em;">
      <td style="padding: 12px; border: 1px solid #ffffff; text-align: center;" colspan="2">TOTAL</td>
      <td style="padding: 12px; border: 1px solid #ffffff; text-align: right;">₹${totalTargetSum.toFixed(2)} Cr</td>
      <td style="padding: 12px; border: 1px solid #ffffff; text-align: right;">${totalSalesDisplay}</td>
      <td style="padding: 12px; border: 1px solid #ffffff; text-align: center;">${totalGM}%</td>
    </tr>
  `;

  return `
    <div style="font-family: Arial, sans-serif; color: #374151;">
      <p>Dear ${salesPersonName},</p>
      
      <p>The target for the <strong>${category}</strong> category for <strong>FY 2025-26</strong> is <strong>₹${data.totalTarget.toFixed(2)} Cr</strong>. Out of which <strong>${data.percentageAchieved}%</strong> is achieved.</p>
      
      <p><strong>Below is the monthly breakdown:</strong></p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead style="background-color: #15803d; color: white;">
          <tr>
            <th style="padding: 12px; border: 1px solid #ffffff; text-align: center;">Year</th>
            <th style="padding: 12px; border: 1px solid #ffffff; text-align: center;">Month</th>
            <th style="padding: 12px; border: 1px solid #ffffff; text-align: center;">Target (in Cr)</th>
            <th style="padding: 12px; border: 1px solid #ffffff; text-align: center;">Sales (in Cr)</th>
            <th style="padding: 12px; border: 1px solid #ffffff; text-align: center;">GM% (Target GM: ${targetGM}%)</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      
      <p><strong>Overall Performance Summary:</strong></p>
      <ul>
        <li>Total Target: ₹${data.totalTarget.toFixed(2)} Cr</li>
        <li>Total Sales: ₹${(data.totalSales / 10000000).toFixed(2)} Cr</li>
        <li>Achievement: ${data.percentageAchieved}%</li>
        <li>Target GM: ${targetGM}%</li>
        <li>Achieved GM: ${data.overallGM}%</li>
      </ul>
      
      <p>Thank you for your continued efforts and dedication.</p>
      
      <br/>
      <p><strong>Best Regards,</strong><br/>
      Density Pharmachem Private Limited</p>
    </div>
  `;
}