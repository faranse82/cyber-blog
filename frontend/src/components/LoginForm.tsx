import { useState } from "react";
import { useAuth } from "../contexts/authContext";
import { useNavigate } from "react-router-dom";

interface LoginFormProps {
    onClose: () => void;
    onSwitchToSignUp: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({onClose, onSwitchToSignUp}) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(formData.email, formData.password);
            navigate('/');
        } catch (err) {
            setError('Invalid credentials');
            console.log('Invalid credentials: ', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-96 bg-zinc-800 rounded-xl shadow-2xl p-8 relative">
            {/* Close button */}
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
                    Sign In
                </h1>

                {error && (
                    <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <input
                        type="text"
                        name="email"
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                        autoFocus
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
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        name="rememberMe"
                        checked={formData.rememberMe}
                        onChange={handleChange}
                        className="w-4 h-4 accent-red-700"
                    />
                    <span className="text-white text-sm">Remember me</span>
                </label>

                <div className="space-y-4 pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-red-700 text-white rounded-lg font-medium hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>

                    <div className="flex flex-col items-center gap-3 text-sm">
                        <button
                            type="button"
                            className="text-white hover:text-gray-300 underline"
                        >
                            Forgot Password?
                        </button>

                        <div className="text-gray-400">
                            Don't have an account?{' '}
                            <button
                                type="button"
                                onClick={onSwitchToSignUp}
                                className="text-white hover:text-gray-300 underline"
                            >
                                Sign Up
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default LoginForm;