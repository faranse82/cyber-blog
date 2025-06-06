import React, {createContext, useState, useContext, ReactNode} from "react";
import { User } from '../types';
import api from "../services/api";

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (username: string, password: string) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(false);

    const login = async (username: string, password: string) => {
        setIsLoading(true);

        try {
            const response = await api.post('/api/auth/login', { username, password });
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            setToken(token);
            setUser(user);
        } catch (error) {
            console.error('Login failed: ', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (data: any) => {
        setIsLoading(true);
        try {
            const response = await api.post('/api/auth/register', data);
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            setToken(token);
            setUser(user);

        } catch (error) {
            console.log('Registration failed: ', error)
            throw (error);
        } finally {
            setIsLoading(false);
        }
    }

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};