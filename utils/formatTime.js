// utils/formatTime.js
export function formatTime(rawTime) {
  if (!rawTime) return "";

  // If it's an ISO string, extract the time
  if (typeof rawTime === 'string' && rawTime.includes('T')) {
    const date = new Date(rawTime);
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  // If it's a number (HHMMSS format)
  const str = rawTime.toString().padStart(6, "0");
  const hh = str.substring(0, 2);
  const mm = str.substring(2, 4);
  
  return `${hh}:${mm}`;
}