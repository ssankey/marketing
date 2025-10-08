

// api/inbound/create.js
import { queryDatabase } from "../../../lib/db";
import sql from "mssql";
import fs from "fs";
import path from "path";
import { promisify } from 'util';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const access = promisify(fs.access);

export const config = {
  api: { bodyParser: { sizeLimit: "50mb" } },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const {
      formData,
      remarksData,
      attachmentFiles,
    } = req.body;

    const boeNo = formData.boeSbNo;
    if (!boeNo) {
      return res.status(400).json({ error: "BOE/SB No is required" });
    }

    // Check if BOE number already exists
    const checkQuery = `SELECT COUNT(*) as count FROM ImportExportRecords WHERE BOESBNo = @BOESBNo`;
    const checkResult = await queryDatabase(checkQuery, [
      { name: "BOESBNo", type: sql.NVarChar(100), value: boeNo }
    ]);

    if (checkResult[0].count > 0) {
      return res.status(409).json({ 
        error: "Duplicate BOE/SB Number", 
        message: `BOE/SB Number "${boeNo}" already exists in the system. Please use a different BOE/SB Number.`
      });
    }

    // Save attachments to network path
    const baseDir = process.env.IMPORT_EXPORT_NETWORK_PATH;
    const folderPath = path.join(baseDir, boeNo);

    console.log(`Attempting to create directory: ${folderPath}`);

    try {
      await access(folderPath);
      console.log(`Directory already exists: ${folderPath}`);
    } catch (error) {
      console.log(`Directory doesn't exist, creating: ${folderPath}`);
      try {
        await mkdir(folderPath, { recursive: true });
        console.log(`Successfully created directory: ${folderPath}`);
      } catch (createError) {
        console.error(`Failed to create directory: ${folderPath}`, createError);
        throw new Error(`Failed to create directory on network path: ${createError.message}`);
      }
    }

    const attachmentInserts = [];

    // Process and save files
    for (const [fieldKey, files] of Object.entries(attachmentFiles || {})) {
      for (let idx = 0; idx < files.length; idx++) {
        const file = files[idx];
        const ext = path.extname(file.name) || ".dat";
        const safeName = `${fieldKey}_attachment_${idx + 1}${ext}`;
        const savePath = path.join(folderPath, safeName);

        try {
          const fileBuffer = Buffer.from(file.content, "base64");
          await writeFile(savePath, fileBuffer);
          console.log(`Successfully saved file: ${savePath}`);

          attachmentInserts.push({
            FieldKey: fieldKey,
            FileLink: savePath,
          });
        } catch (writeError) {
          console.error(`Failed to save file: ${savePath}`, writeError);
          throw new Error(`Failed to save attachment file: ${writeError.message}`);
        }
      }
    }

    // Insert into ImportExportRecords
    const insertParams = [
      { name: "BOESBNo", type: sql.NVarChar(100), value: boeNo },

      { name: "Vendor", type: sql.NVarChar(255), value: formData.vendor || null },
      { name: "VendorRemarks", type: sql.NVarChar(500), value: remarksData.vendor || null },

      { name: "Name", type: sql.NVarChar(255), value: formData.name || null },
      { name: "NameRemarks", type: sql.NVarChar(500), value: remarksData.name || null },

      { name: "Country", type: sql.NVarChar(100), value: formData.country || null },
      { name: "CountryRemarks", type: sql.NVarChar(500), value: remarksData.country || null },

      { name: "ProductCategory", type: sql.NVarChar(255), value: formData.productCategory || null },
      { name: "ProductCategoryRemarks", type: sql.NVarChar(500), value: remarksData.productCategory || null },

      { name: "ProductOwners", type: sql.NVarChar(255), value: formData.productOwners || null },
      { name: "ProductOwnersRemarks", type: sql.NVarChar(500), value: remarksData.productOwners || null },

      { name: "Attachments", type: sql.NVarChar(sql.MAX), value: null },
      { name: "AttachmentsRemarks", type: sql.NVarChar(500), value: remarksData.attachments || null },

      { name: "PreAlertFormSupplier", type: sql.NVarChar(255), value: formData.preAlertFormSupplier || null },
      { name: "PreAlertFormSupplierRemarks", type: sql.NVarChar(500), value: remarksData.preAlertFormSupplier || null },

      { name: "SupplierInvoiceNumber", type: sql.NVarChar(100), value: formData.supplierInvoiceNumber || null },
      { name: "SupplierInvoiceNumberRemarks", type: sql.NVarChar(500), value: remarksData.supplierInvoiceNumber || null },

      { name: "Date", type: sql.Date, value: formData.date || null },
      { name: "DateRemarks", type: sql.NVarChar(500), value: remarksData.date || null },

      { name: "InvoiceValue", type: sql.Decimal(18, 2), value: formData.invoiceValue || null },
      { name: "InvoiceValueRemarks", type: sql.NVarChar(500), value: remarksData.invoiceValue || null },

      { name: "Currency", type: sql.NVarChar(10), value: formData.currency || null },
      { name: "CurrencyRemarks", type: sql.NVarChar(500), value: remarksData.currency || null },

      { name: "PortOfLanding", type: sql.NVarChar(255), value: formData.portOfLanding || null },
      { name: "PortOfLandingRemarks", type: sql.NVarChar(500), value: remarksData.portOfLanding || null },

      { name: "TypeBOE", type: sql.NVarChar(50), value: formData.typeBOE || null },
      { name: "TypeBOERemarks", type: sql.NVarChar(500), value: remarksData.typeBOE || null },

      { name: "DocumentsSentToCHADate", type: sql.Date, value: formData.documentssentToCHADate || null },
      { name: "DocumentsSentToCHADateRemarks", type: sql.NVarChar(500), value: remarksData.documentssentToCHADate || null },

      { name: "CHAName", type: sql.NVarChar(255), value: formData.chaName || null },
      { name: "CHANameRemarks", type: sql.NVarChar(500), value: remarksData.chaName || null },

      { name: "SentDate", type: sql.Date, value: formData.sentDate || null },
      { name: "SentDateRemarks", type: sql.NVarChar(500), value: remarksData.sentDate || null },

      { name: "MAWBHAWBCombined", type: sql.NVarChar(100), value: formData.mawbHawb || null },
      { name: "MAWBHAWBCombinedRemarks", type: sql.NVarChar(500), value: remarksData.mawbHawb || null },

      { name: "MAWBHAWBDate", type: sql.Date, value: formData.mawbHawbDate || null },
      { name: "MAWBHAWBDateRemarks", type: sql.NVarChar(500), value: remarksData.mawbHawbDate || null },

      { name: "LandingDate", type: sql.Date, value: formData.landingDate || null },
      { name: "LandingDateRemarks", type: sql.NVarChar(500), value: remarksData.landingDate || null },

      { name: "PKG", type: sql.NVarChar(100), value: formData.pkg || null },
      { name: "PKGRemarks", type: sql.NVarChar(500), value: remarksData.pkg || null },

      { name: "Weight", type: sql.NVarChar(100), value: formData.weight || null },
      { name: "WeightRemarks", type: sql.NVarChar(500), value: remarksData.weight || null },

      { name: "BOESBNoRemarks", type: sql.NVarChar(500), value: remarksData.boeSbNo || null },

      { name: "BOEDT", type: sql.Date, value: formData.boeDt || null },
      { name: "BOEDTRemarks", type: sql.NVarChar(500), value: remarksData.boeDt || null },

      { name: "AV", type: sql.NVarChar(100), value: formData.av || null },
      { name: "AVRemarks", type: sql.NVarChar(500), value: remarksData.av || null },

      { name: "Duty", type: sql.Decimal(18, 2), value: formData.duty || null },
      { name: "DutyRemarks", type: sql.NVarChar(500), value: remarksData.duty || null },

      { name: "DutyPaidDate", type: sql.Date, value: formData.dutyPaidDate || null },
      { name: "DutyPaidDateRemarks", type: sql.NVarChar(500), value: remarksData.dutyPaidDate || null },

      { name: "Status", type: sql.NVarChar(100), value: formData.status || null },
      { name: "StatusRemarks", type: sql.NVarChar(500), value: remarksData.status || null },

      { name: "ClearedDate", type: sql.Date, value: formData.clearedDate || null },
      { name: "ClearedDateRemarks", type: sql.NVarChar(500), value: remarksData.clearedDate || null },

      { name: "DeliveryDate", type: sql.Date, value: formData.deliveryDate || null },
      { name: "DeliveryDateRemarks", type: sql.NVarChar(500), value: remarksData.deliveryDate || null },
    ];

    const insertQuery = `
      INSERT INTO ImportExportRecords (
        BOESBNo, Vendor, VendorRemarks, Name, NameRemarks, Country, CountryRemarks,
        ProductCategory, ProductCategoryRemarks, ProductOwners, ProductOwnersRemarks,
        Attachments, AttachmentsRemarks, PreAlertFormSupplier, PreAlertFormSupplierRemarks,
        SupplierInvoiceNumber, SupplierInvoiceNumberRemarks, Date, DateRemarks,
        InvoiceValue, InvoiceValueRemarks, Currency, CurrencyRemarks, PortOfLanding, PortOfLandingRemarks,
        TypeBOE, TypeBOERemarks, DocumentsSentToCHADate, DocumentsSentToCHADateRemarks,
        CHAName, CHANameRemarks, SentDate, SentDateRemarks, [MAWB / HAWB], [MAWB / HAWB Remarks],
        MAWBHAWBDate, MAWBHAWBDateRemarks, LandingDate, LandingDateRemarks,
        PKG, PKGRemarks, Weight, WeightRemarks, BOESBNoRemarks, BOEDT, BOEDTRemarks,
        AV, AVRemarks, Duty, DutyRemarks, DutyPaidDate, DutyPaidDateRemarks,
        Status, StatusRemarks, ClearedDate, ClearedDateRemarks, DeliveryDate, DeliveryDateRemarks,
        CreatedAt
      ) VALUES (
        @BOESBNo, @Vendor, @VendorRemarks, @Name, @NameRemarks, @Country, @CountryRemarks,
        @ProductCategory, @ProductCategoryRemarks, @ProductOwners, @ProductOwnersRemarks,
        @Attachments, @AttachmentsRemarks, @PreAlertFormSupplier, @PreAlertFormSupplierRemarks,
        @SupplierInvoiceNumber, @SupplierInvoiceNumberRemarks, @Date, @DateRemarks,
        @InvoiceValue, @InvoiceValueRemarks, @Currency, @CurrencyRemarks, @PortOfLanding, @PortOfLandingRemarks,
        @TypeBOE, @TypeBOERemarks, @DocumentsSentToCHADate, @DocumentsSentToCHADateRemarks,
        @CHAName, @CHANameRemarks, @SentDate, @SentDateRemarks, @MAWBHAWBCombined, @MAWBHAWBCombinedRemarks,
        @MAWBHAWBDate, @MAWBHAWBDateRemarks, @LandingDate, @LandingDateRemarks,
        @PKG, @PKGRemarks, @Weight, @WeightRemarks, @BOESBNoRemarks, @BOEDT, @BOEDTRemarks,
        @AV, @AVRemarks, @Duty, @DutyRemarks, @DutyPaidDate, @DutyPaidDateRemarks,
        @Status, @StatusRemarks, @ClearedDate, @ClearedDateRemarks, @DeliveryDate, @DeliveryDateRemarks,
        GETDATE()
      )
    `;

    await queryDatabase(insertQuery, insertParams);

    // Insert into ImportExportAttachments
    for (const att of attachmentInserts) {
      await queryDatabase(
        `INSERT INTO ImportExportAttachments (BOESBNo, FieldKey, FileLink, UploadedAt)
         VALUES (@BOESBNo, @FieldKey, @FileLink, GETDATE())`,
        [
          { name: "BOESBNo", type: sql.NVarChar(100), value: boeNo },
          { name: "FieldKey", type: sql.NVarChar(100), value: att.FieldKey },
          { name: "FileLink", type: sql.NVarChar(500), value: att.FileLink },
        ]
      );
    }

    res.status(200).json({ 
      success: true, 
      message: "Record and attachments saved successfully to network path",
      folderPath: folderPath,
      attachmentCount: attachmentInserts.length
    });
  } catch (err) {
    console.error("Error saving inbound record:", err);
    
    // Check if it's a duplicate key error (as a fallback)
    if (err.message && err.message.includes("duplicate key")) {
      return res.status(409).json({ 
        error: "Duplicate BOE/SB Number", 
        message: `BOE/SB Number already exists in the system. Please use a different BOE/SB Number.`
      });
    }
    
    res.status(500).json({ 
      error: "Internal Server Error", 
      details: err.message,
      message: "Failed to save files to network path. Please check network connectivity and permissions."
    });
  }
}