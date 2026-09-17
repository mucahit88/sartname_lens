export type Confidence = "high" | "medium" | "low";
export type AttentionType = "manual_review" | "template_carryover" | "vendor_signal" | "contradiction" | "duplicate" | "ambiguity";

export type ArchitectureItem = { category: string; label: string; value: string };
export type SpecificationSection = {
  id: string; sourceLabel: string;
  canonicalCategory: "GENERATOR" | "XRAY_TUBE" | "TUBE_SUPPORT" | "PATIENT_TABLE" | "DETECTOR" | "WALL_STAND" | "COLLIMATOR" | "IMAGING_SYSTEM" | "CLINICAL" | "CONNECTIVITY" | "ACCESSORY" | "INSTALLATION" | "SERVICE" | "ADMINISTRATIVE" | "DOCUMENTATION" | "OTHER";
  classification: "DEVICE_TECHNICAL" | "CLINICAL" | "ACCESSORY" | "INSTALLATION" | "SERVICE" | "ADMINISTRATIVE" | "DOCUMENTATION";
  requirementCount?: number; productMatchRelevance: "very_high" | "high" | "medium" | "low" | "none";
};
export type AttentionItem = { id: string; sourceClause?: string; title: string; description: string; type: AttentionType };
export type Analysis = {
  id: string; title: string; documentDate: string; pageCount: number;
  classification: { modality: string; systemClass: string; segment?: string; confidence: Confidence; summary: string };
  architecture: ArchitectureItem[]; sections: SpecificationSection[];
  metrics: { technicalRequirements: number; criticalConflicts: number; manualReviews: number; anomalies: number };
  attentionItems: AttentionItem[];
};
