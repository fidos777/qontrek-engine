// lib/import/docxSiteSurvey.ts
// DOCX Site Survey parser for VESB Project F0003 Rev01
// Sections A-G label extractor stubs

import type { SiteSurveyData, SiteSurveySection } from "./types";

// Stub implementation for DOCX parsing
// In a real implementation, this would use a library like mammoth.js or docx.js
// to extract text and parse structured sections

export function parseDOCXFile(file: File): Promise<SiteSurveyData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;

        // STUB: In production, use a proper DOCX parser
        // For now, return a placeholder structure
        const data = await extractSiteSurveySections(arrayBuffer);
        resolve(data);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read DOCX file"));
    reader.readAsArrayBuffer(file);
  });
}

async function extractSiteSurveySections(buffer: ArrayBuffer): Promise<SiteSurveyData> {
  // STUB: This is a placeholder implementation
  // In production, this would use mammoth.js or similar to extract:
  // - Section A: Site Information
  // - Section B: Access & Utilities
  // - Section C: Space Requirements
  // - Section D: Environmental Conditions
  // - Section E: Safety & Compliance
  // - Section F: Existing Infrastructure
  // - Section G: Recommendations

  const placeholderSection = (label: string): SiteSurveySection => ({
    label,
    fields: {
      note: `[Placeholder] Section ${label} parsing not yet implemented`,
      status: "pending_extraction",
    },
  });

  return {
    sections: {
      A: placeholderSection("Site Information"),
      B: placeholderSection("Access & Utilities"),
      C: placeholderSection("Space Requirements"),
      D: placeholderSection("Environmental Conditions"),
      E: placeholderSection("Safety & Compliance"),
      F: placeholderSection("Existing Infrastructure"),
      G: placeholderSection("Recommendations"),
    },
  };
}

export function validateSiteSurveyData(data: SiteSurveyData): string[] {
  const errors: string[] = [];

  const requiredSections = ["A", "B", "C", "D", "E", "F", "G"] as const;
  for (const section of requiredSections) {
    if (!data.sections[section]) {
      errors.push(`Missing section ${section}`);
    } else if (!data.sections[section].label) {
      errors.push(`Section ${section} missing label`);
    }
  }

  return errors;
}

export function siteSurveyToJSON(data: SiteSurveyData): string {
  return JSON.stringify(data, null, 2);
}

// Generate sample DOCX template (stub)
export function generateSiteSurveyTemplate(): void {
  // STUB: In production, this would generate a proper DOCX file
  // with sections A-G pre-formatted for data entry

  const templateText = `
VESB Project F0003 Rev01 - Site Survey Template

Section A: Site Information
- Site Name: [Enter site name]
- Location: [Enter address]
- Survey Date: [Enter date]

Section B: Access & Utilities
- Road Access: [Describe]
- Power Supply: [Details]
- Water Supply: [Details]

Section C: Space Requirements
- Total Area: [m²]
- Clear Height: [m]
- Loading Bays: [Number]

Section D: Environmental Conditions
- Temperature Range: [°C]
- Humidity: [%]
- Ventilation: [Describe]

Section E: Safety & Compliance
- Fire Safety: [Details]
- Emergency Exits: [Number and locations]
- Safety Equipment: [List]

Section F: Existing Infrastructure
- Structural Integrity: [Assessment]
- Electrical Systems: [Condition]
- Mechanical Systems: [Condition]

Section G: Recommendations
- Priority Actions: [List]
- Budget Estimate: [Amount]
- Timeline: [Duration]
`;

  const blob = new Blob([templateText], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "vesb_site_survey_template.txt");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log("[INFO] DOCX template generation is a stub. Download text template instead.");
}
