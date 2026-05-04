import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion } from 'motion/react';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';
import ScrollToTop from './components/ScrollToTop';

const Layout = lazy(() => import('./components/Layout'));
const Home = lazy(() => import('./pages/Home'));
const PostDetails = lazy(() => import('./pages/PostDetails'));
const SubmitConfession = lazy(() => import('./pages/SubmitConfession'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const Login = lazy(() => import('./pages/Login'));
const SignUp = lazy(() => import('./pages/SignUp'));
const Profile = lazy(() => import('./pages/Profile'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const CategoryView = lazy(() => import('./pages/CategoryView'));
const Categories = lazy(() => import('./pages/Categories'));
const History = lazy(() => import('./pages/History'));
const NotFound = lazy(() => import('./pages/NotFound'));
const About = lazy(() => import('./pages/About'));
const GenericNewsBlog = lazy(() => import('./pages/GenericNewsBlog'));
const NewsBlogDetails = lazy(() => import('./pages/NewsBlogDetails'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const Community = lazy(() => import('./pages/Community'));
const GameZone = lazy(() => import('./pages/GameZone'));
const UserProfileView = lazy(() => import('./pages/UserProfileView'));
const NoticesPage = lazy(() => import('./pages/NoticesPage'));
const Inbox = lazy(() => import('./pages/Inbox'));
const ChatRoom = lazy(() => import('./pages/ChatRoom'));

const FallbackLoader = () => (
  <div className="fixed inset-0 z-50 flex justify-center items-center bg-[#0f172a] flex-col gap-6">
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative flex justify-center items-center"
    >
      <div className="absolute w-24 h-24 border-4 border-slate-800 border-t-primary-500 rounded-full animate-spin"></div>
      <img src="https://i.ibb.co/Vckn3C6D/1000032660.png" alt="Logo" className="w-10 h-10 object-contain animate-pulse" />
    </motion.div>
    <div className="text-center space-y-2">
      <div className="text-white font-heading text-3xl font-black tracking-tighter uppercase italic">
        NJAC <span className="text-primary-500">Crush</span>
      </div>
      <div className="text-slate-500 text-[10px] uppercase tracking-[0.4em] font-black">
        Initializing heartbeat...
      </div>
    </div>
  </div>
);

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SettingsProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={<FallbackLoader />}>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="post/:slug" element={<PostDetails />} />
                  <Route path="category/:slug" element={<CategoryView />} />
                  <Route path="categories" element={<Categories />} />
                  <Route path="submit" element={<SubmitConfession />} />
                  <Route path="login" element={<Login />} />
                  <Route path="signup" element={<SignUp />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="leaderboard" element={<Leaderboard />} />
                  <Route path="about" element={<About />} />
                  <Route path="history" element={<History />} />
                  <Route path="news" element={<GenericNewsBlog type="news" />} />
                  <Route path="news/:id" element={<NewsBlogDetails type="news" />} />
                  <Route path="blog" element={<GenericNewsBlog type="blog" />} />
                  <Route path="blog/:id" element={<NewsBlogDetails type="blog" />} />
                  <Route path="community" element={<Community />} />
                  <Route path="game-zone" element={<GameZone />} />
                  <Route path="notices" element={<NoticesPage />} />
                  <Route path="user/:uid" element={<UserProfileView />} />
                  <Route path="inbox" element={<Inbox />} />
                  <Route path="chat/:recipientId" element={<ChatRoom />} />
                  <Route path="privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="terms" element={<TermsOfService />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin-login" element={<AdminLogin />} />
              </Routes>
            </Suspense>
            <Toaster position="bottom-center" />
          </BrowserRouter>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
