import axios from 'axios';
import { supabase } from '../config/supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const getAuthHeader = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
};

export const checkURL = async (url) => {
  const headers = await getAuthHeader();
  const response = await axios.post(
    `${API_BASE_URL}/api/cybersecurity/check-url`,
    { url },
    { headers }
  );
  return response.data;
};

export const checkBatchURLs = async (urls) => {
  const headers = await getAuthHeader();
  const response = await axios.post(
    `${API_BASE_URL}/api/cybersecurity/check-batch`,
    { urls },
    { headers }
  );
  return response.data;
};

export const getCheckHistory = async (limit = 50, skip = 0) => {
  const headers = await getAuthHeader();
  const response = await axios.get(
    `${API_BASE_URL}/api/cybersecurity/history?limit=${limit}&skip=${skip}`,
    { headers }
  );
  return response.data;
};

export const getCheckById = async (id) => {
  const headers = await getAuthHeader();
  const response = await axios.get(
    `${API_BASE_URL}/api/cybersecurity/history/${id}`,
    { headers }
  );
  return response.data;
};
