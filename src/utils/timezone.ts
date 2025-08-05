// Utility functions untuk konversi timezone WIB ke UTC
export const WIB_OFFSET = 7; // UTC+7

/**
 * Konversi datetime dari WIB ke UTC
 * @param wibDatetime - datetime dalam format WIB (naive datetime)
 * @returns datetime dalam format UTC ISO string
 */
export const convertWIBToUTC = (wibDatetime: string): string => {
  if (!wibDatetime) return '';
  
  // Parse datetime sebagai WIB (UTC+7)
  const wibDate = new Date(wibDatetime);
  
  // Kurangi 7 jam untuk konversi ke UTC
  const utcDate = new Date(wibDate.getTime() - (WIB_OFFSET * 60 * 60 * 1000));
  
  return utcDate.toISOString();
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
  
  // Tambah 7 jam untuk konversi ke WIB
  const wibDate = new Date(utcDate.getTime() + (WIB_OFFSET * 60 * 60 * 1000));
  
  // Format untuk datetime-local input (YYYY-MM-DDTHH:mm)
  return formatDateTimeLocal(wibDate);
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
  // Tambah offset WIB untuk mendapatkan waktu lokal
  const wibNow = new Date(now.getTime() + (WIB_OFFSET * 60 * 60 * 1000));
  return formatDateTimeLocal(wibNow);
};

/**
 * Format datetime untuk display dengan timezone info
 * @param utcDatetime - datetime dalam format UTC
 * @returns formatted string dengan timezone info
 */
export const formatDateTimeWithTimezone = (utcDatetime: string): string => {
  if (!utcDatetime) return '-';
  
  const utcDate = new Date(utcDatetime);
  const wibDate = new Date(utcDate.getTime() + (WIB_OFFSET * 60 * 60 * 1000));
  
  return wibDate.toLocaleString('id-ID', {
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