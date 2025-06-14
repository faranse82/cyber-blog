import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import api from '../services/api';

interface User {
    id: string;
    username: string;
    email: string;
    is_admin: boolean;
    profile_pic_url?: string;
}

interface AuthError {
    message: string;
    type: 'login' | 'token_validation' | 'network' | 'unknown';
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: AuthError | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    clearError: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

const TOKEN_KEY = 'authToken';
const isDevelopment = process.env.NODE_ENV === 'development';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<AuthError | null>(null);

    // Helper function to safely access localStorage
    const getStoredToken = useCallback((): string | null => {
        try {
            return localStorage.getItem(TOKEN_KEY);
        } catch (error) {
            if (isDevelopment) {
                console.warn('localStorage not available:', error);
            }
            return null;
        }
    }, []);

    const setStoredToken = useCallback((token: string): void => {
        try {
            localStorage.setItem(TOKEN_KEY, token);
        } catch (error) {
            if (isDevelopment) {
                console.warn('Failed to store token:', error);
            }
        }
    }, []);

    const removeStoredToken = useCallback((): void => {
        try {
            localStorage.removeItem(TOKEN_KEY);
        } catch (error) {
            if (isDevelopment) {
                console.warn('Failed to remove token:', error);
            }
        }
    }, []);

    // Setup API interceptors for better token management
    useEffect(() => {
        const setupInterceptors = () => {
            // Request interceptor to add token to headers
            const requestInterceptor = api.interceptors.request.use(
                (config) => {
                    const token = getStoredToken();
                    if (token && config.headers) {
                        config.headers.Authorization = `Bearer ${token}`;
                    }
                    return config;
                },
                (error) => Promise.reject(error)
            );

            // Response interceptor to handle token expiration
            const responseInterceptor = api.interceptors.response.use(
                (response) => response,
                (error) => {
                    if (error.response?.status === 401) {
                        // Token expired or invalid
                        handleTokenExpiration();
                    }
                    return Promise.reject(error);
                }
            );

            return () => {
                api.interceptors.request.eject(requestInterceptor);
                api.interceptors.response.eject(responseInterceptor);
            };
        };

        return setupInterceptors();
    }, [getStoredToken]);

    const handleTokenExpiration = useCallback(() => {
        removeStoredToken();
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
        setError({
            message: 'Your session has expired. Please sign in again.',
            type: 'token_validation'
        });
    }, [removeStoredToken]);

    const normalizeUserData = useCallback((userData: any): User => {
        return {
            id: userData.id,
            username: userData.username,
            email: userData.email,
            is_admin: Boolean(userData.is_admin),
            profile_pic_url: userData.profile_pic_url || undefined
        };
    }, []);

    const initializeAuth = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const token = getStoredToken();

            if (!token) {
                if (isDevelopment) {
                    console.log('No auth token found');
                }
                return;
            }

            if (isDevelopment) {
                console.log('Verifying stored auth token...');
            }

            // Set token in headers for the verification request
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            const response = await api.get('/users/me');
            const normalizedUser = normalizeUserData(response.data);

            setUser(normalizedUser);

            if (isDevelopment) {
                console.log('Auth verification successful:', normalizedUser);
            }

        } catch (error: any) {
            if (isDevelopment) {
                console.error('Auth verification failed:', error);
            }

            // Handle different types of errors
            if (error.response?.status === 401) {
                handleTokenExpiration();
            } else if (error.code === 'NETWORK_ERROR' || !error.response) {
                setError({
                    message: 'Network error. Please check your connection.',
                    type: 'network'
                });
            } else {
                setError({
                    message: 'Authentication verification failed.',
                    type: 'token_validation'
                });
            }

            // Clean up invalid token
            removeStoredToken();
            delete api.defaults.headers.common['Authorization'];
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, [getStoredToken, normalizeUserData, handleTokenExpiration, removeStoredToken]);

    // Initialize auth on mount
    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    const login = useCallback(async (username: string, password: string): Promise<void> => {
        setError(null);

        try {
            const response = await api.post('/auth/login', { username, password });
            const { token, user: userData } = response.data;

            if (!token || !userData) {
                throw new Error('Invalid response from server');
            }

            // Store token
            setStoredToken(token);
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // Normalize and set user data
            const normalizedUser = normalizeUserData(userData);
            setUser(normalizedUser);

            if (isDevelopment) {
                console.log('Login successful:', normalizedUser);
            }

        } catch (error: any) {
            if (isDevelopment) {
                console.error('Login failed:', error);
            }

            let authError: AuthError;

            if (error.response?.status === 401) {
                authError = {
                    message: 'Invalid username or password.',
                    type: 'login'
                };
            } else if (error.code === 'NETWORK_ERROR' || !error.response) {
                authError = {
                    message: 'Network error. Please check your connection.',
                    type: 'network'
                };
            } else {
                authError = {
                    message: error.response?.data?.error ?? 'Login failed. Please try again.',
                    type: 'login'
                };
            }

            setError(authError);
            throw error;
        }
    }, [setStoredToken, normalizeUserData]);

    const logout = useCallback(() => {
        removeStoredToken();
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
        setError(null);

        if (isDevelopment) {
            console.log('User logged out');
        }
    }, [removeStoredToken]);

    const refreshUser = useCallback(async (): Promise<void> => {
        if (!user) return;

        try {
            const response = await api.get('/api/users/me');
            const normalizedUser = normalizeUserData(response.data);
            setUser(normalizedUser);

            if (isDevelopment) {
                console.log('User data refreshed:', normalizedUser);
            }
        } catch (error: any) {
            if (isDevelopment) {
                console.error('Failed to refresh user data:', error);
            }

            if (error.response?.status === 401) {
                handleTokenExpiration();
            } else {
                setError({
                    message: 'Failed to refresh user data.',
                    type: 'unknown'
                });
            }
        }
    }, [user, normalizeUserData, handleTokenExpiration]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const isAuthenticated = Boolean(user);

    const value: AuthContextType = {
        user,
        loading,
        error,
        login,
        logout,
        refreshUser,
        clearError,
        isAuthenticated
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};