import React from "react";
import { formatToISTDateTime } from "@/lib/dateUtils";

export function TimezoneTest() {
  const sampleTimestamp = "2025-08-11T05:31:00.000Z"; // Sample UTC timestamp
  const currentTime = new Date();
  
  return (
    <div className="p-4 border rounded-lg bg-yellow-50 mb-4">
      <h3 className="font-semibold text-yellow-800 mb-2">Timezone Test</h3>
      <div className="space-y-1 text-sm">
        <div><strong>Sample DB Timestamp (UTC):</strong> {sampleTimestamp}</div>
        <div><strong>Formatted with new function:</strong> {formatToISTDateTime(sampleTimestamp)}</div>
        <div><strong>Current time formatted:</strong> {formatToISTDateTime(currentTime)}</div>
        <div><strong>Raw current time:</strong> {currentTime.toString()}</div>
        <div><strong>Current UTC time:</strong> {currentTime.toISOString()}</div>
      </div>
    </div>
  );
}
