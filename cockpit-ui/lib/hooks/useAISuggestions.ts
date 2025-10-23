'use client';

import { useState, useEffect } from 'react';
import { governanceEvents } from '../events/governance-events';

/**
 * AI Suggestion interface
 * Represents an AI-driven recommendation for lead engagement
 */
export interface AISuggestion {
  leadId: string;
  action: 'call' | 'sms' | 'whatsapp' | 'escalate';
  confidence: number;
  reasoning: string;
  timestamp?: number;
}

/**
 * Hook for subscribing to AI suggestions from the governance event bus
 * Maintains a list of latest suggestions (one per lead)
 *
 * @returns Array of active AI suggestions
 */
export function useAISuggestions() {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);

  useEffect(() => {
    const handler = (e: any) => {
      const suggestion = e.detail.data as AISuggestion;

      // Add timestamp if not present
      const enrichedSuggestion = {
        ...suggestion,
        timestamp: suggestion.timestamp || Date.now()
      };

      // Update suggestions, keeping only the latest per leadId
      setSuggestions(prev => {
        const filtered = prev.filter(s => s.leadId !== enrichedSuggestion.leadId);
        return [...filtered, enrichedSuggestion];
      });
    };

    // Subscribe to ai.suggestion events
    governanceEvents.on('ai.suggestion', handler);

    // Cleanup on unmount
    return () => {
      governanceEvents.off('ai.suggestion', handler);
    };
  }, []);

  return suggestions;
}

/**
 * Hook for monitoring recovery success events
 * Tracks successful lead recovery with amounts
 */
export function useRecoveryEvents() {
  const [recoveries, setRecoveries] = useState<Array<{ leadId: string; amount: number; timestamp: number }>>([]);

  useEffect(() => {
    const handler = (e: any) => {
      const recovery = {
        ...e.detail.data,
        timestamp: Date.now()
      };

      setRecoveries(prev => [...prev, recovery]);
    };

    governanceEvents.on('recovery.success', handler);

    return () => {
      governanceEvents.off('recovery.success', handler);
    };
  }, []);

  return recoveries;
}

/**
 * Hook for monitoring badge cycle events
 * Tracks which governance badge is currently active
 */
export function useBadgeCycle() {
  const [currentBadge, setCurrentBadge] = useState<{ badgeId: string; name: string } | null>(null);

  useEffect(() => {
    const handler = (e: any) => {
      setCurrentBadge(e.detail.data);
    };

    governanceEvents.on('badge.cycle', handler);

    return () => {
      governanceEvents.off('badge.cycle', handler);
    };
  }, []);

  return currentBadge;
}
