import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { User } from '../types';
import { mockLogin, mockLogout, mockRegisterAdmin } from '../services/api';

interface AuthContextType {
    user: User | null;
    login: (accountId: string, password: string) => Promise<User | null>;
    logout: () => void;
    updateCurrentUser: (updatedUser: User) => void;
    registerAdmin: (username: string, password: string, adminKey: string) => Promise<User | null>;
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

    const login = useCallback(async (accountId: string, password: string): Promise<User | null> => {
        const loggedInUser = await mockLogin(accountId, password);
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

    const registerAdmin = useCallback(async (username: string, password: string, adminKey: string): Promise<User | null> => {
        const newAdmin = await mockRegisterAdmin(username, password, adminKey);
        if (newAdmin) {
            setUser(newAdmin);
            localStorage.setItem('user', JSON.stringify(newAdmin));
        }
        return newAdmin;
    }, []);


    return (
        <AuthContext.Provider value={{ user, login, logout, updateCurrentUser, registerAdmin }}>
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