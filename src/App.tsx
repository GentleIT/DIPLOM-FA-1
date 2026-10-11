import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import AIAssistantWidget from "@/components/AIAssistantWidget";
import AdminSiteEditor from "@/components/AdminSiteEditor";
import Index from "./pages/Index";
import Records from "./pages/Records";
import SubmitRecord from "./pages/SubmitRecord";
import EditorialBoard from "./pages/EditorialBoard";
import About from "./pages/About";
import Archive from "./pages/Archive";
import CurrentIssue from "./pages/CurrentIssue";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import NotFound from "./pages/NotFound";
import { authApi } from "@/lib/api";
import React, { useState, useEffect } from "react";

const queryClient = new QueryClient();

// --- УПРОЩЕННАЯ ЗАЩИТА (ПУСКАЕТ ВСЕХ АВТОРИЗОВАННЫХ) ---
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (!authApi.getToken()) {
        navigate('/admin-login');
        setLoading(false);
        return;
      }
      const { user } = await authApi.getSession();
      if (!user) {
        navigate('/admin-login');
      } else {
        setIsAuthenticated(true);
      }
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Проверка доступа...</div>;
  }

  return isAuthenticated ? <>{children}</> : null;
};

const AppContent = () => {
  const location = useLocation();
  const isCurrentIssuePage = location.pathname === '/current-issue';

  return (
    <div className="min-h-screen flex flex-col">
      {!isCurrentIssuePage && <Header />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/records" element={<Records />} />
          <Route path="/submit" element={<SubmitRecord />} />
          <Route path="/editorial-board" element={<EditorialBoard />} />
          <Route path="/about" element={<About />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/current-issue" element={<CurrentIssue />} />
          
          {/* Страница логина */}
          <Route path="/admin-login" element={<AdminLogin />} />
          
          {/* Защищенная админка */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <AdminSiteEditor />
      {!isCurrentIssuePage && <AIAssistantWidget />}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;