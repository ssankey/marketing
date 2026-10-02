// Utility: Indian number grouping (thousands, lakhs, crores…)
export const  formatNumberWithIndianCommas=(value)=> {
  if (value == null || isNaN(value)) return ""; // guard
  const [intPart, decPart] = value.toString().split(".");
  // handle sign
  const sign = intPart.startsWith("-") ? "-" : "";
  const num = sign ? intPart.slice(1) : intPart;

  // last three digits
  const last3 = num.slice(-3);
  // remaining digits
  const rest = num.slice(0, -3);
  // insert commas every 2 digits in the “rest”
  const formattedRest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");

  return (
    sign +
    (formattedRest ? formattedRest + "," : "") +
    last3 +
    (decPart ? "." + decPart : "")
  );
}
