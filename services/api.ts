import { User, Role, Task, TaskStatus, Chat, Message, Project } from '../types';

// --- DATABASE PERSISTENCE LOGIC ---

const STORAGE_KEY = 'employee-app-db';

interface AppDB {
    users: User[];
    projects: Project[];
    tasks: Task[];
    chats: Chat[];
    credentials: Record<string, { password: string; userId: string; }>;
}

const getDefaultDb = (): AppDB => ({
    users: [],
    projects: [
        { id: 'p1', name: 'تطوير الواجهة الأمامية', color: '#3b82f6' },
        { id: 'p2', name: 'البنية التحتية للسيرفر', color: '#10b981' },
        { id: 'p3', name: 'حملة التسويق الرقمي', color: '#f97316' },
    ],
    tasks: [],
    chats: [],
    credentials: {}
});

const saveDb = (dbToSave: AppDB) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dbToSave));
    } catch (error) {
        console.error("Failed to save DB to localStorage:", error);
    }
};

const generateAccountId = () => Math.floor(100000 + Math.random() * 900000).toString();

const loadDb = (): AppDB => {
    try {
        const storedDb = localStorage.getItem(STORAGE_KEY);
        if (storedDb) {
            const parsedDb: AppDB = JSON.parse(storedDb);
            // Basic validation and migration
            if (parsedDb.users && parsedDb.credentials && parsedDb.projects) {
                // Migration logic: ensure all users have an accountId
                let dbModified = false;
                parsedDb.users = parsedDb.users.map(user => {
                    if (!user.accountId) {
                        dbModified = true;
                        return { ...user, accountId: generateAccountId() };
                    }
                    return user;
                });

                if (dbModified) {
                    saveDb(parsedDb);
                }
                return parsedDb;
            }
        }
    } catch (error) {
        console.error("Failed to load DB from localStorage:", error);
    }
    const defaultDb = getDefaultDb();
    saveDb(defaultDb); // Save the default DB if nothing is found or data is corrupt
    return defaultDb;
};


// --- MOCK DATA & HELPERS ---

const ADMIN_REGISTRATION_KEY = 'super-secret-admin-key-123';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- API FUNCTIONS ---

export const mockLogin = async (accountId: string, password: string): Promise<User | null> => {
    await delay(500);
    const db = loadDb();
    const user = db.users.find(u => u.accountId === accountId);
    if (user) {
        const creds = db.credentials[user.name];
        if (creds && creds.password === password) {
            return user;
        }
    }
    return null;
};

export const mockRegisterAdmin = async (username: string, password: string, adminKey: string): Promise<User | null> => {
    await delay(500);
    const db = loadDb();

    if (adminKey !== ADMIN_REGISTRATION_KEY) {
        throw new Error('errors.adminKeyIncorrect');
    }

    if (db.credentials[username]) {
        throw new Error('errors.usernameExists');
    }

    const newId = `u${Date.now()}`;
    const newUser: User = {
        id: newId,
        name: username,
        role: Role.ADMIN,
        avatar: `https://i.pravatar.cc/150?u=${newId}`,
        accountId: generateAccountId(),
    };

    db.users.push(newUser);
    db.credentials[username] = { password, userId: newUser.id };
    
    saveDb(db);
    
    return newUser;
};

export const mockLogout = () => {
    return Promise.resolve();
};

export const getUsers = async (): Promise<User[]> => {
    await delay(200);
    const db = loadDb();
    return [...db.users];
};

export const getProjects = async (): Promise<Project[]> => {
    await delay(100);
    const db = loadDb();
    return [...db.projects];
};

export const createProject = async (projectData: Omit<Project, 'id'>): Promise<Project> => {
    await delay(200);
    const db = loadDb();
    const newProject: Project = {
        ...projectData,
        id: `p${Date.now()}`,
    };
    db.projects.push(newProject);
    saveDb(db);
    return newProject;
};

export const deleteProject = async (projectId: string): Promise<void> => {
    await delay(300);
    const db = loadDb();
    db.tasks = db.tasks.map(task => {
        if (task.projectId === projectId) {
            return { ...task, projectId: null };
        }
        return task;
    });
    db.projects = db.projects.filter(p => p.id !== projectId);
    saveDb(db);
};


export const getTasks = async (): Promise<Task[]> => {
    await delay(300);
    const db = loadDb();
    return [...db.tasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
};

export const getChats = async (userId: string): Promise<Chat[]> => {
    await delay(300);
    const db = loadDb();
    return db.chats.filter(c => c.participantIds.includes(userId));
};

export const createTask = async (taskData: Omit<Task, 'id'>): Promise<Task> => {
    await delay(400);
    const db = loadDb();
    const newTask: Task = {
        ...taskData,
        id: `t${Date.now()}`,
    };
    db.tasks.unshift(newTask);
    saveDb(db);
    return newTask;
};

export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<Task> => {
    await delay(200);
    const db = loadDb();
    let taskToUpdate = db.tasks.find(t => t.id === taskId);
    if (!taskToUpdate) throw new Error('Task not found');
    taskToUpdate = { ...taskToUpdate, ...updates };
    db.tasks = db.tasks.map(t => (t.id === taskId ? taskToUpdate! : t));
    saveDb(db);
    return taskToUpdate;
};

export const sendMessage = async (chatId: string, senderId: string, text: string): Promise<Message> => {
    await delay(100);
    const db = loadDb();
    const newMessage: Message = {
        id: `m${Date.now()}`,
        senderId,
        text,
        timestamp: new Date().toISOString(),
    };
    const chat = db.chats.find(c => c.id === chatId);
    if (chat) {
        chat.messages.push(newMessage);
        saveDb(db);
    }
    return newMessage;
};

export const findOrCreateChat = async (userId1: string, userId2:string): Promise<Chat> => {
    await delay(200);
    const db = loadDb();

    const existingChat = db.chats.find(c =>
        !c.isGroup &&
        c.participantIds.length === 2 &&
        c.participantIds.includes(userId1) &&
        c.participantIds.includes(userId2)
    );

    if (existingChat) {
        return existingChat;
    }

    const user2 = db.users.find(u => u.id === userId2);
    if (!user2) {
        throw new Error("Partner user not found");
    }

    const newChat: Chat = {
        id: `c${Date.now()}`,
        name: user2.name,
        participantIds: [userId1, userId2],
        messages: [],
        isGroup: false,
    };

    db.chats.unshift(newChat);
    saveDb(db);
    return newChat;
};

export const createUser = async (userData: Omit<User, 'id' | 'accountId'>, password: string): Promise<User> => {
    await delay(400);
    const db = loadDb();
    
    if (db.credentials[userData.name]) {
        throw new Error('errors.usernameExists');
    }

    const newId = `u${Date.now()}`;
    const newUser: User = {
        id: newId,
        name: userData.name,
        role: userData.role,
        avatar: userData.avatar,
        accountId: generateAccountId(),
    };
    
    db.users.push(newUser);
    const username = userData.name;
    db.credentials[username] = { password, userId: newUser.id };
    saveDb(db);
    return newUser;
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<User> => {
    await delay(200);
    const db = loadDb();
    let userToUpdate = db.users.find(u => u.id === userId);
    if (!userToUpdate) throw new Error('User not found');

    if (updates.name && updates.name !== userToUpdate.name) {
        const oldUsername = userToUpdate.name;
        const newUsername = updates.name;
        
        if (db.credentials[newUsername]) {
            throw new Error('errors.usernameExists');
        }

        if (db.credentials[oldUsername]) {
            db.credentials[newUsername] = db.credentials[oldUsername];
            delete db.credentials[oldUsername];
        }
    }

    userToUpdate = { ...userToUpdate, ...updates };
    db.users = db.users.map(u => (u.id === userId ? userToUpdate! : u));
    saveDb(db);
    return userToUpdate;
};

export const deleteUser = async (userId: string): Promise<void> => {
    await delay(300);
    const db = loadDb();

    db.tasks = db.tasks.map(task => {
        if (task.assigneeIds.includes(userId)) {
            return {
                ...task,
                assigneeIds: task.assigneeIds.filter(id => id !== userId),
            };
        }
        return task;
    });

    const updatedChats = db.chats
        .map(chat => {
            const filteredMessages = chat.messages.filter(message => message.senderId !== userId);
            const filteredParticipants = chat.participantIds.filter(id => id !== userId);

            return {
                ...chat,
                messages: filteredMessages,
                participantIds: filteredParticipants,
            };
        })
        .filter(chat => {
            return chat.participantIds.length >= (chat.isGroup ? 1 : 2);
        });
    db.chats = updatedChats;


    const userToDelete = db.users.find(u => u.id === userId);
    if (userToDelete) {
        const username = userToDelete.name;
        delete db.credentials[username];
    }
    
    db.users = db.users.filter(u => u.id !== userId);
    saveDb(db);
};

export const findAdminByAccountId = async (accountId: string): Promise<User | null> => {
    await delay(300);
    const db = loadDb();
    const admin = db.users.find(u => u.role === Role.ADMIN && u.accountId === accountId);
    return admin || null;
}

export const createGroupChat = async (name: string, participantIds: string[], createdBy: string): Promise<Chat> => {
    await delay(400);
    const db = loadDb();
    const allParticipants = [...new Set([createdBy, ...participantIds])];
    const newChat: Chat = {
        id: `cg${Date.now()}`,
        name,
        participantIds: allParticipants,
        messages: [],
        isGroup: true,
    };
    db.chats.unshift(newChat);
    saveDb(db);
    return newChat;
};

export const getUserPassword = async (userId: string): Promise<string | null> => {
    await delay(150);
    const db = loadDb();
    const user = db.users.find(u => u.id === userId);
    if (user && db.credentials[user.name]) {
        return db.credentials[user.name].password;
    }
    return null;
}

export const updateUserPassword = async (userId: string, newPassword: string): Promise<void> => {
    await delay(300);
    const db = loadDb();
    const user = db.users.find(u => u.id === userId);
    if (user && db.credentials[user.name]) {
        db.credentials[user.name].password = newPassword;
        saveDb(db);
    } else {
        throw new Error("errors.userOrCredentialsNotFound");
    }
}
