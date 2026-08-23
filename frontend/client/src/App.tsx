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
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Lessons from "./pages/Lessons";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import Assessment from "./pages/Assessment";
import MentorDashboard from "./pages/MentorDashboard";
import LessonManager from "./pages/LessonManager";
import ChatPortal from "./pages/ChatPortal";

function Router() {
  return (
    <AuthProvider>
    <Switch>
      <Route path={"/"} component={Login} />
      <Route path={"/login"} component={Login} />
      <Route path ={"/register"} component={Register}/>
      
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

      <Route path={"/lesson-manager"}>
        <ProtectedRoute>
          <AppLayout>
            <LessonManager />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path={"/chat"}>
        <ProtectedRoute>
          <ChatPortal />
        </ProtectedRoute>
      </Route>

      <Route path={"/404"} component={NotFound} /> 
      {/* Final fallback route */}
      <Route component={NotFound} /> 
    </Switch>
    </AuthProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
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
