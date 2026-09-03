// pages/catalyst-reagents.js
// Bare page, same structural pattern as pages/catalyst-pricing.js minus the
// password gate — the Products nav link being hidden for other roles is
// this app's existing security model for pages like this (see
// pages/products/index.js), not a page-level redirect.

import CatalystReagentsDashboard from "components/page/catalyst-reagents/CatalystReagentsDashboard";

export default function CatalystReagentsPage() {
  return <CatalystReagentsDashboard />;
}

CatalystReagentsPage.seo = {
  title: "Catalyst, Fine Chemical & Reagent | Density",
  description: "Stock value, sales, margin and order value for Catalyst, Fine Chemical and Reagent.",
  keywords: "catalyst, fine chemical, reagent, density",
};
