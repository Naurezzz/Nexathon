import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FraudDetection from './pages/FraudDetection';
import ComplianceAudit from './pages/ComplianceAudit';
import DocumentAI from './pages/DocumentAI';
import Reconciliation from './pages/Reconciliation';
import BankruptcyPredictor from './pages/BankruptcyPredictor';
import Reports from './pages/Reports';
import History from './pages/History';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/fraud-detection" element={<ProtectedRoute><FraudDetection /></ProtectedRoute>} />
          <Route path="/compliance-audit" element={<ProtectedRoute><ComplianceAudit /></ProtectedRoute>} />
          <Route path="/document-ai" element={<ProtectedRoute><DocumentAI /></ProtectedRoute>} />
          <Route path="/reconciliation" element={<ProtectedRoute><Reconciliation /></ProtectedRoute>} />
          <Route path="/bankruptcy-predictor" element={<ProtectedRoute><BankruptcyPredictor /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/settings/profile" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/settings/company" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/settings/notifications" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/settings/integrations" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
