import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/authContext';

interface LoginFormProps {
    onClose: () => void;
    onSwitchToRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onClose, onSwitchToRegister }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, error, clearError } = useAuth();

    // Clear any existing errors when component mounts or when switching modes
    useEffect(() => {
        clearError();
    }, [clearError]);

    // Clear errors when user starts typing
    useEffect(() => {
        if (error && error.type === 'login') {
            clearError();
        }
    }, [username, password, error, clearError]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await login(username, password);
            onClose();
        } catch (err) {
            // error is handled by the auth context and will be displayed by the AuthErrorHandler component
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto bg-dark-card rounded-xl p-6">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold font-ubuntu text-white mb-2">Welcome Back</h2>
                <p className="text-gray-400">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Show login-specific errors inline */}
                {error && error.type === 'login' && (
                    <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
                        {error.message}
                    </div>
                )}

                <div>
                    <label className="block text-white text-sm font-medium mb-2">
                        Username
                    </label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-3 bg-[#262626] text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Enter your username"
                        required
                        disabled={loading}
                    />
                </div>

                <div>
                    <label className="block text-white text-sm font-medium mb-2">
                        Password
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-[#262626] text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Enter your password"
                        required
                        disabled={loading}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading || !username.trim() || !password.trim()}
                    className="w-full py-3 bg-red-700 text-white rounded-lg font-medium hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Signing In...' : 'Sign In'}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-gray-400">
                    Don't have an account?{' '}
                    <button
                        onClick={onSwitchToRegister}
                        className="text-red-400 hover:text-red-300 font-medium"
                        disabled={loading}
                    >
                        Create Account
                    </button>
                </p>
            </div>
        </div>
    );
};

export default LoginForm;