import { VoltekDashboardClient } from './components/VoltekDashboardClient';

export const metadata = {
  title: 'Voltek Recovery Dashboard',
  description: 'Payment recovery pipeline for Voltek Energy Solutions',
};

export default async function VoltekPage() {
  return <VoltekDashboardClient />;
}
