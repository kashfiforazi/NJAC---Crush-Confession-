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
    <div className="w-12 h-12 border-4 border-white border-b-[#f97316] rounded-full animate-spin"></div>
    <div className="text-white font-heading text-2xl font-bold animate-pulse tracking-wide">
      NJAC<span className="text-[#f97316]"> Confession</span>
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
