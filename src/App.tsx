import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Loader2 } from "lucide-react";

// ─── Carga eager: páginas del flujo de autenticación (críticas para el primer render) ─
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

// ─── Carga lazy: páginas del dashboard (se cargan bajo demanda) ─
const Dashboard = lazy(() => import("./pages/Dashboard"));
const NewAnalysis = lazy(() => import("./pages/NewAnalysis"));
const CompanyProfile = lazy(() => import("./pages/CompanyProfile"));
const TechnicalMemory = lazy(() => import("./pages/TechnicalMemory"));
const History = lazy(() => import("./pages/History"));
const ReportView = lazy(() => import("./pages/ReportView"));
const Settings = lazy(() => import("./pages/Settings"));
const RequestDemo = lazy(() => import("./pages/RequestDemo"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

// ─── Loading fallback para Suspense ─
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="animate-spin text-primary" size={32} />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <LanguageProvider>
        <CurrencyProvider>
        <BrowserRouter>
          <AuthProvider>
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/request-demo" element={<RequestDemo />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/dashboard/new-analysis" element={<ProtectedRoute><NewAnalysis /></ProtectedRoute>} />
                  <Route path="/dashboard/company" element={<ProtectedRoute><CompanyProfile /></ProtectedRoute>} />
                  <Route path="/dashboard/technical-memory" element={<ProtectedRoute><TechnicalMemory /></ProtectedRoute>} />
                  <Route path="/dashboard/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
                  <Route path="/dashboard/tenders" element={<ProtectedRoute><History /></ProtectedRoute>} />
                  <Route path="/dashboard/reports" element={<ProtectedRoute><History /></ProtectedRoute>} />
                  <Route path="/dashboard/report/:tenderId" element={<ProtectedRoute><ReportView /></ProtectedRoute>} />
                  <Route path="/dashboard/informe/:tenderId" element={<ProtectedRoute><ReportView /></ProtectedRoute>} />
                  <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </AuthProvider>
        </BrowserRouter>
        </CurrencyProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
