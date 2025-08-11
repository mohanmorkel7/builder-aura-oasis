import React, { useState, useEffect } from "react";
import {
  formatToISTDateTime,
  getCurrentISTDateTime,
  IST_TIMEZONE,
} from "@/lib/dateUtils";

export function ISTTimeTest() {
  const [currentTime, setCurrentTime] = useState("");
  const [testTimestamp, setTestTimestamp] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(getCurrentISTDateTime());

      // Show raw timestamp for comparison
      setTestTimestamp(
        now.toLocaleString("en-IN", {
          timeZone: IST_TIMEZONE,
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 border rounded-lg bg-blue-50 mb-4">
      <h3 className="font-semibold text-blue-800 mb-2">IST Time Test</h3>
      <div className="space-y-1 text-sm">
        <div>
          <strong>Current IST (with indicator):</strong> {currentTime}
        </div>
        <div>
          <strong>Raw IST format:</strong> {testTimestamp}
        </div>
        <div>
          <strong>Browser timezone:</strong>{" "}
          {Intl.DateTimeFormat().resolvedOptions().timeZone}
        </div>
        <div>
          <strong>IST Timezone:</strong> {IST_TIMEZONE}
        </div>
      </div>
    </div>
  );
}
