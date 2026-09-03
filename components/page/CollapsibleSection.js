// components/page/CollapsibleSection.js
// Generalized from the toggle pattern in components/page/catalyst/CatalystPricingConsole.js
// (cc-formula-header/cc-formula-chevron) — a plain useState + conditional
// render, no accordion library. Defaults to the "cd-" section classes used
// on pages/customers/[id].js so it drops in without new CSS, but every
// class name is overridable for reuse elsewhere.

import { useState } from "react";

export default function CollapsibleSection({
  title,
  defaultOpen = true,
  controls,
  children,
  sectionClassName = "pdf-section",
  headerClassName = "cd-section-header cd-collapsible-header",
  titleClassName = "cd-section-title",
  controlsClassName = "cd-section-controls",
  chevronClassName = "cd-chevron",
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={sectionClassName}>
      <div
        className={headerClassName}
        onClick={() => setOpen((v) => !v)}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
      >
        <div className={titleClassName}>{title}</div>
        {controls && (
          <div className={controlsClassName} onClick={(e) => e.stopPropagation()}>
            {controls}
          </div>
        )}
        <span className={`${chevronClassName} ${open ? "open" : ""}`}>▸</span>
      </div>
      {open && <div className="cd-section-body">{children}</div>}
    </div>
  );
}
