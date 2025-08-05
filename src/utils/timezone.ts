// Utility functions untuk konversi timezone WIB ke UTC
export const WIB_OFFSET = 7; // UTC+7

/**
 * Konversi datetime dari WIB ke UTC
 * @param wibDatetime - datetime dalam format WIB (naive datetime)
 * @returns datetime dalam format UTC ISO string
 */
export const convertWIBToUTC = (wibDatetime: string): string => {
  if (!wibDatetime) return '';
  
  // Parse datetime - browser akan menginterpretasi sebagai waktu lokal
  const wibDate = new Date(wibDatetime);
  
  // toISOString() otomatis mengkonversi ke UTC
  return wibDate.toISOString();
};

/**
 * Konversi datetime dari UTC ke WIB untuk display
 * @param utcDatetime - datetime dalam format UTC ISO string
 * @returns datetime dalam format WIB untuk input datetime-local
 */
export const convertUTCToWIB = (utcDatetime: string): string => {
  if (!utcDatetime) return '';
  
  // Parse UTC datetime
  const utcDate = new Date(utcDatetime);
  
  // Untuk input datetime-local, kita perlu mendapatkan waktu lokal
  // Gunakan offset timezone browser untuk konversi yang akurat
  const timezoneOffset = utcDate.getTimezoneOffset() * 60 * 1000;
  const localDate = new Date(utcDate.getTime() - timezoneOffset);
  
  return formatDateTimeLocal(localDate);
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
  // Gunakan waktu lokal langsung untuk datetime-local input
  return formatDateTimeLocal(now);
};

/**
 * Format datetime untuk display dengan timezone info
 * @param utcDatetime - datetime dalam format UTC
 * @returns formatted string dengan timezone info
 */
export const formatDateTimeWithTimezone = (utcDatetime: string): string => {
  if (!utcDatetime) return '-';
  
  const utcDate = new Date(utcDatetime);
  
  // Gunakan toLocaleString dengan timezone untuk konversi otomatis
  return utcDate.toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta'
  }) + ' WIB';
};

/**
 * Validasi apakah end time setelah start time (dalam WIB)
 * @param startTimeWIB - start time dalam WIB
 * @param endTimeWIB - end time dalam WIB
 * @returns true jika valid
 */
export const validateTimeRange = (startTimeWIB: string, endTimeWIB: string): boolean => {
  if (!startTimeWIB || !endTimeWIB) return false;
  
  const startDate = new Date(startTimeWIB);
  const endDate = new Date(endTimeWIB);
  
  return endDate > startDate;
};