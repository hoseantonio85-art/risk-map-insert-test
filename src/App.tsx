import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// LOVABLE_KEEP_START
// Не изменять этот блок: специфическая настройка basename для GitHub Pages
const isGitHubPages = window.location.hostname.includes("github.io");
const basename = isGitHubPages ? "/risk-map-insert-test" : "";
// LOVABLE_KEEP_END

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {/* LOVABLE_KEEP_START */}
      <BrowserRouter basename={basename}>
      {/* LOVABLE_KEEP_END */}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/risks" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
