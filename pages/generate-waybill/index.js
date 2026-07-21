// pages/waybill/index.js
import { useState } from "react";
import styles from "./waybill.module.css";
import GenerateWaybill from "../../components/waybill/GenerateWaybill";
import AllWaybills     from "../../components/waybill/AllWaybills";
import ImportData      from "../../components/waybill/ImportData";
import UpdateEwaybill  from "../../components/waybill/UpdateEwaybill";
import CancelWaybill   from "../../components/waybill/CancelWaybill";

const TABS = [
  {
    key:     "generate",
    icon:    "🏷️",
    label:   "Generate Waybill",
    desc:    "Create a new shipment",
  },
  {
    key:     "all",
    icon:    "📋",
    label:   "All Waybills",
    desc:    "View all shipments",
  },
  {
    key:     "import",
    icon:    "📤",
    label:   "Import Data",
    desc:    "Bulk waybill creation",
  },
  {
    key:     "update",
    icon:    "🔄",
    label:   "Update E-Waybill",
    desc:    "Link GST e-waybill",
  },
  {
    key:     "cancel",
    icon:    "❌",
    label:   "Cancel Waybill",
    desc:    "Cancel before dispatch",
  },
];

export default function WaybillPage() {
  const [activeTab, setActiveTab] = useState("generate");

  return (
    <div className={styles.pageWrapper}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Waybill Management</h2>
        <p className={styles.pageSubtitle}>
          Generate, track, update and cancel Blue Dart waybills for your shipments
        </p>
      </div>

      {/* Tab Cards */}
      <div className={styles.tabGrid}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tabCard} ${activeTab === tab.key ? styles.active : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            <span className={styles.tabLabel}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className={styles.panel}>
        {activeTab === "generate" && <GenerateWaybill />}
        {activeTab === "all"      && <AllWaybills />}
        {activeTab === "import"   && <ImportData />}
        {activeTab === "update"   && <UpdateEwaybill />}
        {activeTab === "cancel"   && <CancelWaybill />}
      </div>
    </div>
  );
}