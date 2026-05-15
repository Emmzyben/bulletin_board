import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import AppLayout from './components/layout/AppLayout';
import Feed from './pages/Feed';
import Workspace from './pages/Workspace';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Pricing from './pages/Pricing';
import Support from './pages/Support';
import Onboarding from './pages/Onboarding';
import Landing from './pages/Landing';
import Demo from './pages/Demo';
import UserProfile from './pages/UserProfile';
import Communities from './pages/Communities';
import Analytics from './pages/Analytics';
import Leaderboard from './pages/Leaderboard';
import About from './pages/About';
import Login from './pages/Login';
import Signup from './pages/Signup';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-primary-foreground font-bold text-lg">BB</span>
          </div>
          <div className="w-8 h-8 border-3 border-muted border-t-primary rounded-full animate-spin mx-auto mt-4"></div>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Don't redirect — let the app render publicly; protected actions will redirect individually
    }
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Feed />} />
        <Route path="/workspace" element={<Workspace />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/saved" element={<Feed />} />
        <Route path="/my-posts" element={<Feed />} />
        <Route path="/communities" element={<Communities />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Route>
      <Route path="/support" element={<Support />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/user-profile" element={<UserProfile />} />
      <Route path="/home" element={<Landing />} />
      <Route path="/about" element={<About />} />
      <Route path="/demo" element={<Demo />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <SonnerToaster />
      </QueryClientProvider>
    </AuthProvider>
    </ThemeProvider>
  )
}

export default App