// utils/formatTime.js
export function formatTime(rawTime) {
  if (!rawTime) return "";

  const str = rawTime.toString().padStart(6, "0"); // ensure 6 digits
  const hh = str.substring(0, 2);
  const mm = str.substring(2, 4);
  const ss = str.substring(4, 6);

  return `${hh}:${mm}`; // 24-hour format
}
