// utils/fieldConfig.js

// Updated field labels - removed Attachments, updated date field names, commented out Sent date
export const fieldLabels = [
  'Vendor',
  'Name',
  'Country',
  'Product Category',
  'Product Owners',
  'Pre Alert from Supplier Date',
  'Supplier Invoice Number',
  'Supplier Invoice Number Date',
  'Invoice Value',
  'Currency',
  'Port of Landing',
  'TYPE BOE',
  'Documents sent to CHA-Date',
  'CHA Name',
  // 'Sent date', // Commented out - handled by backend logic
  'MAWB/HAWB',
  'MAWB/HAWB Date',
  'Landing Date',
  'PKG',
  'WEIGHT',
  'BOE/SB NO',
  'BOE DT',
  'AV',
  'Duty',
  'Duty Paid date',
  'Status',
  'Cleared Date at Density',
  'Delivery Date at Density'
];

export const fieldKeys = [
  'vendor',
  'name',
  'country',
  'productCategory',
  'productOwners',
  'preAlertFormSupplier',
  'supplierInvoiceNumber',
  'supplierInvoiceNumberDate',
  'invoiceValue',
  'currency',
  'portOfLanding',
  'typeBOE',
  'documentssentToCHADate',
  'chaName',
  // 'sentDate', // Commented out - handled by backend logic
  'mawbHawb',
  'mawbHawbDate',
  'landingDate',
  'pkg',
  'weight',
  'boeSbNo',
  'boeDt',
  'av',
  'duty',
  'dutyPaidDate',
  'status',
  'clearedDate',
  'deliveryDate'
];