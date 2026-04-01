import axios from "axios";
import { AnalysisInput, AnalysisResult } from "./types";

const baseURL = import.meta.env.VITE_API_BASE_URL?.trim() || "/";

const api = axios.create({
  baseURL,
});

export async function analyzeFinancialData(data: AnalysisInput): Promise<AnalysisResult> {
  const response = await api.post<AnalysisResult>("/analyze", data);
  return response.data;
}
