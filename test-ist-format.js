// Test IST formatting
const IST_TIMEZONE = "Asia/Kolkata";

const formatToISTDateTime = (date) => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  const defaultOptions = {
    timeZone: IST_TIMEZONE,
    day: "numeric",
    month: "short", 
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  return dateObj.toLocaleString("en-IN", defaultOptions);
};

// Test with current date
const now = new Date();
console.log("Current time in IST:", formatToISTDateTime(now));

// Test with specific UTC time
const utcTime = new Date('2025-01-11T10:28:00Z');
console.log("UTC 10:28 formatted to IST:", formatToISTDateTime(utcTime));

// Test with another UTC time
const utcTime2 = new Date('2025-01-11T05:28:00Z');
console.log("UTC 05:28 formatted to IST:", formatToISTDateTime(utcTime2));
