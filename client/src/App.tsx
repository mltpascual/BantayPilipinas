import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { FreshnessProvider } from "./contexts/FreshnessContext";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <FreshnessProvider>
          <TooltipProvider>
            <Toaster />
            <Dashboard />
          </TooltipProvider>
        </FreshnessProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
