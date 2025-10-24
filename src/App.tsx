import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "@/context/WalletContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import Landing from "./pages/Landing";
import Welcome from "./pages/Welcome";
import Dashboard from "./pages/Dashboard";
import MPesa from "./pages/MPesa";
import StudentInvestments from "./pages/StudentInvestments";
import Receipts from "./pages/Receipts";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col w-full">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex flex-1 w-full">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 p-6 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WalletProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public pages */}
            <Route path="/" element={<Landing />} />
            <Route path="/welcome" element={<Welcome />} />
            
            {/* Protected app routes with layout */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <AppLayout><Dashboard /></AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/mpesa" 
              element={
                <ProtectedRoute>
                  <AppLayout><MPesa /></AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/investments" 
              element={
                <ProtectedRoute>
                  <AppLayout><StudentInvestments /></AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/receipts" 
              element={
                <ProtectedRoute>
                  <AppLayout><Receipts /></AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <AppLayout><Profile /></AppLayout>
                </ProtectedRoute>
              } 
            />
            
            {/* Redirect old routes to M-Pesa - Also protected */}
            <Route 
              path="/onramp" 
              element={
                <ProtectedRoute>
                  <AppLayout><MPesa /></AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/offramp" 
              element={
                <ProtectedRoute>
                  <AppLayout><MPesa /></AppLayout>
                </ProtectedRoute>
              } 
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </WalletProvider>
  </QueryClientProvider>
);

export default App;
