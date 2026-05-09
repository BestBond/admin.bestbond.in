import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom"
import SignUp from "./pages/SignUp"
import Dashboard from "./pages/Dashboard"
import UserList from "./pages/UserList"
import UserProfile from "./pages/UserProfile"
import UserTransactions from "./pages/UserTransactions"
import AccountManagement from "./pages/AccountManagement"
import SecurityPreferences from "./pages/SecurityPreferences"
import SystemNotifications from "./pages/SystemNotifications"
import CouponGeneration from "./pages/CouponGeneration"
import ApprovalList from "./pages/ApprovalList"
import ApprovalDetails from "./pages/ApprovalDetails"
import CouponPreview from "./pages/CouponPreview"
import CouponExport from "./pages/CouponExport"

const ProtectedRoute = ({ children, requiredRole }: { children: any, requiredRole?: string }) => {
  const token = localStorage.getItem('accessToken');
  const userRoleStr = localStorage.getItem('userRole');
  const userRoles = userRoleStr ? JSON.parse(userRoleStr) : [];
const isSuperAdmin = userRoles.includes('SUPERADMIN');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === 'SUPERADMIN' && !isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<SignUp />} />
        
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute requiredRole="SUPERADMIN"><UserList /></ProtectedRoute>} />
        <Route path="/users/profile/:userId" element={<ProtectedRoute requiredRole="SUPERADMIN"><UserProfile /></ProtectedRoute>} />
        <Route path="/users/transactions/:userId" element={<ProtectedRoute requiredRole="SUPERADMIN"><UserTransactions /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><AccountManagement /></ProtectedRoute>} />
        <Route path="/settings/security" element={<ProtectedRoute><SecurityPreferences /></ProtectedRoute>} />
        <Route path="/settings/notifications" element={<ProtectedRoute><SystemNotifications /></ProtectedRoute>} />
        <Route path="/coupon-generation/form" element={<ProtectedRoute requiredRole="SUPERADMIN"><CouponGeneration /></ProtectedRoute>} />
        <Route path="/coupon-generation/preview/:batchId" element={<ProtectedRoute requiredRole="SUPERADMIN"><CouponPreview /></ProtectedRoute>} />
        <Route path="/coupon-generation/export/:batchId" element={<ProtectedRoute requiredRole="SUPERADMIN"><CouponExport /></ProtectedRoute>} />
        <Route path="/approvals" element={<ProtectedRoute><ApprovalList /></ProtectedRoute>} />
        <Route path="/approvals/details/:requestId" element={<ProtectedRoute><ApprovalDetails /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
