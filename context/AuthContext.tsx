import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { User } from '../types';
import { mockLogin, mockLogout } from '../services/api';

interface AuthContextType {
    user: User | null;
    login: (username: string, password: string) => Promise<User | null>;
    logout: () => void;
    updateCurrentUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        try {
            const storedUser = localStorage.getItem('user');
            return storedUser ? JSON.parse(storedUser) : null;
        } catch {
            return null;
        }
    });

    const login = useCallback(async (username: string, password: string): Promise<User | null> => {
        const loggedInUser = await mockLogin(username, password);
        if (loggedInUser) {
            setUser(loggedInUser);
            localStorage.setItem('user', JSON.stringify(loggedInUser));
        }
        return loggedInUser;
    }, []);

    const logout = useCallback(() => {
        mockLogout();
        setUser(null);
        localStorage.removeItem('user');
    }, []);
    
    const updateCurrentUser = useCallback((updatedUser: User) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    }, []);


    return (
        <AuthContext.Provider value={{ user, login, logout, updateCurrentUser }}>
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
