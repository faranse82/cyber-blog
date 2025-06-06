// src/components/SignUpForm.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';

interface SignUpFormProps {
    onClose: () => void;
    onSwitchToSignIn: () => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onClose, onSwitchToSignIn }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await register({
                username: formData.username,
                email: formData.email,
                password: formData.password
            });
            onClose();
            navigate('/');
        } catch (err) {
            setError('Registration failed. Username or email may already exist.');
            console.log('Error: Registration Failed', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-96 bg-zinc-800 rounded-xl shadow-2xl p-8 relative">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <form onSubmit={handleSubmit} className="space-y-6">
                <h1 className="text-4xl font-bold text-center text-white mb-8">
                    Sign Up
                </h1>

                {error && (
                    <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <input
                        type="text"
                        name="username"
                        placeholder="Username"
                        value={formData.username}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                        autoFocus
                    />

                    <input
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                    />

                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                    />

                    <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                    />
                </div>

                <div className="space-y-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-red-700 text-white rounded-lg font-medium hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating account...' : 'Sign Up'}
                    </button>

                    <div className="text-center text-sm">
                        <span className="text-gray-400">Already have an account? </span>
                        <button
                            type="button"
                            onClick={onSwitchToSignIn}
                            className="text-white hover:text-gray-300 underline"
                        >
                            Sign In
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default SignUpForm;