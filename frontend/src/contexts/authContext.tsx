import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

interface User {
    id: string;
    username: string;
    email: string;
    is_admin?: boolean;
}

interface AuthContextType {
    user: User | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem('authToken');

            if (token) {
                try {
                    // Set the token in api headers first
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                    // Verify token is still valid by fetching user info
                    const response = await api.get('/api/users/me');

                    // Set user data (adjust based on your response structure)
                    setUser(response.data);
                } catch (error) {
                    console.error('Token validation failed:', error);
                    // Token is invalid, remove it
                    localStorage.removeItem('authToken');
                    delete api.defaults.headers.common['Authorization'];
                    setUser(null);
                }
            } else {
                console.log('No token found, staying logged out'); // Debug log
            }

            setLoading(false);
        };

        initializeAuth();
    }, []);

    const login = async (username: string, password: string): Promise<void> => {
        try {
            const response = await api.post('/api/auth/login', { username, password });

            const { token, user: userData } = response.data;

            // Store token in localStorage
            localStorage.setItem('authToken', token);

            // Set token in api headers for future requests
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // Set user data
            setUser(userData);
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    const logout = () => {
        // Remove token from localStorage
        localStorage.removeItem('authToken');

        // Remove token from api headers
        delete api.defaults.headers.common['Authorization'];

        // Clear user data
        setUser(null);
    };

    const value: AuthContextType = {
        user,
        login,
        logout,
        loading
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