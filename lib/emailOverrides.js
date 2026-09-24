// lib/emailOverrides.js
// Customer-specific extra "To" recipients — layered on top of whatever the
// existing To/CC/BCC logic in each mail flow already resolves (that logic
// is untouched), for both the order-confirmation and dispatch emails.
// Requested directly per CardCode.

export const ADDITIONAL_TO_BY_CARDCODE = {
  C000072: [
    "dipti.ranjan@jubilantbiosys.com",
    "vikram.kumar1@jubilantbiosys.com",
    "Sandeep.Yadav1@jubilantbiosys.com",
    "Akshay.chaudhary@jubilantbiosys.com",
    "Pramod.Rampure@jubilantbiosys.com",
    "store.biosysnoida@jubilantbiosys.com",
  ],
};

export const getAdditionalToEmails = (cardCode) => ADDITIONAL_TO_BY_CARDCODE[cardCode] || [];

// Builds the final To list: the normal recipient(s) plus any per-CardCode
// additions, deduped (case-insensitive) so an address already present isn't
// repeated.
export const buildToList = (baseToEmails, cardCode) => {
  const base = Array.isArray(baseToEmails) ? baseToEmails : [baseToEmails];
  const extra = getAdditionalToEmails(cardCode);
  const seen = new Set();
  const result = [];
  for (const email of [...base, ...extra]) {
    if (!email) continue;
    const key = email.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(email);
  }
  return result;
};
