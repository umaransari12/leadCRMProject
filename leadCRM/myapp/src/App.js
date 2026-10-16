import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "../src/fonts/fonts.css"
import "./common-styles/utilize.scss"
import SigninPage from "./pages/signinPage";
import SignupPage from "./pages/signupPage";
import DashboardPage from "./pages/dashboardPage";
import Leadpage from "./pages/leadpage";
import AddLeadPage from "./pages/addLeadPage";
import AnalyticsPage from "./pages/analyticsPage";
import SettingsPage from "./pages/settingsPage";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const protectedRoutes = [
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/lead', element: <Leadpage /> },
  { path: '/addlead', element: <AddLeadPage /> },
  { path: '/analytics', element: <AnalyticsPage /> },
  { path: '/settings', element: <SettingsPage /> }
];

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <PublicRoute>
            <SigninPage />
          </PublicRoute>
        } />
        <Route path="/signup" element={
          <PublicRoute>
            <SignupPage />
          </PublicRoute>
        } />

        {protectedRoutes.map(({ path, element }) => (
          <Route key={path} path={path} element={<ProtectedRoute>{element}</ProtectedRoute>} />
        ))}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
