import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { User } from '../types';
import { mockLogin, mockLogout, mockRegisterAdmin, updateCurrentUserPassword, getUserById } from '../services/api';

interface AuthContextType {
    user: User | null;
    isImpersonating: boolean;
    login: (accountId: string, password: string) => Promise<User | null>;
    logout: () => void;
    updateCurrentUser: (updatedUser: User) => void;
    registerAdmin: (username: string, password: string) => Promise<User | null>;
    updatePassword: (oldPassword: string, newPassword: string) => Promise<void>;
    impersonateUser: (userId: string) => Promise<void>;
    stopImpersonation: () => void;
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

    const [isImpersonating, setIsImpersonating] = useState<boolean>(() => {
         return localStorage.getItem('originalUser') !== null;
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
        localStorage.removeItem('originalUser');
        setIsImpersonating(false);
    }, []);
    
    const updateCurrentUser = useCallback((updatedUser: User) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    }, []);

    const registerAdmin = useCallback(async (username: string, password: string): Promise<User | null> => {
        const newAdmin = await mockRegisterAdmin(username, password);
        if (newAdmin) {
            setUser(newAdmin);
            localStorage.setItem('user', JSON.stringify(newAdmin));
        }
        return newAdmin;
    }, []);

    const updatePassword = useCallback(async (oldPassword: string, newPassword: string) => {
        if (!user) {
            throw new Error("No user is logged in.");
        }
        await updateCurrentUserPassword(user.id, oldPassword, newPassword);
    }, [user]);

    const impersonateUser = useCallback(async (userId: string) => {
        if (!user) throw new Error("Only logged in users can impersonate");
        const targetUser = await getUserById(userId);
        if (targetUser) {
            localStorage.setItem('originalUser', JSON.stringify(user));
            localStorage.setItem('user', JSON.stringify(targetUser));
            setUser(targetUser);
            setIsImpersonating(true);
        } else {
            throw new Error("User to impersonate not found");
        }
    }, [user]);

    const stopImpersonation = useCallback(() => {
        const originalUserStr = localStorage.getItem('originalUser');
        if (originalUserStr) {
            const originalUser = JSON.parse(originalUserStr);
            localStorage.setItem('user', JSON.stringify(originalUser));
            localStorage.removeItem('originalUser');
            setUser(originalUser);
            setIsImpersonating(false);
        }
    }, []);


    return (
        <AuthContext.Provider value={{ user, isImpersonating, login, logout, updateCurrentUser, registerAdmin, updatePassword, impersonateUser, stopImpersonation }}>
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