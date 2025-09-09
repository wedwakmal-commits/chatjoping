import { AppDB, User, Role, Task, TaskStatus, Project, Chat, Message } from '../types';

// Mock database
let db: AppDB;

const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2EwYWViZiI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MxLjY2IDAgMyAxLjM0IDMgM3MtMS4zNCAzLTMgMy0zLTEuMzQtMy0zIDEuMzQtMyAzLTN6bTAgMTRjLTIuNjcgMC04IDEuMzQtOCA0djJoMTZ2LTJjMC0yLjY2LTUuMzMtNC04LTR6Ii8+PC9zdmc+';

const initializeDB = () => {
    const storedDb = localStorage.getItem('app_db');
    if (storedDb) {
        db = JSON.parse(storedDb);
    } else {
        const adminId = `admin-${Date.now()}`;
        db = {
            users: [
                { id: adminId, name: 'Admin User', role: Role.ADMIN, avatar: defaultAvatar, accountId: 'admin' },
            ],
            projects: [],
            tasks: [],
            chats: [],
            credentials: {
                'admin': { password: 'password', userId: adminId }
            }
        };
        saveDB();
    }
};

const saveDB = () => {
    localStorage.setItem('app_db', JSON.stringify(db));
};

initializeDB();

// Helper to simulate async API calls
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));


export const mockLogin = async (accountId: string, password: string): Promise<User | null> => {
    await delay(500);
    const credential = db.credentials[accountId];
    if (credential && credential.password === password) {
        const user = db.users.find(u => u.id === credential.userId);
        return user || null;
    }
    return null;
};

export const mockLogout = () => {
    // No server-side action needed for mock logout
};

export const mockRegisterAdmin = async (username: string, password: string): Promise<User | null> => {
    await delay(500);
    
    const accountId = username.toLowerCase().replace(/\s/g, '');
    if (db.credentials[accountId]) {
        throw new Error('usernameExists');
    }

    const newAdmin: User = {
        id: `user-${Date.now()}`,
        name: username,
        role: Role.ADMIN,
        avatar: defaultAvatar,
        accountId: accountId,
    };

    db.users.push(newAdmin);
    db.credentials[accountId] = { password, userId: newAdmin.id };
    saveDB();

    return newAdmin;
};

export const getUsers = async (): Promise<User[]> => {
    await delay(300);
    return [...db.users];
};

export const getUserById = async (userId: string): Promise<User | null> => {
    await delay(50);
    return db.users.find(u => u.id === userId) || null;
}

export const createUser = async (userData: { name: string; role: Role; password?: string; avatar: string; }): Promise<User> => {
    await delay(500);
    const accountId = userData.name.toLowerCase().replace(/\s/g, '').slice(0, 8) + Math.floor(Math.random() * 1000);
    
    if (Object.values(db.credentials).some(c => db.users.find(u => u.id === c.userId)?.accountId === accountId)) {
        // handle potential duplicate accountId, though unlikely
        return createUser(userData);
    }

    const newUser: User = {
        id: `user-${Date.now()}`,
        name: userData.name,
        role: userData.role,
        avatar: userData.avatar,
        accountId: accountId,
    };
    
    db.users.push(newUser);
    if (userData.password) {
        db.credentials[accountId] = { password: userData.password, userId: newUser.id };
    }
    saveDB();
    return newUser;
};


export const updateUser = async (userId: string, updates: Partial<User>): Promise<User> => {
    await delay(500);
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error("User not found");
    db.users[userIndex] = { ...db.users[userIndex], ...updates };
    saveDB();
    return db.users[userIndex];
};


export const deleteUser = async (userId: string): Promise<void> => {
    await delay(500);
    const user = db.users.find(u => u.id === userId);
    if (user) {
        delete db.credentials[user.accountId];
    }
    db.users = db.users.filter(u => u.id !== userId);
    // Unassign user from tasks
    db.tasks.forEach(task => {
        task.assigneeIds = task.assigneeIds.filter(id => id !== userId);
    });
    saveDB();
};

export const getUserPassword = async (userId: string): Promise<string | null> => {
    await delay(300);
    const user = db.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    const creds = db.credentials[user.accountId];
    return creds ? creds.password : null;
};


export const updatePassword = async (userId: string, newPassword: string): Promise<void> => {
    await delay(500);
    const user = db.users.find(u => u.id === userId);
    if (user && db.credentials[user.accountId]) {
        db.credentials[user.accountId].password = newPassword;
        saveDB();
    } else {
        throw new Error('userOrCredentialsNotFound');
    }
};

export const updateCurrentUserPassword = async (userId: string, oldPassword: string, newPassword: string): Promise<void> => {
    await delay(500);
    const user = db.users.find(u => u.id === userId);
    if (user && db.credentials[user.accountId]) {
        if (db.credentials[user.accountId].password === oldPassword) {
            db.credentials[user.accountId].password = newPassword;
            saveDB();
        } else {
            throw new Error('oldPasswordIncorrect');
        }
    } else {
        throw new Error('userOrCredentialsNotFound');
    }
};


export const getTasks = async (): Promise<Task[]> => {
    await delay(300);
    return [...db.tasks].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
};

export const createTask = async (taskData: Omit<Task, 'id'>): Promise<Task> => {
    await delay(500);
    const newTask: Task = {
        id: `task-${Date.now()}`,
        ...taskData,
    };
    db.tasks.push(newTask);
    saveDB();
    return newTask;
};

export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<Task> => {
    await delay(300);
    const taskIndex = db.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) throw new Error("Task not found");
    db.tasks[taskIndex] = { ...db.tasks[taskIndex], ...updates };
    saveDB();
    return db.tasks[taskIndex];
};

export const getProjects = async (): Promise<Project[]> => {
    await delay(300);
    return [...db.projects];
};

export const createProject = async (projectData: Omit<Project, 'id'>): Promise<Project> => {
    await delay(500);
    const newProject: Project = {
        id: `project-${Date.now()}`,
        ...projectData,
    };
    db.projects.push(newProject);
    saveDB();
    return newProject;
};


export const getChats = async (): Promise<Chat[]> => {
    await delay(300);
    return [...db.chats];
};

export const createChat = async (chatData: { name: string; participantIds: string[], isGroup: boolean }): Promise<Chat> => {
    await delay(500);
    const newChat: Chat = {
        id: `chat-${Date.now()}`,
        ...chatData,
        messages: [],
    };
    db.chats.push(newChat);
    saveDB();
    return newChat;
};

export const sendMessage = async (chatId: string, messageData: Omit<Message, 'id' | 'timestamp'>): Promise<Message> => {
    await delay(100);
    const chat = db.chats.find(c => c.id === chatId);
    if (!chat) throw new Error("Chat not found");

    const newMessage: Message = {
        id: `msg-${Date.now()}`,
        ...messageData,
        timestamp: new Date().toISOString(),
    };
    chat.messages.push(newMessage);
    saveDB();
    return newMessage;
};

export const searchAdminByAccountId = async (accountId: string): Promise<User | null> => {
    await delay(500);
    const user = db.users.find(u => u.accountId === accountId && u.role === Role.ADMIN);
    return user || null;
};


export const exportData = async (): Promise<AppDB> => {
    await delay(500);
    return JSON.parse(JSON.stringify(db)); // Deep copy
};


export const importData = async (data: AppDB, sync: boolean): Promise<void> => {
    await delay(1000);
    if (sync) {
        // Merge chats
        const currentChats = new Map(db.chats.map(c => [c.id, c]));
        data.chats.forEach(importedChat => {
            const existingChat = currentChats.get(importedChat.id);
            if (existingChat) {
                // Merge messages, avoiding duplicates
                const existingMessageIds = new Set(existingChat.messages.map(m => m.id));
                const newMessages = importedChat.messages.filter(m => !existingMessageIds.has(m.id));
                existingChat.messages.push(...newMessages);
                existingChat.messages.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            } else {
                db.chats.push(importedChat);
            }
        });
        // Overwrite everything else
        db.users = data.users;
        db.projects = data.projects;
        db.tasks = data.tasks;
        db.credentials = data.credentials;
    } else {
        db = data;
    }
    saveDB();
    // we need to re-initialize the app state after this. A page reload is the simplest.
};