"use client";

import * as React from "react";
import type { WidgetComponentProps } from "@/lib/widgets/types";
import { WidgetCard } from "../WidgetCard";

export function DefaultRenderer({ instance }: WidgetComponentProps) {
  const { schema, state, error, data } = instance;

  return (
    <WidgetCard
      title={schema.title || "Unknown Widget"}
      subtitle={`Type: ${schema.widget_type}`}
      loading={state === "loading"}
      error={error}
    >
      <div className="text-sm text-gray-500 dark:text-gray-400">
        <p className="mb-2">Widget type not implemented: {schema.widget_type}</p>
        <details className="mt-2">
          <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
            View raw data
          </summary>
          <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-32">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      </div>
    </WidgetCard>
  );
}

export default DefaultRenderer;
