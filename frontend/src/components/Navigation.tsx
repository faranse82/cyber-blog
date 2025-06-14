import React, { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import { useAuth } from "../contexts/authContext";
import AuthModal from "./AuthModal";

const Navigation: React.FC = () => {
    const { user, logout, loading } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (showProfileMenu && !target.closest('.profile-menu-container')) {
                setShowProfileMenu(false);
            }
            if (showMobileMenu && !target.closest('.mobile-menu-container')) {
                setShowMobileMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showProfileMenu, showMobileMenu]);

    const handleAvatarClick = () => {
        if (user) {
            setShowProfileMenu(!showProfileMenu);
        } else {
            setShowAuthModal(true);
        }
    };

    const handleLogout = () => {
        logout();
        setShowProfileMenu(false);
        setShowMobileMenu(false);
    };

    const handleProfileMenuItemClick = () => {
        setShowProfileMenu(false);
        setShowMobileMenu(false);
    };

    const toggleMobileMenu = () => {
        setShowMobileMenu(!showMobileMenu);
    };

    return (
        <>
            <nav className="w-full bg-dark-nav px-4 sm:px-6 lg:px-14 py-4 relative">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Logo and Desktop Menu */}
                    <div className="flex items-center gap-4 lg:gap-12">
                        <Link to="/" className="text-xl sm:text-2xl lg:text-3xl font-bold font-ubuntu text-white">
                            Faran's Blog
                        </Link>

                        {/* Desktop Menu */}
                        <div className="hidden lg:flex items-center gap-12">
                            <div className="w-1 h-9 bg-red-700" />
                            <div className="flex items-center gap-8">
                                <Link to="/" className="text-xl font-medium text-white hover:text-gray-300">
                                    Home
                                </Link>
                                <Link to="/about-me" className="text-xl font-medium text-white hover:text-gray-300">
                                    About Me
                                </Link>
                                <a
                                    href="https://github.com/faranse82"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xl font-medium text-white hover:text-gray-300"
                                >
                                    GitHub
                                </a>
                                <a
                                    href="https://www.linkedin.com/in/faran-sepehri-b82716278/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xl font-medium text-white hover:text-gray-300"
                                >
                                    LinkedIn
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Admin Dashboard Link - Hidden on mobile, shown in menu */}
                        {user?.is_admin && (
                            <Link
                                to="/admin-dashboard"
                                className="hidden sm:block px-3 sm:px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors font-medium text-sm sm:text-base"
                            >
                                Admin
                            </Link>
                        )}

                        {/* Profile Avatar */}
                        <div className="relative profile-menu-container">
                            <button
                                onClick={handleAvatarClick}
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600 transition-colors"
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : user ? (
                                    user.profile_pic_url ? (
                                        <img
                                            src={user.profile_pic_url}
                                            alt={user.username}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-white font-medium text-sm sm:text-base">
                                            {user.username.charAt(0).toUpperCase()}
                                        </span>
                                    )
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                )}
                            </button>

                            {/* Desktop Profile Menu */}
                            {user && showProfileMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-zinc-800 rounded-lg shadow-lg py-2 z-50 border border-gray-700">
                                    <div className="px-4 py-2 border-b border-gray-700">
                                        <p className="text-white font-medium truncate">{user.username}</p>
                                        <p className="text-gray-400 text-sm truncate">{user.email}</p>
                                    </div>

                                    <Link
                                        to="/profile"
                                        onClick={handleProfileMenuItemClick}
                                        className="block w-full text-left px-4 py-2 text-white hover:bg-zinc-700 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            Edit Profile
                                        </div>
                                    </Link>

                                    {user.is_admin && (
                                        <Link
                                            to="/admin-dashboard"
                                            onClick={handleProfileMenuItemClick}
                                            className="block w-full text-left px-4 py-2 text-white hover:bg-zinc-700 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                Admin Dashboard
                                            </div>
                                        </Link>
                                    )}

                                    <button
                                        onClick={handleLogout}
                                        className="block w-full text-left px-4 py-2 text-white hover:bg-zinc-700 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            Logout
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={toggleMobileMenu}
                            className="lg:hidden p-2 text-white hover:bg-gray-700 rounded-lg transition-colors mobile-menu-container"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {showMobileMenu ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {showMobileMenu && (
                    <div className="lg:hidden absolute top-full left-0 right-0 bg-dark-nav border-t border-gray-700 shadow-lg z-40">
                        <div className="px-4 py-4 space-y-3">
                            <Link
                                to="/"
                                onClick={() => setShowMobileMenu(false)}
                                className="block text-lg font-medium text-white hover:text-gray-300 py-2"
                            >
                                Home
                            </Link>
                            <Link
                                to="/about-me"
                                onClick={() => setShowMobileMenu(false)}
                                className="block text-lg font-medium text-white hover:text-gray-300 py-2"
                            >
                                About Me
                            </Link>
                            <a
                                href="https://github.com/faranse82"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-lg font-medium text-white hover:text-gray-300 py-2"
                            >
                                GitHub
                            </a>
                            <a
                                href="https://www.linkedin.com/in/faran-sepehri-b82716278/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-lg font-medium text-white hover:text-gray-300 py-2"
                            >
                                LinkedIn
                            </a>
                            {user?.is_admin && (
                                <Link
                                    to="/admin-dashboard"
                                    onClick={() => setShowMobileMenu(false)}
                                    className="block text-lg font-medium text-red-400 hover:text-red-300 py-2"
                                >
                                    Admin Dashboard
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
            />
        </>
    );
};

export default Navigation;