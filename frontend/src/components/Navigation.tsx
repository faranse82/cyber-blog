import React, { useState } from "react";
import { Link } from 'react-router-dom';
import { useAuth } from "../contexts/authContext";
import Modal from "./Modal";
import LoginForm from "./LoginForm";

const Navigation: React.FC = () => {
    const { user, logout } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

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
    }

    return (
        <>
            <nav className="w-full bg-dark-nav px-14 py-4 relative">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-12">
                        <Link to="/" className="text-3xl font-bold font-ubuntu">
                            Faran's Blog
                        </Link>
                        <div className="w-1 h-9 bg-red-700" />
                        <div className="flex items-center gap-8">
                            <Link to="/" className="text-xl font-medium hover:text-gray-300">
                                Home
                            </Link>
                            <Link to="/about-me" className="text-xl font-medium hover:text-gray-300">
                                About Me
                            </Link>
                            <a href="https://github.com/faranse82" className="text-xl font-medium hover:text-gray-300">
                                GitHub
                            </a>
                            <a href="https://www.linkedin.com/in/faran-sepehri-b82716278/" className="text-xl font-medium hover:text-gray-300">
                                LinkedIn
                            </a>
                        </div>
                    </div>

                    <div className="flex items-center">
                        <div className="relative">
                            <button
                                onClick={handleAvatarClick}
                                className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-user-icon lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            </button>

                            {user && showProfileMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-zinc-800 rounded-lg shadow-lg py-2">
                                    <button
                                        onClick={handleLogout}
                                        className="block w-full text-left px-4 py-2 text-white hover:bg-zinc-700"
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            <Modal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)}>
                <LoginForm
                    onClose={() => setShowAuthModal(false)}
                />
            </Modal>
        </>
    );
};

export default Navigation;