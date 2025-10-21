import React from "react";

type ChangeReceipt = {
  receipt_id: string;
  issued_at: string;
  change_type: string;
  summary: string;
  diff_hash: string;
};

interface ChangeReceiptsProps {
  receipts: ChangeReceipt[];
}

export function ChangeReceipts({ receipts }: ChangeReceiptsProps) {
  if (receipts.length === 0) {
    return <p className="text-sm text-slate-500">No change receipts recorded.</p>;
  }

  return (
    <table className="w-full table-auto border-separate border-spacing-y-2">
      <thead>
        <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <th>Receipt</th>
          <th>Issued</th>
          <th>Type</th>
          <th>Summary</th>
        </tr>
      </thead>
      <tbody>
        {receipts.map((receipt) => (
          <tr key={receipt.receipt_id} className="rounded-md bg-white shadow-sm">
            <td className="px-3 py-2 text-sm font-medium text-slate-900">
              {receipt.receipt_id}
            </td>
            <td className="px-3 py-2 text-sm text-slate-600">{receipt.issued_at}</td>
            <td className="px-3 py-2 text-sm capitalize text-slate-700">
              {receipt.change_type}
            </td>
            <td className="px-3 py-2 text-sm text-slate-700">{receipt.summary}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ChangeReceipts;
