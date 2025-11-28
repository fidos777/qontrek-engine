"use client";

import { useParams } from 'next/navigation';
import { verticalRegistry } from '@/lib/verticals';
import type { VerticalId } from '@/lib/verticals/types';
import { DashboardShell } from '@/components/dashboard';

const validVerticals: VerticalId[] = [
  'solar',
  'takaful',
  'ecommerce',
  'training',
  'construction',
  'automotive',
];

export default function VerticalPage() {
  const params = useParams();
  const verticalId = params.vertical as string;

  if (!validVerticals.includes(verticalId as VerticalId)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">404</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Invalid Vertical
          </h1>
          <p className="text-gray-500 mb-4">
            The vertical &quot;{verticalId}&quot; is not recognized.
          </p>
          <p className="text-sm text-gray-400">
            Valid verticals: {validVerticals.join(', ')}
          </p>
        </div>
      </div>
    );
  }

  const entry = verticalRegistry.get(verticalId as VerticalId);

  if (!entry) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md text-center">
          <div className="text-yellow-500 text-5xl mb-4">!</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Vertical Not Found
          </h1>
          <p className="text-gray-500">
            The configuration for &quot;{verticalId}&quot; could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  return <DashboardShell template={entry.template} />;
}
