import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';

const Layout = lazy(() => import('./components/Layout'));
const Home = lazy(() => import('./pages/Home'));
const PostDetails = lazy(() => import('./pages/PostDetails'));
const SubmitConfession = lazy(() => import('./pages/SubmitConfession'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const Login = lazy(() => import('./pages/Login'));
const CategoryView = lazy(() => import('./pages/CategoryView'));
const Categories = lazy(() => import('./pages/Categories'));
const History = lazy(() => import('./pages/History'));
const NotFound = lazy(() => import('./pages/NotFound'));
const About = lazy(() => import('./pages/About'));
const GenericNewsBlog = lazy(() => import('./pages/GenericNewsBlog'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));

const FallbackLoader = () => (
  <div className="fixed inset-0 z-50 flex justify-center items-center bg-[#0f172a] flex-col gap-4">
    <div className="w-16 h-16 relative flex justify-center items-center">
      <div className="absolute inset-0 border-4 border-slate-700 border-t-[#f97316] rounded-full animate-spin"></div>
      <img src="https://i.ibb.co/Vckn3C6D/1000032660.png" alt="Logo" className="w-8 h-8 object-contain animate-pulse" />
    </div>
    <div className="text-white font-heading text-2xl font-bold tracking-wide mt-2">
      NJAC <span className="text-[#f97316]"> - Crush & Confession</span>
    </div>
  </div>
);

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SettingsProvider>
          <BrowserRouter>
            <Suspense fallback={<FallbackLoader />}>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="post/:id" element={<PostDetails />} />
                  <Route path="category/:slug" element={<CategoryView />} />
                  <Route path="categories" element={<Categories />} />
                  <Route path="submit" element={<SubmitConfession />} />
                  <Route path="login" element={<Login />} />
                  <Route path="about" element={<About />} />
                  <Route path="history" element={<History />} />
                  <Route path="news" element={<GenericNewsBlog type="news" />} />
                  <Route path="blog" element={<GenericNewsBlog type="blog" />} />
                  <Route path="privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="terms" element={<TermsOfService />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
                <Route path="/admin" element={<AdminDashboard />} />
              </Routes>
            </Suspense>
            <Toaster position="bottom-center" />
          </BrowserRouter>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
