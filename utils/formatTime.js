// // utils/formatTime.js
// export function formatTime(rawTime) {
//   if (!rawTime) return "";

//   // If it's an ISO string, extract the time
//   if (typeof rawTime === 'string' && rawTime.includes('T')) {
//     const date = new Date(rawTime);
//     const hh = String(date.getHours()).padStart(2, '0');
//     const mm = String(date.getMinutes()).padStart(2, '0');
//     return `${hh}:${mm}`;
//   }

//   // If it's a number (HHMMSS format)
//   const str = rawTime.toString().padStart(6, "0");
//   const hh = str.substring(0, 2);
//   const mm = str.substring(2, 4);
  
//   return `${hh}:${mm}`;
// }

// utils/formatTime.js
export function formatTime(rawTime) {
  if (!rawTime && rawTime !== 0) return "";

  // If it's an ISO string, extract the time
  if (typeof rawTime === 'string' && rawTime.includes('T')) {
    const date = new Date(rawTime);
    if (isNaN(date.getTime())) return "";
    
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  // If it's a number (HHMMSS or HMMSS format)
  if (typeof rawTime === 'number' || !isNaN(rawTime)) {
    const timeNum = parseInt(rawTime, 10);
    
    // Handle invalid numbers
    if (isNaN(timeNum) || timeNum < 0) return "";
    
    // Extract hours, minutes, seconds
    const ss = timeNum % 100;
    const mm = Math.floor((timeNum / 100)) % 100;
    const hh = Math.floor(timeNum / 10000);
    
    // Format with leading zeros
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  }

  return "";
}