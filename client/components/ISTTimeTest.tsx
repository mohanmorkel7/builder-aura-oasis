import React, { useState, useEffect } from "react";
import {
  formatToISTDateTime,
  getCurrentISTDateTime,
  IST_TIMEZONE,
} from "@/lib/dateUtils";

export function ISTTimeTest() {
  const [currentTime, setCurrentTime] = useState("");
  const [testTimestamp, setTestTimestamp] = useState("");
  const [debugInfo, setDebugInfo] = useState<any>({});

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

      // Test with a sample database timestamp format (UTC)
      const sampleDBTimestamp = "2025-08-11T05:31:00.000Z"; // UTC timestamp equivalent to 11:01 AM IST
      const testIST = formatToISTDateTime(sampleDBTimestamp);

      setDebugInfo({
        currentUTC: now.toISOString(),
        currentLocal: now.toString(),
        sampleDBTimestamp,
        sampleISTFormatted: testIST,
        timezoneOffset: now.getTimezoneOffset(),
      });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 border rounded-lg bg-blue-50 mb-4">
      <h3 className="font-semibold text-blue-800 mb-2">
        IST Time Test & Debug
      </h3>
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
        <hr className="my-2" />
        <div className="text-xs text-gray-600">
          <div>
            <strong>Debug Info:</strong>
          </div>
          <div>
            <strong>Current UTC:</strong> {debugInfo.currentUTC}
          </div>
          <div>
            <strong>Sample DB Timestamp (UTC):</strong>{" "}
            {debugInfo.sampleDBTimestamp}
          </div>
          <div>
            <strong>Sample Formatted to IST:</strong>{" "}
            {debugInfo.sampleISTFormatted}
          </div>
          <div>
            <strong>Browser TZ Offset (min):</strong> {debugInfo.timezoneOffset}
          </div>
        </div>
      </div>
    </div>
  );
}
