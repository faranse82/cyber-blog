import React from "react";
import { Link } from 'react-router-dom';
import { useAuth } from "../contexts/authContext";

const Navigation: React.FC = () => {
    const { user } = useAuth();

    return (
        <nav className="w-full bg-dark-nav px-14 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-12">
                    <Link to="/" className="text-3xl font-bold font-ubuntu">cyberBlog</Link>
                </div>
                <div className="w-1 h-10 bg-red-700" />
                <div className="flex items-center gap-8">
                    <Link to="/" className="text-xl font-medium hover:text-grey-300">
                        Home
                    </Link>
                    <a href="https://github.com/faranse82" className="text-xl font-medium hover:text-gray-300">
                        GitHub
                    </a>
                    <a href="https://www.linkedin.com/in/faran-sepehri-b82716278" className="text-xl font-medium hover:text-gray-300">
                        LinkedIn
                    </a>
                </div>
                <div className="flex items-center gap-8">
                    <div className="relative">
                        <input type="text" placeholder="Search" className="w-80 px-4 py-2 rounded-full bg-white text-grey-700 placeholder-grey-500"></input>
                    </div>
                    {user ? (
                        <Link to="/profile" className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                            {user.username[0].toUpperCase()}
                        </Link>
                    ) : (
                        <Link to="/login" className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                            F
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navigation;