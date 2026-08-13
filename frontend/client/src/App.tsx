import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Lessons from "./pages/Lessons";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import Assessment from "./pages/Assessment";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Login} />
      
      <Route path={"/dashboard"}>
        <ProtectedRoute>
          <AppLayout>
            <Dashboard />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path={"/lessons"}>
        <ProtectedRoute>
          <AppLayout>
            <Lessons />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path={"/leaderboard"}>
        <ProtectedRoute>
          <AppLayout>
            <Leaderboard />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path={"/profile"}>
        <ProtectedRoute>
          <AppLayout>
            <Profile />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path={"/assessment"}>
        <ProtectedRoute>
          <AppLayout>
            <Assessment />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path={"/404"} component={NotFound} /> 
      {/* Final fallback route */}
      <Route component={NotFound} /> 
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
