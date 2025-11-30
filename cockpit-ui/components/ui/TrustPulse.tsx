"use client";

type Props = {
  children: React.ReactNode;
};

/**
 * Wrap any card to add a subtle “live / trusted” pulse.
 * Usage: <TrustPulse><YourCard/></TrustPulse>
 */
export default function TrustPulse({ children }: Props) {
  return (
    <div className="relative">
      {children}
      {/* soft pulsing ring */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-emerald-500/25 animate-pulse"
      />
    </div>
  );
}

