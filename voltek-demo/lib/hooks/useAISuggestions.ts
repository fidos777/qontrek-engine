'use client';

import { useState, useEffect } from 'react';
import { governanceEvents, GovernanceEvent } from '@/lib/events/governance-events';

export interface AISuggestion {
  leadId: string;
  action: 'call' | 'sms' | 'whatsapp' | 'escalate';
  confidence: number;
  reasoning: string;
}

export function useAISuggestions() {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);

  useEffect(() => {
    const handleSuggestion = (event: GovernanceEvent) => {
      if (event.type === 'ai.suggestion') {
        const { leadId, action, confidence } = event.data;

        setSuggestions((prev) => {
          // Replace if same leadId exists, otherwise add
          const existing = prev.findIndex((s) => s.leadId === leadId);
          const newSuggestion: AISuggestion = {
            leadId,
            action: action as AISuggestion['action'],
            confidence,
            reasoning: `AI analysis suggests ${action} based on lead behavior patterns`,
          };

          if (existing !== -1) {
            const updated = [...prev];
            updated[existing] = newSuggestion;
            return updated;
          }

          return [...prev, newSuggestion];
        });
      }
    };

    governanceEvents.on('ai.suggestion', handleSuggestion);

    return () => {
      governanceEvents.off('ai.suggestion', handleSuggestion);
    };
  }, []);

  const getSuggestionForLead = (leadId: string): AISuggestion | undefined => {
    return suggestions.find((s) => s.leadId === leadId);
  };

  return { suggestions, getSuggestionForLead };
}
