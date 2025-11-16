import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Agent } from '../types';
import { 
    login as apiLogin, 
    register as apiRegister,
    getCurrentUser,
    logout as apiLogout,
    isAuthenticated as checkAuth,
    LoginCredentials,
    RegisterData
} from '../services/apiService';
import { ApiError } from '../types';

interface AuthContextType {
    user: Agent | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<Agent | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check authentication status on mount
    useEffect(() => {
        const checkAuthStatus = async () => {
            if (checkAuth()) {
                try {
                    const currentUser = await getCurrentUser();
                    setUser(currentUser);
                } catch (error) {
                    console.error('Failed to fetch user:', error);
                    setUser(null);
                }
            }
            setIsLoading(false);
        };

        checkAuthStatus();
    }, []);

    const login = async (credentials: LoginCredentials) => {
        try {
            const response = await apiLogin(credentials);
            if (response.user) {
                setUser(response.user);
            } else {
                // Fetch user if not included in response
                const currentUser = await getCurrentUser();
                setUser(currentUser);
            }
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Login failed', 0);
        }
    };

    const register = async (data: RegisterData) => {
        try {
            const newUser = await apiRegister(data);
            setUser(newUser);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Registration failed', 0);
        }
    };

    const logout = () => {
        apiLogout();
        setUser(null);
    };

    const refreshUser = async () => {
        if (checkAuth()) {
            try {
                const currentUser = await getCurrentUser();
                setUser(currentUser);
            } catch (error) {
                console.error('Failed to refresh user:', error);
            }
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                register,
                logout,
                refreshUser,
            }}
        >
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

