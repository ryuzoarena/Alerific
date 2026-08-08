import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import OAuthConsent from "./pages/OAuthConsent";

import { useApplySettings } from "@/hooks/useApplySettings";
import { supabase } from "@/integrations/supabase/client";
import { useMusicStore } from "@/stores/musicStore";

const queryClient = new QueryClient();

const SettingsBridge = () => {
  useApplySettings();
  return null;
};

const PlaylistSync = () => {
  const fetchPlaylists = useMusicStore((s) => s.fetchPlaylists);
  useEffect(() => {
    // Always run once on mount (covers anonymous users seeing public ones in future searches)
    fetchPlaylists();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchPlaylists();
    });
    return () => subscription.unsubscribe();
  }, [fetchPlaylists]);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SettingsBridge />
      <PlaylistSync />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
