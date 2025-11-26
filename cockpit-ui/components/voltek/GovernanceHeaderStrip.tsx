"use client";

type GovernanceHeaderStripProps = {
  title?: string;
  status?: "active" | "pending" | "inactive";
};

export default function GovernanceHeaderStrip({
  title = "Governance",
  status = "active"
}: GovernanceHeaderStripProps) {
  const statusColors = {
    active: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400",
    inactive: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b">
      <h2 className="text-lg font-semibold">{title}</h2>
      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    </div>
  );
}
