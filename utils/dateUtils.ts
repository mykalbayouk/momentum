/**
 * Gets today's date in the local timezone
 * @returns Date object representing today in local timezone
 */
export const getLocalDate = (date?: Date): Date => {
  const now = date || new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000; // Convert minutes to milliseconds
  return new Date(now.getTime() - timezoneOffset);
};

/**
 * Gets today's date in ISO format for database storage
 * @returns ISO string representing today in local timezone
 */
export const getLocalDateISO = (): string => {
  return getLocalDate().toISOString();
};

/**
 * Gets the start of today (00:00:00) in local timezone
 * @returns Date object representing start of today
 */
export const getStartOfToday = (): Date => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();
  return new Date(year, month, date, 0, 0, 0, 0);
};

/**
 * Gets the end of today (23:59:59) in local timezone
 * @returns Date object representing end of today
 */
export const getEndOfToday = (): Date => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();
  return new Date(year, month, date, 23, 59, 59, 999);
};

/**
 * Gets yesterday's date in local timezone
 * @returns Date object representing yesterday
 */
export const getYesterday = (): Date => {
  const yesterday = getLocalDate();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday;
};

/**
 * Gets tomorrow's date in local timezone
 * @returns Date object representing tomorrow
 */
export const getTomorrow = (): Date => {
  const tomorrow = getLocalDate();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
};

/**
 * Gets the start of the current week (Sunday)
 * @returns Date object representing start of current week
 */
export const getStartOfWeek = (): Date => {
  const today = getLocalDate();
  const day = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const diff = today.getDate() - day; // Go back to Sunday
  const sunday = new Date(today);
  sunday.setDate(diff);
  sunday.setHours(0, 0, 0, 0);
  return sunday;
};

/**
 * Gets the end of the current week (Saturday)
 * @returns Date object representing end of current week
 */
export const getEndOfWeek = (): Date => {
  const today = getLocalDate();
  const day = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const diff = today.getDate() - day + 6; // Go forward to Saturday
  const saturday = new Date(today);
  saturday.setDate(diff);
  saturday.setHours(23, 59, 59, 999);
  return saturday;
}; 