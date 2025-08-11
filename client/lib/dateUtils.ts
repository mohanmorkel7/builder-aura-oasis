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
 * Formats a date to IST with time included
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

  // Timestamp parsing and validation completed

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: IST_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...options,
  };

  try {
    // Format the date to IST with explicit timezone indicator
    const formatter = new Intl.DateTimeFormat("en-IN", defaultOptions);
    const formattedDate = formatter.format(dateObj);

    // Debug logging (only in development)
    if (process.env.NODE_ENV === "development") {
      console.log(`IST Formatting Result:`, {
        input: typeof date === "string" ? date : dateObj.toISOString(),
        formattedIST: formattedDate,
        timezone: IST_TIMEZONE,
      });
    }

    // Add IST indicator to make timezone clear
    return `${formattedDate} IST`;
  } catch (error) {
    console.warn("Error formatting date to IST:", error);
    // Fallback to manual IST conversion
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istDate = new Date(dateObj.getTime() + istOffset);

    const day = istDate.getUTCDate();
    const month = istDate.toLocaleString("en-IN", {
      month: "short",
      timeZone: "UTC",
    });
    const year = istDate.getUTCFullYear();
    let hours = istDate.getUTCHours();
    const minutes = istDate.getUTCMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12

    return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm} IST`;
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
