import axios from 'axios';
import { supabase } from '../config/supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const getAuthHeader = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
};

export const analyzeFinancialRisk = async (financialData) => {
  const headers = await getAuthHeader();
  const response = await axios.post(
    `${API_BASE_URL}/api/financial-risk/analyze`,
    financialData,
    { headers }
  );
  return response.data;
};

export const getAnalysisHistory = async (limit = 50, skip = 0) => {
  const headers = await getAuthHeader();
  const response = await axios.get(
    `${API_BASE_URL}/api/financial-risk/history?limit=${limit}&skip=${skip}`,
    { headers }
  );
  return response.data;
};

export const getAnalysisById = async (id) => {
  const headers = await getAuthHeader();
  const response = await axios.get(
    `${API_BASE_URL}/api/financial-risk/history/${id}`,
    { headers }
  );
  return response.data;
};
