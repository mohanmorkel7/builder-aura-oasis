// Utility functions for handling IST (India Standard Time) formatting

export const IST_TIMEZONE = "Asia/Kolkata";

/**
 * Formats a date to IST timezone with various options
 */
export const formatToIST = (
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {},
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  };

  return dateObj.toLocaleDateString("en-IN", defaultOptions);
};

/**
 * Formats a date to local timezone with time included
 */
export const formatToISTDateTime = (
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {},
): string => {
  let dateObj: Date;

  if (typeof date === "string") {
    // Handle various timestamp formats from database
    if (date.includes("T") && (date.includes("Z") || date.includes("+"))) {
      // ISO format (UTC) - e.g., "2025-08-11T05:31:00.000Z"
      dateObj = new Date(date);
    } else if (date.includes("-") && date.includes(":")) {
      // SQL format - assume UTC if no timezone specified
      dateObj = new Date(date + (date.includes("Z") ? "" : "Z"));
    } else {
      // Other formats
      dateObj = new Date(date);
    }
  } else {
    dateObj = date;
  }

  // Ensure we have a valid date
  if (isNaN(dateObj.getTime())) {
    return "Invalid Date";
  }

  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...options,
  };

  try {
    // Format the date in user's local timezone (no forced timezone conversion)
    const formatter = new Intl.DateTimeFormat("en-IN", defaultOptions);
    const formattedDate = formatter.format(dateObj);

    return formattedDate;
  } catch (error) {
    console.warn("Error formatting date:", error);
    // Fallback to simple local formatting
    const day = dateObj.getDate();
    const month = dateObj.toLocaleString("en-IN", { month: "short" });
    const year = dateObj.getFullYear();
    let hours = dateObj.getHours();
    const minutes = dateObj.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12

    return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
  }
};

/**
 * Formats a date to just the date part in IST (YYYY-MM-DD format)
 */
export const formatToISTDateOnly = (date: string | Date): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Convert to IST and extract date part
  const istDate = new Date(
    dateObj.toLocaleString("en-US", { timeZone: IST_TIMEZONE }),
  );

  return istDate.toISOString().split("T")[0];
};

/**
 * Gets current IST timestamp
 */
export const getCurrentISTTimestamp = (): string => {
  return new Date().toLocaleString("en-US", { timeZone: IST_TIMEZONE });
};

/**
 * Gets current date/time formatted in IST for display
 */
export const getCurrentISTDateTime = (): string => {
  return formatToISTDateTime(new Date());
};

/**
 * Checks if a date is overdue (past current IST time)
 */
export const isOverdue = (dueDate: string | Date): boolean => {
  const dueDateObj = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  const currentIST = new Date(getCurrentISTTimestamp());

  return dueDateObj < currentIST;
};

/**
 * Gets relative time in IST (e.g., "2 hours ago", "in 3 days")
 */
export const getRelativeTimeIST = (date: string | Date): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const currentIST = new Date(getCurrentISTTimestamp());

  const diffMs = currentIST.getTime() - dateObj.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60)
    return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;

  return formatToIST(dateObj);
};
