"use client";

import { DashboardUnavailable } from "@/components/dashboard/dashboard-states";

export default function DashboardRouteError() {
  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
      <DashboardUnavailable retryHref="/dashboard" />
    </div>
  );
}
