import { AnalysisOverview } from "@/components/analysis-overview";
import { findAnalysis } from "@/app/data/fixtures";
export default async function AnalysisPage({params}:{params:Promise<{analysisId:string}>}){const {analysisId}=await params;return <AnalysisOverview analysis={findAnalysis(analysisId)}/>}
