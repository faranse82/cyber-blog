import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/authContext';
import AuthErrorHandler from './components/AuthErrorHandler';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import AboutMe from './pages/AboutMe';
import BlogPost from './pages/BlogPost';
import Footer from './components/Footer';
import AdminDashboard from './pages/AdminDashboard';
import EditPost from './components/EditPost';
import EditProfile from './components/EditProfile';

const AppContent: React.FC = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          <span className="text-white text-lg">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthErrorHandler>
      <div className='flex flex-col min-h-screen'>
        <Navigation />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about-me" element={<AboutMe />} />
            <Route path="/post/:slug" element={<BlogPost />} />
            <Route path="/profile" element={<EditProfile />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/admin/edit-post/:slug" element={<EditPost />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthErrorHandler>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;