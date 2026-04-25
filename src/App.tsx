import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
// Pages
import LoginAdmin from './pages/LoginAdmin';
import LoginPhleb from './pages/LoginPhleb';
import AdminDashboard from './pages/admin/Dashboard';
import PhlebDashboard from './pages/phlebotomist/Dashboard';
import AdminStaff from './pages/admin/Staff';
import AdminOrders from './pages/admin/Orders';
import AdminTests from './pages/admin/Tests';
import PhlebIncome from './pages/phlebotomist/Income';
import NewOrder from './pages/phlebotomist/NewOrder';

const ProtectedRoute = ({ children, requiredRole }: { children: ReactNode, requiredRole?: 'admin' | 'phlebotomist' }) => {
  const { currentUser, userData, loading } = useAuth();
  
  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (!currentUser) return <Navigate to="/" />;
  
  if (requiredRole && userData?.role !== requiredRole) {
    if (userData?.role === 'admin') return <Navigate to="/admin/dashboard" />;
    if (userData?.role === 'phlebotomist') return <Navigate to="/phleb/dashboard" />;
    return <Navigate to="/" />; // fallback
  }

  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPhleb />} />
          <Route path="/admin-login" element={<LoginAdmin />} />
          
          <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><Layout role="admin" /></ProtectedRoute>}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="staff" element={<AdminStaff />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="tests" element={<AdminTests />} />
          </Route>
          
          <Route path="/phleb" element={<ProtectedRoute requiredRole="phlebotomist"><Layout role="phlebotomist" /></ProtectedRoute>}>
            <Route path="dashboard" element={<PhlebDashboard />} />
            <Route path="orders" element={<PhlebDashboard />} />
            <Route path="orders/new" element={<NewOrder />} />
            <Route path="income" element={<PhlebIncome />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
