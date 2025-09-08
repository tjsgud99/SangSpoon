import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import SiteManagement from "./pages/SiteManagement";
import AllSitesPrint from "./pages/AllSitesPrint";
import SitePrint from "./pages/SitePrint";
import EmailAlerts from "./pages/EmailAlerts";

import SiteDetails from "./pages/SiteDetails";
import Statistics from "./pages/Statistics";
import Settings from "./pages/Settings";
import Test from "./pages/Test";
import NotFound from "./pages/NotFound";
import AuthExample from "./components/AuthExample";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";



const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/sites" element={
              <ProtectedRoute>
                <SiteManagement />
              </ProtectedRoute>
            } />
            <Route path="/sites/:id" element={
              <ProtectedRoute>
                <SiteDetails />
              </ProtectedRoute>
            } />
            
            <Route path="/all-sites-print" element={
              <ProtectedRoute>
                <AllSitesPrint />
              </ProtectedRoute>
            } />
            
            <Route path="/site-print" element={
              <ProtectedRoute>
                <SitePrint />
              </ProtectedRoute>
            } />

            <Route path="/statistics" element={
              <ProtectedRoute>
                <Statistics />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/test" element={
              <ProtectedRoute>
                <Test />
              </ProtectedRoute>
            } />
            <Route path="/test/:id" element={
              <ProtectedRoute>
                <Test />
              </ProtectedRoute>
            } />
            <Route path="/api-test" element={<AuthExample />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            <Route path="/email-alerts" element={<EmailAlerts />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
