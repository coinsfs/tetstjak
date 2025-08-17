// Utility functions untuk konversi timezone WIB ke UTC
export const WIB_OFFSET = 7; // UTC+7

/**
 * Konversi datetime dari WIB ke UTC
 * @param wibDatetime - datetime dalam format WIB (naive datetime dari datetime-local input)
 * @returns datetime dalam format UTC ISO string
 */
export const convertWIBToUTC = (wibDatetime: string): string => {
  if (!wibDatetime) return '';
  
  console.log('🔄 convertWIBToUTC - Input WIB:', wibDatetime);
  
  // Tambahkan timezone offset WIB (+07:00) ke datetime string
  // Ini memberitahu browser bahwa waktu ini adalah WIB, bukan waktu lokal browser
  const wibWithTimezone = wibDatetime + '+07:00';
  
  console.log('🔧 convertWIBToUTC - WIB with timezone:', wibWithTimezone);
  
  // Parse sebagai Date object dengan timezone WIB yang eksplisit
  const wibDate = new Date(wibWithTimezone);
  
  // toISOString() akan mengkonversi ke UTC
  const result = wibDate.toISOString();
  console.log('✅ convertWIBToUTC - Output UTC:', result);
  return result;
};

/**
 * Konversi datetime dari UTC ke WIB untuk display di datetime-local input
 * @param utcDatetime - datetime dalam format UTC ISO string
 * @returns datetime dalam format naive local time untuk datetime-local input
 */
export const convertUTCToWIB = (utcDatetime: string): string => {
  if (!utcDatetime) return '';
  
  console.log('🔄 convertUTCToWIB - Input UTC:', utcDatetime);
  
  try {
    // Ensure the UTC datetime string is properly formatted as UTC
    // If it doesn't end with 'Z', append it to explicitly mark as UTC
    let utcString = utcDatetime;
    if (!utcString.endsWith('Z') && !utcString.includes('+') && !utcString.includes('-', 10)) {
      // If it's a simple ISO string without timezone info, append 'Z' to mark as UTC
      utcString = utcDatetime + 'Z';
    }
    
    console.log('🔧 convertUTCToWIB - Processed UTC string:', utcString);
    
    const utcDate = new Date(utcString);
    
    // Validasi apakah date valid
    if (isNaN(utcDate.getTime())) {
      console.error('❌ convertUTCToWIB - Invalid date:', utcDatetime);
      return '';
    }
    
    // Gunakan toLocaleString dengan timezone Jakarta
    const wibString = utcDate.toLocaleString('sv-SE', {
      timeZone: 'Asia/Jakarta'
    });
    
    // sv-SE locale menghasilkan format YYYY-MM-DD HH:mm:ss
    // Ambil bagian YYYY-MM-DD HH:mm saja dan ganti spasi dengan T
    const result = wibString.substring(0, 16).replace(' ', 'T');
    console.log('✅ convertUTCToWIB - Output WIB:', result);
    return result;
  } catch (error) {
    console.error('❌ convertUTCToWIB - Error converting UTC to WIB:', error, utcDatetime);
    return '';
  }
};

/**
 * Format datetime untuk display dengan konversi ke WIB
 * @param utcDatetime - datetime dalam format UTC
 * @returns formatted string dalam WIB
 */
export const formatDateTimeWithTimezone = (utcDatetime: string): string => {
  if (!utcDatetime) return '-';
  
  try {
    const utcDate = new Date(utcDatetime);
    
    // Gunakan toLocaleString dengan timezone Jakarta untuk konversi otomatis
    return utcDate.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    }) + ' WIB';
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return '-';
  }
};

/**
 * Format Date object ke format datetime-local input
 * @param date - Date object
 * @returns formatted string untuk datetime-local input
 */
export const formatDateTimeLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Get current datetime dalam WIB untuk default values
 * @returns current datetime dalam format WIB untuk input
 */
export const getCurrentWIBDateTime = (): string => {
  const now = new Date();
  
  // Gunakan convertUTCToWIB untuk konsistensi
  return convertUTCToWIB(now.toISOString());
};

/**
 * Validasi apakah end time setelah start time (dalam WIB)
 * @param startTimeWIB - start time dalam WIB
 * @param endTimeWIB - end time dalam WIB
 * @returns true jika valid
 */
export const validateTimeRange = (startTimeWIB: string, endTimeWIB: string): boolean => {
  if (!startTimeWIB || !endTimeWIB) return false;
  
  // Konversi ke UTC untuk perbandingan yang akurat
  const startUTC = convertWIBToUTC(startTimeWIB);
  const endUTC = convertWIBToUTC(endTimeWIB);
  
  const startDate = new Date(startUTC);
  const endDate = new Date(endUTC);
  
  return endDate > startDate;
};