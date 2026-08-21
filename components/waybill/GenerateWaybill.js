
// components/waybill/GenerateWaybill.js
import { useState } from "react";
import s from "./GenerateWaybill.module.css";

const TODAY = new Date().toISOString().split("T")[0];

const SHIPPER_DEFAULTS_SANDBOX = {
  CustomerName: "Density Pharmachem", CustomerCode: "099960", OriginArea: "HYD",
  CustomerAddress1: "Density Pharmachem Pvt Ltd", CustomerAddress2: "Sy No 615/A & 624/2/1",
  CustomerAddress3: "Pudur Village, Medchal", CustomerPincode: "501401",
  CustomerMobile: "9705593888", CustomerTelephone: "9705593888",
  CustomerEmailID: "manikanth@densitypharmachem.com", CustomerGSTNumber: "",
  Sender: "Manikanth", VendorCode: "099960", IsToPayCustomer: false,
};
const SHIPPER_DEFAULTS_PRODUCTION = {
  CustomerName: "Density Pharmachem", CustomerCode: "070814", OriginArea: "HYD",
  CustomerAddress1: "Density Pharmachem Pvt Ltd", CustomerAddress2: "Sy No 615/A & 624/2/1",
  CustomerAddress3: "Pudur Village, Medchal", CustomerPincode: "501401",
  CustomerMobile: "9705593888", CustomerTelephone: "9705593888",
  CustomerEmailID: "manikanth@densitypharmachem.com", CustomerGSTNumber: "",
  Sender: "Manikanth", VendorCode: "070814", IsToPayCustomer: false,
};
// ✅ SWITCH HERE
// const ACTIVE_ENV      = "sandbox";
const ACTIVE_ENV      = "production";
const SHIPPER_DEFAULTS = ACTIVE_ENV === "production" ? SHIPPER_DEFAULTS_PRODUCTION : SHIPPER_DEFAULTS_SANDBOX;

const RETURN_DEFAULTS = {
  ReturnAddress1: "Density Pharmachem Pvt Ltd", ReturnAddress2: "Sy No 615/A & 624/2/1",
  ReturnAddress3: "Pudur Village, Medchal", ReturnPincode: "501401",
  ReturnContact: "Manikanth", ReturnMobile: "9705593888", ReturnTelephone: "9705593888",
  ReturnEmailID: "manikanth@densitypharmachem.com", ManifestNumber: "",
  ReturnLatitude: "", ReturnLongitude: "", ReturnAddressinfo: "", ReturnMaskedContactNumber: "",
};

function toBluedartDate(d) { return d ? `/Date(${new Date(d).getTime()})/` : ""; }

function emptyItem(invoiceNo = "", invoiceDate = TODAY) {
  return {
    ItemID: "", ItemName: "", ItemValue: "", TotalValue: "", Itemquantity: "1",
    InvoiceNumber: invoiceNo, InvoiceDate: invoiceDate,
    SellerName: SHIPPER_DEFAULTS.CustomerName, SellerGSTNNumber: "", ProductDesc1: "",
    ProductDesc2: "", PlaceofSupply: "", countryOfOrigin: "IN", docType: "INV",
    subSupplyType: "1", supplyType: "0", CGSTAmount: "0", SGSTAmount: "0",
    IGSTAmount: "0", IGSTRate: "0", TaxableAmount: "0", cessAmount: "0.0",
    HSCode: "", SKUNumber: "", Instruction: "", ReturnReason: "",
  };
}

function CollapsibleSection({ icon, title, subtitle, tag, tagColor = "blue", colorKey = "consignee", defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={s.colSection}>
      <div className={`${s.colHeader} ${s[`colHeader_${colorKey}`]}`} onClick={() => setOpen(!open)}>
        <span className={s.colIcon}>{icon}</span>
        <div className={s.colTitleGroup}>
          <span className={s.colTitle}>{title}</span>
          {subtitle && <span className={s.colSubtitle}>{subtitle}</span>}
        </div>
        {tag && <span className={`${s.colTag} ${s[`tag_${tagColor}`]}`}>{tag}</span>}
        <span className={`${s.colChevron} ${open ? s.colChevronOpen : ""}`}>
          <i className="ti ti-chevron-down" aria-hidden="true" />
        </span>
      </div>
      {open && <div className={s.colBody}>{children}</div>}
    </div>
  );
}

function Field({ label, required, hint, span, children }) {
  return (
    <div className={s.field} style={span ? { gridColumn: `span ${span}` } : {}}>
      <label className={s.fieldLabel}>{label}{required && <span className={s.req}> *</span>}</label>
      {children}
      {hint && <span className={s.fieldHint}>{hint}</span>}
    </div>
  );
}

function Inp({ value, onChange, placeholder, readOnly, type = "text", min, step, maxLength, error }) {
  return (
    <input type={type} min={min} step={step} maxLength={maxLength}
      className={`${s.input} ${readOnly ? s.inputReadonly : ""} ${error ? s.inputError : ""}`}
      value={value ?? ""} onChange={onChange} placeholder={placeholder} readOnly={readOnly} />
  );
}

function Sel({ value, onChange, children }) {
  return <select className={s.input} value={value ?? ""} onChange={onChange}>{children}</select>;
}

export default function GenerateWaybill() {
  // ── Mode toggle ───────────────────────────────────────────────────────────
  const [multiMode, setMultiMode] = useState(false);

  // Single mode
  const [invoiceNo, setInvoiceNo]   = useState("");

  // Multi mode — default 3 rows
  const [invoiceNos, setInvoiceNos] = useState(["", "", ""]);

  const [fetching, setFetching]     = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [selected, setSelected]     = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const [consignee, setConsignee] = useState({
    ConsigneeName: "", ConsigneeAddress1: "", ConsigneeAddress2: "", ConsigneeAddress3: "",
    ConsigneePincode: "", ConsigneeMobile: "", ConsigneeAttention: "", ConsigneeTelephone: "",
    ConsigneeEmailID: "", ConsigneeGSTNumber: "", ConsigneeAddressType: "", ConsigneeAddressinfo: "",
    ConsigneeFullAddress: "", ConsigneeLatitude: "", ConsigneeLongitude: "",
    ConsigneeMaskedContactNumber: "", AvailableDays: "", AvailableTiming: "",
  });
  const [shipper, setShipper]     = useState({ ...SHIPPER_DEFAULTS });
  const [services, setServices]   = useState({
    ProductCode: "E", ProductType: "2", SubProductCode: "", PieceCount: "1",
    ActualWeight: "", DeclaredValue: "", CreditReferenceNo: "", CreditReferenceNo2: "",
    CreditReferenceNo3: "", PickupDate: TODAY, PickupTime: "1600", InvoiceNo: "",
    ItemCount: "0", CollectableAmount: "0", SpecialInstruction: "", AWBNo: "",
    OTPBasedDelivery: "0", OTPCode: "", PackType: "", ParcelShopCode: "",
    PickupMode: "", PickupType: "", DeliveryTimeSlot: "", PreferredPickupTimeSlot: "",
    Officecutofftime: "", FavouringName: "", PayableAt: "", ForwardAWBNo: "",
    ForwardLogisticCompName: "", InsurancePaidBy: "", IsChequeDD: "",
    noOfDCGiven: "0", TotalCashPaytoCustomer: "0", DeferredDeliveryDays: "0",
    RegisterPickup: true,
     PDFOutputNotRequired: false, IsDedicatedDeliveryNetwork: false,
    IsReversePickup: false, IsForcePickup: false, IsPartialPickup: false, ProductFeature: "",
  });
  const [dimensions, setDimensions] = useState([{ Length: "", Breadth: "", Height: "", Count: "1" }]);
  const [commodity, setCommodity]   = useState({ CommodityDetail1: "", CommodityDetail2: "", CommodityDetail3: "" });
  const [itemdtl, setItemdtl]       = useState([emptyItem()]);
  const [returnAddr, setReturnAddr] = useState({ ...RETURN_DEFAULTS });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState(null);
  const [sapUpdated, setSapUpdated] = useState(false);
  const [error, setError]           = useState("");

 

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

  const sc   = (k) => (e) => { setConsignee(p => ({ ...p, [k]: e.target.value })); setFieldErrors(p => ({ ...p, [k]: false })); };
  const ss   = (k) => (e) => setShipper(p  => ({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const ssv  = (k) => (e) => { setServices(p => ({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value })); setFieldErrors(p => ({ ...p, [k]: false })); };
  const sr   = (k) => (e) => setReturnAddr(p => ({ ...p, [k]: e.target.value }));
  const scom = (k) => (e) => setCommodity(p  => ({ ...p, [k]: e.target.value }));
  const sdim = (i, k) => (e) => setDimensions(p => p.map((d, idx) => idx === i ? { ...d, [k]: e.target.value } : d));
  const sit  = (i, k) => (e) => setItemdtl(p    => p.map((it, idx) => idx === i ? { ...it, [k]: e.target.value } : it));

  // ── Handle mode switch ────────────────────────────────────────────────────
  const handleModeSwitch = (mode) => {
    setMultiMode(mode === "multi");
    setSelected(null); setFetchError(""); setResult(null); setError("");
    setInvoiceNo(""); setInvoiceNos(["", "", ""]);
  };

  // ── Populate form from fetched invoice data ───────────────────────────────
  const populateForm = (inv) => {
    setSelected(inv);
    setConsignee(p => ({
      ...p,
      ConsigneeName:      inv.CustomerName      || "",
      ConsigneeAddress1:  inv.ShipAddress1      || "",
      ConsigneeAddress2:  inv.ShipAddress2      || "",
      ConsigneeAddress3:  inv.ShipAddress3      || "",
      ConsigneePincode:   inv.CustomerPincode   || "",
      ConsigneeMobile:    inv.MobileNo          || "",
      ConsigneeAttention: inv.ContactPersonName || "",
      ConsigneeTelephone: inv.Telephone         || "",
      ConsigneeEmailID:   inv.Email             || "",
      ConsigneeGSTNumber: inv.ConsigneeGST      || "",
    }));

    const invDate = inv.InvoiceDate ? inv.InvoiceDate.split("T")[0] : TODAY;
    let newItems = [];
    if (inv.lineItems?.length > 0) {
      newItems = inv.lineItems.map(line => ({
        ...emptyItem(String(line.InvoiceNo || inv.InvoiceNo || ""), line.InvoiceDate ? line.InvoiceDate.split("T")[0] : invDate),
        ItemID:        line.CatNo     || "",
        ItemName:      line.ItemName  || "",
        ItemValue:     String(line.ItemValue  || ""),
        TotalValue:    String(line.TotalValue || ""),
        Itemquantity:  String(line.Quantity   || "1"),
        InvoiceNumber: String(line.InvoiceNo  || inv.InvoiceNo || ""),
        InvoiceDate:   line.InvoiceDate ? line.InvoiceDate.split("T")[0] : invDate,
        SellerName:    SHIPPER_DEFAULTS.CustomerName,
        PlaceofSupply: inv.City || "",
      }));
      setItemdtl(newItems);
    }

    // const declaredValue = newItems.reduce((sum, it) => sum + (parseFloat(it.TotalValue) || 0), 0);
    // Use DocTotal (includes GST) not line item sum
    const declaredValue = multiMode && inv.invoices
      ? inv.invoices.reduce((sum, i) => sum + (parseFloat(i.DocTotal) || 0), 0)
      : parseFloat(inv.DocTotal || 0);

    // For multi — use first invoice ref no and all invoice nos joined
    const invoiceNoStr = inv.InvoiceNos
      ? inv.InvoiceNos.join(", ")
      : String(inv.InvoiceNo || "");

    setServices(p => ({
      ...p,
      CreditReferenceNo: inv.CustomerRefNo || String(inv.InvoiceNo || inv.InvoiceNos?.[0] || ""),
      InvoiceNo:         String(inv.InvoiceNo || inv.InvoiceNos?.[0] || "").substring(0, 10),
      DeclaredValue: String(declaredValue || ""),
      ItemCount:         String(newItems.length || 1),
      PieceCount:        "1",
      ActualWeight:      inv.UWeight ? String(inv.UWeight) : p.ActualWeight,
    }));
  };

  // ── Fetch single ──────────────────────────────────────────────────────────
  const handleFetchSingle = async () => {
    const no = invoiceNo.trim();
    if (!no) return;
    setFetching(true); setFetchError(""); setSelected(null); setResult(null); setError(""); setFieldErrors({});
    try {
      const res  = await fetch(`/api/invoices/search-for-waybill?invoiceNo=${encodeURIComponent(no)}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invoice not found");
      populateForm(data.invoice);
    } catch (e) { setFetchError(e.message); }
    finally { setFetching(false); }
  };

  // ── Fetch multiple ────────────────────────────────────────────────────────
  const handleFetchMulti = async () => {
    const nos = invoiceNos.map(n => n.trim()).filter(Boolean);
    if (nos.length === 0) { setFetchError("Please enter at least one invoice number."); return; }
    if (nos.length === 1) { setFetchError("For single invoice use Single Invoice mode."); return; }
    setFetching(true); setFetchError(""); setSelected(null); setResult(null); setError(""); setFieldErrors({});
    try {
      const res  = await fetch(`/api/invoices/search-for-waybill?invoiceNos=${encodeURIComponent(nos.join(","))}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invoices not found");
      if (!data.isMulti) throw new Error("Expected multiple invoices but got single");
      populateForm(data.invoice);
    } catch (e) { setFetchError(e.message); }
    finally { setFetching(false); }
  };

  // ── Validate ──────────────────────────────────────────────────────────────
  const validate = () => {
    const errors = {};
    if (!consignee.ConsigneeName)    errors.ConsigneeName    = true;
    if (!consignee.ConsigneeAddress1)errors.ConsigneeAddress1= true;
    if (!consignee.ConsigneePincode) errors.ConsigneePincode = true;
    if (!consignee.ConsigneeMobile)  errors.ConsigneeMobile  = true;
    if (!services.ActualWeight)      errors.ActualWeight     = true;
    if (!services.DeclaredValue || parseFloat(services.DeclaredValue) <= 0) errors.DeclaredValue = true;
    if (!services.CreditReferenceNo) errors.CreditReferenceNo = true;
    return errors;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) { setError("Please fetch invoice(s) first."); return; }
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError(`Please fill: ${Object.keys(errors).map(k => k.replace(/([A-Z])/g, ' $1').trim()).join(", ")}`);
      return;
    }
    setSubmitting(true); setResult(null); setSapUpdated(false); setError(""); setFieldErrors({});

    // Build payload — include docEntry or docEntries depending on mode
    const payload = {
      ...(multiMode
        ? { docEntries: selected.DocEntries }
        : { docEntry:   selected.DocEntry  }
      ),
      consignee, shipper,
      services: { ...services, PickupDate: toBluedartDate(services.PickupDate) },
      dimensions: dimensions.filter(d => d.Length && d.Breadth && d.Height),
      commodity,
      itemdtl: itemdtl.map(it => ({ ...it, InvoiceDate: toBluedartDate(it.InvoiceDate) })),
      returnAddr,
    };

    try {
      const res  = await fetch("/api/bluedart/generate-waybill", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate waybill");
      setResult(data);
      setSapUpdated(data.sapUpdated === true);
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className={s.wrapper}>

      {/* ══ STEP 1 ══ */}
      <div className={s.stepCard}>
        <div className={s.stepHeader}>
          <div className={`${s.stepBadge} ${selected ? s.stepBadgeDone : ""}`}>
            {selected ? <i className="ti ti-check" aria-hidden="true" /> : "1"}
          </div>
          <div className={s.stepTitleGroup}>
            <span className={s.stepTitle}>Fetch Invoice</span>
            <span className={s.stepDesc}>Enter invoice number(s) to load shipment details automatically</span>
          </div>
          {selected && <span className={s.stepDonePill}>✓ Loaded</span>}
        </div>

        <div className={s.stepBody}>
          {/* Mode toggle */}
          <div className={s.modeToggle}>
            <button
              type="button"
              className={`${s.modeBtn} ${!multiMode ? s.modeBtnActive : ""}`}
              onClick={() => handleModeSwitch("single")}
            >
              <i className="ti ti-file" aria-hidden="true" /> Single Invoice
            </button>
            <button
              type="button"
              className={`${s.modeBtn} ${multiMode ? s.modeBtnActive : ""}`}
              onClick={() => handleModeSwitch("multi")}
            >
              <i className="ti ti-files" aria-hidden="true" /> Multiple Invoices
            </button>
          </div>

          {/* Single mode */}
          {!multiMode && (
            <div className={s.searchRow}>
              <input
                className={s.searchInput}
                placeholder="Enter invoice number  e.g. 26211788"
                value={invoiceNo}
                onChange={e => { setInvoiceNo(e.target.value); setFetchError(""); }}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleFetchSingle())}
              />
              <button type="button" className={s.searchBtn} onClick={handleFetchSingle} disabled={fetching || !invoiceNo.trim()}>
                {fetching ? <><i className="ti ti-loader-2" aria-hidden="true" style={{marginRight:6}} />Loading...</> : <><i className="ti ti-download" aria-hidden="true" style={{marginRight:6}} />Fetch Invoice</>}
              </button>
            </div>
          )}

          {/* Multi mode */}
          {multiMode && (
            <div className={s.multiInvoiceBox}>
              <p className={s.multiNote}>
                <i className="ti ti-info-circle" aria-hidden="true" />
                All invoices must be for the same customer. Items from all invoices will be merged into one waybill.
              </p>
              <div className={s.multiInputList}>
                {invoiceNos.map((no, i) => (
                  <div key={i} className={s.multiInputRow}>
                    <span className={s.multiInputLabel}>Invoice {i + 1}</span>
                    <input
                      className={s.searchInput}
                      placeholder={`e.g. 2621178${i}`}
                      value={no}
                      onChange={e => {
                        const updated = [...invoiceNos];
                        updated[i] = e.target.value;
                        setInvoiceNos(updated);
                        setFetchError("");
                      }}
                      onKeyDown={e => e.key === "Enter" && e.preventDefault()}
                    />
                    {invoiceNos.length > 2 && (
                      <button
                        type="button"
                        className={s.removeInvoiceBtn}
                        onClick={() => setInvoiceNos(p => p.filter((_, idx) => idx !== i))}
                      >
                        <i className="ti ti-x" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className={s.multiActions}>
                <button
                  type="button"
                  className={s.addInvoiceBtn}
                  onClick={() => setInvoiceNos(p => [...p, ""])}
                >
                  <i className="ti ti-plus" aria-hidden="true" /> Add Invoice
                </button>
                <button
                  type="button"
                  className={s.searchBtn}
                  onClick={handleFetchMulti}
                  disabled={fetching || invoiceNos.filter(n => n.trim()).length < 2}
                >
                  {fetching ? <><i className="ti ti-loader-2" aria-hidden="true" style={{marginRight:6}} />Loading...</> : <><i className="ti ti-download" aria-hidden="true" style={{marginRight:6}} />Fetch Invoices</>}
                </button>
              </div>
            </div>
          )}

          {fetchError && <div className={s.fetchError}><i className="ti ti-alert-circle" aria-hidden="true" /> {fetchError}</div>}

          {selected && (
            <div className={s.selectedBanner}>
              <i className="ti ti-circle-check-filled" aria-hidden="true" style={{fontSize:22,flexShrink:0}} />
              <div className={s.selectedText}>
                <div className={s.selectedName}>
                  {selected.CustomerName}
                  {selected.InvoiceNos
                    ? selected.InvoiceNos.map(n => <span key={n} className={s.selectedInvNo}>#{n}</span>)
                    : <span className={s.selectedInvNo}>#{selected.InvoiceNo}</span>
                  }
                </div>
                <div className={s.selectedMeta}>
                  {[selected.ShipAddress1, selected.City, selected.CustomerPincode].filter(Boolean).join(" · ")}
                  &nbsp;·&nbsp; {selected.lineItems?.length} line item{selected.lineItems?.length !== 1 ? "s" : ""}
                  &nbsp;·&nbsp; ₹{(selected.DocTotal || 0).toLocaleString("en-IN")}
                  {selected.TrackNo && <>&nbsp;·&nbsp; Existing AWB: <strong>{selected.TrackNo}</strong></>}
                  {multiMode && <>&nbsp;·&nbsp; <span className={s.multiBadge}>📦 {selected.InvoiceNos?.length} invoices merged</span></>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ STEP 2 ══ */}
      <div className={s.stepCard}>
        <div className={s.stepHeader}>
          <div className={s.stepBadge}>2</div>
          <div className={s.stepTitleGroup}>
            <span className={s.stepTitle}>Review & Complete Details</span>
            <span className={s.stepDesc}>All fields pre-filled from invoice — review and edit if needed</span>
          </div>
        </div>
        <div className={s.stepBody}>

          {/* 1 — CONSIGNEE */}
          <CollapsibleSection icon={<i className="ti ti-map-pin" aria-hidden="true"/>} title="Consignee — Receiver Details" subtitle="Where the parcel is going" tag="Auto-filled · Editable" tagColor="blue" colorKey="consignee">
            <div className={s.grid3}>
              <Field label="Consignee Name" required span={2}><Inp value={consignee.ConsigneeName} onChange={sc("ConsigneeName")} placeholder="Receiver full name" error={fieldErrors.ConsigneeName} /></Field>
              <Field label="Mobile No" required><Inp value={consignee.ConsigneeMobile} onChange={sc("ConsigneeMobile")} placeholder="10-digit mobile" error={fieldErrors.ConsigneeMobile} /></Field>
              <Field label="Address Line 1" required span={2}><Inp value={consignee.ConsigneeAddress1} onChange={sc("ConsigneeAddress1")} placeholder="House / Building / Street" error={fieldErrors.ConsigneeAddress1} /></Field>
              <Field label="Pincode" required><Inp value={consignee.ConsigneePincode} onChange={sc("ConsigneePincode")} placeholder="6-digit pincode" error={fieldErrors.ConsigneePincode} /></Field>
              <Field label="Address Line 2"><Inp value={consignee.ConsigneeAddress2} onChange={sc("ConsigneeAddress2")} placeholder="Area / Landmark" /></Field>
              <Field label="Address Line 3"><Inp value={consignee.ConsigneeAddress3} onChange={sc("ConsigneeAddress3")} placeholder="City / State" /></Field>
              <Field label="Attention (Contact Person)"><Inp value={consignee.ConsigneeAttention} onChange={sc("ConsigneeAttention")} placeholder="Contact person at delivery" /></Field>
              <Field label="Telephone"><Inp value={consignee.ConsigneeTelephone} onChange={sc("ConsigneeTelephone")} placeholder="Landline number" /></Field>
              <Field label="Email ID"><Inp value={consignee.ConsigneeEmailID} onChange={sc("ConsigneeEmailID")} placeholder="receiver@email.com" /></Field>
              <Field label="GST Number"><Inp value={consignee.ConsigneeGSTNumber} onChange={sc("ConsigneeGSTNumber")} placeholder="GSTIN (if any)" /></Field>
              <Field label="Address Type" hint="O=Office  R=Residential  S=Store  M=Mall">
                <Sel value={consignee.ConsigneeAddressType} onChange={sc("ConsigneeAddressType")}>
                  <option value="">— Select —</option>
                  <option value="O">O — Office</option>
                  <option value="R">R — Residential</option>
                  <option value="S">S — Store</option>
                  <option value="M">M — Mall</option>
                </Sel>
              </Field>
              <Field label="Address Info"><Inp value={consignee.ConsigneeAddressinfo} onChange={sc("ConsigneeAddressinfo")} placeholder="Landmark / extra info" /></Field>
              <Field label="Full Address (optional)"><Inp value={consignee.ConsigneeFullAddress} onChange={sc("ConsigneeFullAddress")} placeholder="Complete address in one line" /></Field>
              <Field label="Latitude"><Inp value={consignee.ConsigneeLatitude} onChange={sc("ConsigneeLatitude")} placeholder="e.g. 17.3850" /></Field>
              <Field label="Longitude"><Inp value={consignee.ConsigneeLongitude} onChange={sc("ConsigneeLongitude")} placeholder="e.g. 78.4867" /></Field>
              <Field label="Masked Contact No"><Inp value={consignee.ConsigneeMaskedContactNumber} onChange={sc("ConsigneeMaskedContactNumber")} /></Field>
              <Field label="Available Days" hint="1=Mon … 7=Sun  e.g. 12345"><Inp value={consignee.AvailableDays} onChange={sc("AvailableDays")} /></Field>
              <Field label="Available Timing" hint="e.g. 0900-1800"><Inp value={consignee.AvailableTiming} onChange={sc("AvailableTiming")} /></Field>
            </div>
          </CollapsibleSection>

          {/* 2 — SHIPPER */}
          <CollapsibleSection icon={<i className="ti ti-building" aria-hidden="true"/>} title="Shipper — Sender Details" subtitle="Your warehouse / company info" tag="Pre-filled · Editable" tagColor="green" colorKey="shipper" defaultOpen={false}>
            <div className={s.grid3}>
              <Field label="Company Name" required span={2}><Inp value={shipper.CustomerName} onChange={ss("CustomerName")} /></Field>
              <Field label="Customer Code" required><Inp value={shipper.CustomerCode} onChange={ss("CustomerCode")} /></Field>
              <Field label="Address Line 1" required span={2}><Inp value={shipper.CustomerAddress1} onChange={ss("CustomerAddress1")} /></Field>
              <Field label="Origin Area" required hint="3-letter area code"><Inp value={shipper.OriginArea} onChange={ss("OriginArea")} /></Field>
              <Field label="Address Line 2"><Inp value={shipper.CustomerAddress2} onChange={ss("CustomerAddress2")} /></Field>
              <Field label="Address Line 3"><Inp value={shipper.CustomerAddress3} onChange={ss("CustomerAddress3")} /></Field>
              <Field label="Pincode" required><Inp value={shipper.CustomerPincode} onChange={ss("CustomerPincode")} /></Field>
              <Field label="Mobile"><Inp value={shipper.CustomerMobile} onChange={ss("CustomerMobile")} /></Field>
              <Field label="Telephone"><Inp value={shipper.CustomerTelephone} onChange={ss("CustomerTelephone")} /></Field>
              <Field label="Email"><Inp value={shipper.CustomerEmailID} onChange={ss("CustomerEmailID")} /></Field>
              <Field label="GST Number"><Inp value={shipper.CustomerGSTNumber} onChange={ss("CustomerGSTNumber")} /></Field>
              <Field label="Sender Name" hint="Max 20 chars"><Inp value={shipper.Sender} onChange={ss("Sender")} maxLength={20} /></Field>
              <Field label="Vendor Code"><Inp value={shipper.VendorCode} onChange={ss("VendorCode")} /></Field>
            </div>
            <label className={s.checkLabel} style={{marginTop:"0.75rem"}}>
              <input type="checkbox" className={s.checkbox} checked={!!shipper.IsToPayCustomer} onChange={ss("IsToPayCustomer")} />
              Is To Pay Customer — receiver pays freight
            </label>
          </CollapsibleSection>

          {/* 3 — SERVICES */}
          <CollapsibleSection icon={<i className="ti ti-truck" aria-hidden="true"/>} title="Services — Shipment Details" subtitle="Core shipping parameters" tag="Fill manually" tagColor="amber" colorKey="services">
            <div className={s.grid3}>
              <Field label="Product Code" required>
                <Sel value={services.ProductCode} onChange={ssv("ProductCode")}>
                  <option value="A">A — Air (Faster)</option>
                  <option value="E">E — Surface (Economical)</option>
                </Sel>
              </Field>
              <Field label="Product Type" required hint="0=Docs  1=Non-Docs  2=Non-Docs+ItemDtl">
                <Sel value={services.ProductType} onChange={ssv("ProductType")}>
                  <option value="0">0 — Documents</option>
                  <option value="1">1 — Non-Documents</option>
                  <option value="2">2 — Non-Docs + Item Detail</option>
                </Sel>
              </Field>
              <Field label="Sub Product Code">
                <Sel value={services.SubProductCode} onChange={ssv("SubProductCode")}>
                  <option value="">— None —</option>
                  <option value="P">P — Prepaid</option>
                  <option value="C">C — COD</option>
                  <option value="D">D — DOD</option>
                </Sel>
              </Field>
              <Field label="Piece Count" required><Inp type="number" min="1" value={services.PieceCount} onChange={ssv("PieceCount")} /></Field>
              <Field label="Actual Weight (kg)" required><Inp type="number" step="0.01" min="0.01" value={services.ActualWeight} onChange={ssv("ActualWeight")} placeholder="e.g. 0.50" error={fieldErrors.ActualWeight} /></Field>
              <Field label="Declared Value (₹)" required hint="Sum of all invoice items"><Inp type="number" value={services.DeclaredValue} onChange={ssv("DeclaredValue")} error={fieldErrors.DeclaredValue} /></Field>
              <Field label="Credit Reference No" required hint="From first invoice"><Inp value={services.CreditReferenceNo} onChange={ssv("CreditReferenceNo")} error={fieldErrors.CreditReferenceNo} /></Field>
              <Field label="Credit Reference No 2"><Inp value={services.CreditReferenceNo2} onChange={ssv("CreditReferenceNo2")} /></Field>
              <Field label="Credit Reference No 3"><Inp value={services.CreditReferenceNo3} onChange={ssv("CreditReferenceNo3")} /></Field>
              <Field label="Pickup Date" required><Inp type="date" value={services.PickupDate} onChange={ssv("PickupDate")} /></Field>
              <Field label="Pickup Time" required>
                <Sel value={services.PickupTime} onChange={ssv("PickupTime")}>
                  <option value="0900">09:00 AM</option>
                  <option value="1000">10:00 AM</option>
                  <option value="1100">11:00 AM</option>
                  <option value="1200">12:00 PM</option>
                  <option value="1400">02:00 PM</option>
                  <option value="1600">04:00 PM</option>
                  <option value="1800">06:00 PM</option>
                </Sel>
              </Field>
              <Field label="Invoice No" hint="Max 10 chars"><Inp value={services.InvoiceNo} onChange={ssv("InvoiceNo")} maxLength={10} /></Field>
              <Field label="Item Count"><Inp type="number" min="0" value={services.ItemCount} onChange={ssv("ItemCount")} /></Field>
              <Field label="Collectable Amount" hint="COD only — else 0"><Inp type="number" min="0" value={services.CollectableAmount} onChange={ssv("CollectableAmount")} /></Field>
              <Field label="AWB No" hint="Leave blank — Blue Dart assigns"><Inp value={services.AWBNo} onChange={ssv("AWBNo")} placeholder="Auto-assigned" /></Field>
              <Field label="Special Instruction" span={3}><Inp value={services.SpecialInstruction} onChange={ssv("SpecialInstruction")} placeholder="e.g. Handle with care, Fragile items" /></Field>
            </div>
            <div className={s.checkGrid}>
              {[
                ["RegisterPickup",            "Register Pickup (schedule agent)"],
                ["PDFOutputNotRequired",       "PDF Output Not Required"],
                ["IsDedicatedDeliveryNetwork", "Dedicated Delivery Network"],
                ["IsReversePickup",            "Reverse Pickup"],
                ["IsForcePickup",              "Force Pickup"],
                ["IsPartialPickup",            "Partial Pickup"],
              ].map(([k, label]) => (
                <label key={k} className={s.checkLabel}>
                  <input type="checkbox" className={s.checkbox} checked={!!services[k]} onChange={ssv(k)} />
                  {label}
                </label>
              ))}
            </div>
          </CollapsibleSection>

          {/* 4 — DIMENSIONS */}
          <CollapsibleSection icon={<i className="ti ti-box" aria-hidden="true"/>} title="Dimensions — Box Size" subtitle="Length × Breadth × Height in centimetres" tag="Optional" tagColor="gray" colorKey="dims" defaultOpen={false}>
            <p className={s.sectionNote}>Provide box dimensions for volumetric weight calculation.</p>
            {dimensions.map((dim, i) => (
              <div key={i} className={s.dimRow}>
                <div className={s.dimRowHeader}>
                  <span className={s.dimLabel}>Box {i + 1}</span>
                  {dimensions.length > 1 && <button type="button" className={s.removeBtn} onClick={() => setDimensions(p => p.filter((_,idx)=>idx!==i))}><i className="ti ti-trash" aria-hidden="true" /> Remove</button>}
                </div>
                <div className={s.grid4}>
                  <Field label="Length (cm)"><Inp type="number" value={dim.Length} onChange={sdim(i,"Length")} placeholder="e.g. 30" /></Field>
                  <Field label="Breadth (cm)"><Inp type="number" value={dim.Breadth} onChange={sdim(i,"Breadth")} placeholder="e.g. 20" /></Field>
                  <Field label="Height (cm)"><Inp type="number" value={dim.Height} onChange={sdim(i,"Height")} placeholder="e.g. 10" /></Field>
                  <Field label="Count"><Inp type="number" min="1" value={dim.Count} onChange={sdim(i,"Count")} /></Field>
                </div>
              </div>
            ))}
            <button type="button" className={s.addBtn} onClick={() => setDimensions(p => [...p, { Length:"", Breadth:"", Height:"", Count:"1" }])}>
              <i className="ti ti-plus" aria-hidden="true" /> Add another box size
            </button>
          </CollapsibleSection>

          {/* 5 — COMMODITY */}
          <CollapsibleSection icon={<i className="ti ti-tag" aria-hidden="true"/>} title="Commodity — What's Inside" subtitle="Description of parcel contents" tag="Optional" tagColor="gray" colorKey="commodity" defaultOpen={false}>
            <div className={s.grid3}>
              <Field label="Commodity Detail 1" hint="Item description or HSN code"><Inp value={commodity.CommodityDetail1} onChange={scom("CommodityDetail1")} placeholder="e.g. Chemical reagents" /></Field>
              <Field label="Commodity Detail 2"><Inp value={commodity.CommodityDetail2} onChange={scom("CommodityDetail2")} placeholder="e.g. Lab equipment" /></Field>
              <Field label="Commodity Detail 3"><Inp value={commodity.CommodityDetail3} onChange={scom("CommodityDetail3")} placeholder="e.g. Glassware" /></Field>
            </div>
          </CollapsibleSection>

          {/* 6 — ITEM DETAIL */}
          <CollapsibleSection icon={<i className="ti ti-list-details" aria-hidden="true"/>} title="Item Detail (itemdtl) — Line Item Info" subtitle="Auto-filled from all invoice line items" tag="Auto-filled · Editable" tagColor="teal" colorKey="items" defaultOpen={false}>
            <p className={s.sectionNote}>
              {multiMode
                ? "Items from all selected invoices are merged here. Each item shows which invoice it belongs to."
                : "Each SAP invoice line becomes one row."
              } Per-item fields in the table — common fields below apply to all.
            </p>
            <div className={s.itemTableWrap}>
              <table className={s.itemTable}>
                <thead>
                  <tr>
                    <th>#</th>
                    {multiMode && <th>Invoice</th>}
                    <th>Item ID <span className={s.thHint}>(Cat No)</span></th>
                    <th>Item Name</th>
                    <th>Qty</th>
                    <th>Item Value (₹)</th>
                    <th>Total Value (₹)</th>
                    <th>SKU No</th>
                    <th>Desc 1</th>
                    <th>Desc 2</th>
                    <th>Instruction</th>
                    <th>Return Reason</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {itemdtl.map((item, i) => (
                    <tr key={i}>
                      <td className={s.tdIdx}>{i + 1}</td>
                      {multiMode && <td><span className={s.invTag}>{item.InvoiceNumber}</span></td>}
                      <td><Inp value={item.ItemID} onChange={sit(i,"ItemID")} placeholder="e.g. A16299" /></td>
                      <td><Inp value={item.ItemName} onChange={sit(i,"ItemName")} placeholder="Product name" /></td>
                      <td><Inp type="number" min="1" value={item.Itemquantity} onChange={sit(i,"Itemquantity")} /></td>
                      <td><Inp type="number" value={item.ItemValue} onChange={sit(i,"ItemValue")} /></td>
                      <td><Inp type="number" value={item.TotalValue} onChange={sit(i,"TotalValue")} /></td>
                      <td><Inp value={item.SKUNumber} onChange={sit(i,"SKUNumber")} placeholder="SKU" /></td>
                      <td><Inp value={item.ProductDesc1} onChange={sit(i,"ProductDesc1")} placeholder="Brand" /></td>
                      <td><Inp value={item.ProductDesc2} onChange={sit(i,"ProductDesc2")} placeholder="Size" /></td>
                      <td><Inp value={item.Instruction} onChange={sit(i,"Instruction")} /></td>
                      <td><Inp value={item.ReturnReason} onChange={sit(i,"ReturnReason")} /></td>
                      <td>
                        {itemdtl.length > 1 && (
                          <button type="button" className={s.tdRemoveBtn} onClick={() => setItemdtl(p => p.filter((_,idx) => idx !== i))}>
                            <i className="ti ti-trash" aria-hidden="true" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" className={s.addBtn} onClick={() => setItemdtl(p => [...p, emptyItem()])}>
              <i className="ti ti-plus" aria-hidden="true" /> Add another item row
            </button>
            <div className={s.commonFieldsHeader}><i className="ti ti-layout-grid" aria-hidden="true" />Common fields — apply to all items above</div>
            <div className={s.grid3}>
              <Field label="Invoice Number"><Inp value={itemdtl[0]?.InvoiceNumber} onChange={sit(0,"InvoiceNumber")} /></Field>
              <Field label="Invoice Date"><Inp type="date" value={itemdtl[0]?.InvoiceDate} onChange={(e) => setItemdtl(p => p.map(it => ({ ...it, InvoiceDate: e.target.value })))} /></Field>
              <Field label="Seller Name"><Inp value={itemdtl[0]?.SellerName} onChange={(e) => setItemdtl(p => p.map(it => ({ ...it, SellerName: e.target.value })))} /></Field>
              <Field label="Seller GSTIN"><Inp value={itemdtl[0]?.SellerGSTNNumber} onChange={(e) => setItemdtl(p => p.map(it => ({ ...it, SellerGSTNNumber: e.target.value })))} /></Field>
              <Field label="Place of Supply"><Inp value={itemdtl[0]?.PlaceofSupply} onChange={(e) => setItemdtl(p => p.map(it => ({ ...it, PlaceofSupply: e.target.value })))} /></Field>
              <Field label="Country of Origin"><Inp value={itemdtl[0]?.countryOfOrigin} onChange={(e) => setItemdtl(p => p.map(it => ({ ...it, countryOfOrigin: e.target.value })))} /></Field>
              <Field label="HS Code"><Inp value={itemdtl[0]?.HSCode} onChange={(e) => setItemdtl(p => p.map(it => ({ ...it, HSCode: e.target.value })))} /></Field>
              <Field label="Doc Type">
                <Sel value={itemdtl[0]?.docType} onChange={(e) => setItemdtl(p => p.map(it => ({ ...it, docType: e.target.value })))}>
                  <option value="INV">INV — Invoice</option>
                  <option value="">— None —</option>
                </Sel>
              </Field>
              <Field label="Supply Type"><Inp value={itemdtl[0]?.supplyType} onChange={(e) => setItemdtl(p => p.map(it => ({ ...it, supplyType: e.target.value })))} /></Field>
              <Field label="CGST Amount (₹)"><Inp type="number" value={itemdtl[0]?.CGSTAmount} onChange={(e) => setItemdtl(p => p.map(it => ({ ...it, CGSTAmount: e.target.value })))} /></Field>
              <Field label="SGST Amount (₹)"><Inp type="number" value={itemdtl[0]?.SGSTAmount} onChange={(e) => setItemdtl(p => p.map(it => ({ ...it, SGSTAmount: e.target.value })))} /></Field>
              <Field label="IGST Amount (₹)"><Inp type="number" value={itemdtl[0]?.IGSTAmount} onChange={(e) => setItemdtl(p => p.map(it => ({ ...it, IGSTAmount: e.target.value })))} /></Field>
              <Field label="IGST Rate (%)"><Inp type="number" value={itemdtl[0]?.IGSTRate} onChange={(e) => setItemdtl(p => p.map(it => ({ ...it, IGSTRate: e.target.value })))} /></Field>
              <Field label="Taxable Amount (₹)"><Inp type="number" value={itemdtl[0]?.TaxableAmount} onChange={(e) => setItemdtl(p => p.map(it => ({ ...it, TaxableAmount: e.target.value })))} /></Field>
              <Field label="Cess Amount"><Inp value={itemdtl[0]?.cessAmount} onChange={(e) => setItemdtl(p => p.map(it => ({ ...it, cessAmount: e.target.value })))} /></Field>
            </div>
          </CollapsibleSection>

          {/* 7 — RETURN ADDRESS */}
          <CollapsibleSection icon={<i className="ti ti-arrow-back" aria-hidden="true"/>} title="Return Address — If Undelivered" subtitle="Where the parcel returns on failed delivery" tag="Pre-filled · Editable" tagColor="green" colorKey="return" defaultOpen={false}>
            <div className={s.grid3}>
              <Field label="Return Address 1" required span={2}><Inp value={returnAddr.ReturnAddress1} onChange={sr("ReturnAddress1")} /></Field>
              <Field label="Return Pincode" required><Inp value={returnAddr.ReturnPincode} onChange={sr("ReturnPincode")} /></Field>
              <Field label="Return Address 2"><Inp value={returnAddr.ReturnAddress2} onChange={sr("ReturnAddress2")} /></Field>
              <Field label="Return Address 3"><Inp value={returnAddr.ReturnAddress3} onChange={sr("ReturnAddress3")} /></Field>
              <Field label="Contact Name"><Inp value={returnAddr.ReturnContact} onChange={sr("ReturnContact")} /></Field>
              <Field label="Mobile"><Inp value={returnAddr.ReturnMobile} onChange={sr("ReturnMobile")} /></Field>
              <Field label="Telephone"><Inp value={returnAddr.ReturnTelephone} onChange={sr("ReturnTelephone")} /></Field>
              <Field label="Email"><Inp value={returnAddr.ReturnEmailID} onChange={sr("ReturnEmailID")} /></Field>
            </div>
          </CollapsibleSection>

          {/* Alerts */}
          {error && (
            <div className={s.alertDanger}>
              <i className="ti ti-alert-circle" aria-hidden="true" style={{fontSize:18,flexShrink:0}} />
              <div><p className={s.alertTitle}>Please fix the following</p><p className={s.alertBody}>{error}</p></div>
            </div>
          )}
          {result && (
            <div className={s.alertSuccess}>
              <i className="ti ti-circle-check" aria-hidden="true" style={{fontSize:18,flexShrink:0}} />
              <div style={{flex:1}}>
                <p className={s.alertTitle}>Waybill Generated Successfully!</p>
                <p className={s.alertBody}>
                  AWB No: <strong className={s.awbHighlight}>{result.AWBNo}</strong>
                  &nbsp;·&nbsp;Destination: {result.DestinationArea} ({result.DestinationLocation})
                  &nbsp;·&nbsp;{result.StatusInformation}
                  {sapUpdated && <>&nbsp;·&nbsp;✅ SAP invoice(s) TrackNo updated.</>}
                </p>
                {result.AWBPrintContent && (
                  <button type="button" className={s.pdfBtn} onClick={() => {
                    const bytes = new Uint8Array(result.AWBPrintContent);
                    const blob  = new Blob([bytes], { type: "application/pdf" });
                    const url   = URL.createObjectURL(blob);
                    const link  = document.createElement("a");
                    link.href = url; link.download = `BlueDart_AWB_${result.AWBNo}.pdf`;
                    link.click(); URL.revokeObjectURL(url);
                  }}>
                    <i className="ti ti-file-download" aria-hidden="true" /> Download Waybill PDF
                  </button>
                )}
              </div>
            </div>
          )}

          <div className={s.formFooter}>
            <span className={s.footerNote}>
              <i className="ti ti-lock" aria-hidden="true" style={{marginRight:4}} />
              Profile credentials auto-injected from config
            </span>
            <button type="submit" className={s.submitBtn} disabled={submitting || !selected}>
              {submitting
                ? <><i className="ti ti-loader-2" aria-hidden="true" style={{marginRight:6}} />Generating...</>
                : <><i className="ti ti-barcode" aria-hidden="true" style={{marginRight:6}} />Generate Waybill</>
              }
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}