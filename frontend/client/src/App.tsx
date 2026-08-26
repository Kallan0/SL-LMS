import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/AppLayout";

// Eager-loaded: Login (landing page) and NotFound (catch-all fallback)
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Lazy-loaded: everything else (code-split into separate chunks)
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Lessons = lazy(() => import("./pages/Lessons"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Assessment = lazy(() => import("./pages/Assessment"));
const ChatPortal = lazy(() => import("./pages/ChatPortal"));
const LessonManager = lazy(() => import("./pages/LessonManager"));
const MentorDashboard = lazy(() => import("./pages/MentorDashboard"));

/** Themed loading spinner shown while lazy chunks download */
function RouteLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500/20 mb-4">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Switch>
        <Route path="/" component={Login} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />

        <Route path="/dashboard">
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/lessons">
          <ProtectedRoute>
            <AppLayout>
              <Lessons />
            </AppLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/leaderboard">
          <ProtectedRoute>
            <AppLayout>
              <Leaderboard />
            </AppLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/profile">
          <ProtectedRoute>
            <AppLayout>
              <Profile />
            </AppLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/assessment">
          <ProtectedRoute>
            <AppLayout>
              <Assessment />
            </AppLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/chat">
          <ProtectedRoute>
            <ChatPortal />
          </ProtectedRoute>
        </Route>

        <Route path="/lesson-manager">
          <ProtectedRoute>
            <LessonManager />
          </ProtectedRoute>
        </Route>

        <Route path="/mentor-dashboard">
          <ProtectedRoute>
            <MentorDashboard />
          </ProtectedRoute>
        </Route>

        <Route path="/404" component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>        <ThemeProvider defaultTheme="dark" switchable={false}>
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
