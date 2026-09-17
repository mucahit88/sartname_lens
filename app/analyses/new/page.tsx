import { NewAnalysis } from "@/components/new-analysis";
import { AnalysisPipeline } from "@/components/analysis-pipeline";
export default async function NewAnalysisPage({searchParams}:{searchParams:Promise<{processing?:string}>}){const params=await searchParams;return params.processing?<AnalysisPipeline/>:<NewAnalysis/>}
