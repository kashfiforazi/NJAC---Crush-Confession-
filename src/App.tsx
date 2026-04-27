import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import PostDetails from './pages/PostDetails';
import SubmitConfession from './pages/SubmitConfession';
import AdminDashboard from './pages/admin/AdminDashboard';
import Login from './pages/Login';
import CategoryView from './pages/CategoryView';
import Categories from './pages/Categories';
import History from './pages/History';
import NotFound from './pages/NotFound';
import About from './pages/About';
import GenericNewsBlog from './pages/GenericNewsBlog';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SettingsProvider>
          <BrowserRouter>
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
            <Toaster position="bottom-center" />
          </BrowserRouter>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
