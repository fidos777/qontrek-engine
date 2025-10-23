"use client"

import * as React from "react"
import { CheckCircle2 } from "lucide-react"
import { Tooltip } from "@/components/ui/tooltip"

type Signals = {
  etag?: string
  ack_age_ms?: number
  schema_pass?: boolean
  freshness_ms?: number
  rate_headroom?: number
  mode?: "demo" | "live"
  generated_at?: string
}

type Props = {
  source: string
  className?: string
}

// Lazy import for framer-motion
const MotionDiv = React.lazy(async () => {
  const { motion } = await import("framer-motion")
  return { default: motion.div }
})

function computeScore(s: Signals) {
  const etag = s.etag ? 100 : 50
  const ack = s.ack_age_ms != null ? Math.max(0, 100 - s.ack_age_ms / 600) : 50
  const schem = s.schema_pass ? 100 : 0
  const fresh = s.freshness_ms != null ? Math.max(0, 100 - s.freshness_ms / 600) : 50
  const weights = { etag: 0.3, ack: 0.3, schem: 0.2, fresh: 0.2 }
  const total = etag * weights.etag + ack * weights.ack + schem * weights.schem + fresh * weights.fresh
  return Math.round(Math.min(100, Math.max(0, total)))
}

function computeFactorScores(s: Signals) {
  return {
    etag: s.etag ? 100 : 50,
    ack: s.ack_age_ms != null ? Math.max(0, 100 - s.ack_age_ms / 600) : 50,
    schema: s.schema_pass ? 100 : 0,
    freshness: s.freshness_ms != null ? Math.max(0, 100 - s.freshness_ms / 600) : 50,
  }
}

function emitTelemetry(score: number) {
  const timestamp = new Date().toISOString()
  const entry = {
    event: "ui.confidence.score",
    score,
    timestamp,
  }
  console.log("[TELEMETRY]", JSON.stringify(entry))
}

export default function ConfidenceMeterAnimated({ source, className = "" }: Props) {
  const [score, setScore] = React.useState<number>(50)
  const [factors, setFactors] = React.useState<ReturnType<typeof computeFactorScores>>({
    etag: 50,
    ack: 50,
    schema: 50,
    freshness: 50,
  })
  const [isLoading, setIsLoading] = React.useState(true)
  const [hasMissingFields, setHasMissingFields] = React.useState(false)
  const prefersReducedMotion = React.useRef(false)

  React.useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    prefersReducedMotion.current = mediaQuery.matches

    const handleChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion.current = e.matches
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  React.useEffect(() => {
    async function fetchSignals() {
      try {
        const response = await fetch("/proof/signals.json")
        if (!response.ok) {
          throw new Error("Failed to fetch signals")
        }
        const signals: Signals = await response.json()

        // Check for missing fields
        const missing = !signals.etag || signals.ack_age_ms == null ||
                       signals.schema_pass == null || signals.freshness_ms == null
        setHasMissingFields(missing)

        const newScore = computeScore(signals)
        const newFactors = computeFactorScores(signals)

        setScore(newScore)
        setFactors(newFactors)
        emitTelemetry(newScore)
      } catch (error) {
        // Fallback to neutral 50 on error
        setScore(50)
        setHasMissingFields(true)
        console.error("Error fetching signals:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSignals()

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchSignals, 5000)
    return () => clearInterval(interval)
  }, [source])

  const tooltipContent = (
    <div className="text-left">
      <div className="font-semibold mb-1">Factor Contributions:</div>
      <div className="space-y-1 text-xs">
        <div>ETag: {factors.etag.toFixed(0)}/100 (30%)</div>
        <div>ACK Age: {factors.ack.toFixed(0)}/100 (30%)</div>
        <div>Schema: {factors.schema.toFixed(0)}/100 (20%)</div>
        <div>Freshness: {factors.freshness.toFixed(0)}/100 (20%)</div>
      </div>
      {hasMissingFields && (
        <div className="text-yellow-400 mt-2 text-xs">
          ⚠ Some fields missing - using neutral defaults
        </div>
      )}
    </div>
  )

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-32 h-6 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <Tooltip content={tooltipContent}>
      <div
        className={`inline-flex items-center gap-2 ${className}`}
        aria-label={`Confidence ${score}%`}
        role="meter"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="relative w-32 h-6 bg-gray-200 rounded-md overflow-hidden">
          <React.Suspense fallback={
            <div
              className="absolute inset-y-0 left-0 rounded-md bg-gradient-to-r from-blue-500 to-green-500"
              style={{ width: `${score}%` }}
            />
          }>
            {prefersReducedMotion.current ? (
              <div
                className="absolute inset-y-0 left-0 rounded-md bg-gradient-to-r from-blue-500 to-green-500"
                style={{ width: `${score}%` }}
              />
            ) : (
              <MotionDiv
                className="absolute inset-y-0 left-0 rounded-md bg-gradient-to-r from-blue-500 to-green-500"
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            )}
          </React.Suspense>
          <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-700">
            {score}%
          </div>
        </div>
        {score >= 90 && (
          <CheckCircle2 className="w-5 h-5 text-green-600" aria-hidden="true" />
        )}
      </div>
    </Tooltip>
  )
}
