import React, { useEffect } from 'react';
import { useAuth } from '../contexts/authContext';

interface AuthErrorHandlerProps {
    children: React.ReactNode;
}

const AuthErrorHandler: React.FC<AuthErrorHandlerProps> = ({ children }) => {
    const { error, clearError } = useAuth();

    useEffect(() => {
        if (error && error.type === 'token_validation') {
            // Auto-clear token validation errors after 5 seconds
            const timer = setTimeout(() => {
                clearError();
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [error, clearError]);

    return (
        <>
            {error && (
                <div className="fixed top-4 right-4 z-50 max-w-md">
                    <div className={`p-4 rounded-lg shadow-lg border ${error.type === 'network'
                        ? 'bg-yellow-500/20 border-yellow-500 text-yellow-200'
                        : 'bg-red-500/20 border-red-500 text-red-200'
                        }`}>
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    {error.type === 'network' ? (
                                        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-medium text-sm">
                                        {error.type === 'login' && 'Login Error'}
                                        {error.type === 'token_validation' && 'Session Expired'}
                                        {error.type === 'network' && 'Connection Error'}
                                        {error.type === 'unknown' && 'Error'}
                                    </h4>
                                    <p className="text-sm mt-1 opacity-90">
                                        {error.message}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={clearError}
                                className="flex-shrink-0 ml-3 text-gray-400 hover:text-white transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {children}
        </>
    );
};

export default AuthErrorHandler;