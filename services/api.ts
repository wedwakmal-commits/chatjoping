import { User, Role, Task, TaskStatus, Chat, Message, Project } from '../types';

// --- MOCK DATA ---

let users: User[] = [];

let projects: Project[] = [
    { id: 'p1', name: 'تطوير الواجهة الأمامية', color: '#3b82f6' },
    { id: 'p2', name: 'البنية التحتية للسيرفر', color: '#10b981' },
    { id: 'p3', name: 'حملة التسويق الرقمي', color: '#f97316' },
];

let tasks: Task[] = [];

let chats: Chat[] = [];

const ADMIN_REGISTRATION_KEY = 'super-secret-admin-key-123';

const db = {
    users,
    tasks,
    chats,
    projects,
    credentials: {}
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- API FUNCTIONS ---

export const mockLogin = async (username: string, password: string): Promise<User | null> => {
    await delay(500);
    // Use the full username for login lookup
    const creds = (db.credentials as any)[username];
    if (creds && creds.password === password) {
        return db.users.find(u => u.id === creds.userId) || null;
    }
    return null;
};

export const mockRegisterAdmin = async (username: string, password: string, adminKey: string): Promise<User | null> => {
    await delay(500);

    if (adminKey !== ADMIN_REGISTRATION_KEY) {
        throw new Error('مفتاح تسجيل المدراء غير صحيح.');
    }

    if ((db.credentials as any)[username]) {
        throw new Error('اسم المستخدم هذا موجود بالفعل.');
    }

    const newId = `u${Date.now()}`;
    const newUser: User = {
        id: newId,
        name: username,
        role: Role.ADMIN,
        avatar: `https://i.pravatar.cc/150?u=${newId}`,
    };

    db.users.push(newUser);
    (db.credentials as any)[username] = { password, userId: newUser.id };
    
    return newUser;
};

export const mockLogout = () => {
    return Promise.resolve();
};

export const getUsers = async (): Promise<User[]> => {
    await delay(200);
    return [...db.users];
};

export const getProjects = async (): Promise<Project[]> => {
    await delay(100);
    return [...db.projects];
};

export const createProject = async (projectData: Omit<Project, 'id'>): Promise<Project> => {
    await delay(200);
    const newProject: Project = {
        ...projectData,
        id: `p${Date.now()}`,
    };
    db.projects.push(newProject);
    return newProject;
};

export const deleteProject = async (projectId: string): Promise<void> => {
    await delay(300);
    // Unassign tasks from this project
    db.tasks = db.tasks.map(task => {
        if (task.projectId === projectId) {
            return { ...task, projectId: null };
        }
        return task;
    });
    // Delete the project
    db.projects = db.projects.filter(p => p.id !== projectId);
};


export const getTasks = async (): Promise<Task[]> => {
    await delay(300);
    return [...db.tasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
};

export const getChats = async (userId: string): Promise<Chat[]> => {
    await delay(300);
    return db.chats.filter(c => c.participantIds.includes(userId));
};

export const createTask = async (taskData: Omit<Task, 'id'>): Promise<Task> => {
    await delay(400);
    const newTask: Task = {
        ...taskData,
        id: `t${Date.now()}`,
    };
    db.tasks.unshift(newTask);
    return newTask;
};

export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<Task> => {
    await delay(200);
    let taskToUpdate = db.tasks.find(t => t.id === taskId);
    if (!taskToUpdate) throw new Error('Task not found');
    taskToUpdate = { ...taskToUpdate, ...updates };
    db.tasks = db.tasks.map(t => (t.id === taskId ? taskToUpdate! : t));
    return taskToUpdate;
};

export const sendMessage = async (chatId: string, senderId: string, text: string): Promise<Message> => {
    await delay(100);
    const newMessage: Message = {
        id: `m${Date.now()}`,
        senderId,
        text,
        timestamp: new Date().toISOString(),
    };
    const chat = db.chats.find(c => c.id === chatId);
    if (chat) {
        chat.messages.push(newMessage);
    }
    return newMessage;
};

export const findOrCreateChat = async (userId1: string, userId2:string): Promise<Chat> => {
    await delay(200);

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
    return newChat;
};

export const createUser = async (userData: Omit<User, 'id'>, password: string): Promise<User> => {
    await delay(400);
    const newId = `u${Date.now()}`;
    const newUser: User = {
        id: newId,
        name: userData.name,
        role: userData.role,
        avatar: userData.avatar, // The avatar is now passed in userData
    };
    db.users.push(newUser);
    // Use the full name as the username key
    const username = userData.name;
    (db.credentials as any)[username] = { password, userId: newUser.id };
    return newUser;
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<User> => {
    await delay(200);
    let userToUpdate = db.users.find(u => u.id === userId);
    if (!userToUpdate) throw new Error('User not found');

    // If name is being updated, handle credential key change
    if (updates.name && updates.name !== userToUpdate.name) {
        const oldUsername = userToUpdate.name;
        const newUsername = updates.name;
        
        if ((db.credentials as any)[oldUsername]) {
            (db.credentials as any)[newUsername] = (db.credentials as any)[oldUsername];
            delete (db.credentials as any)[oldUsername];
        }
    }

    userToUpdate = { ...userToUpdate, ...updates };
    db.users = db.users.map(u => (u.id === userId ? userToUpdate! : u));
    return userToUpdate;
};

export const deleteUser = async (userId: string): Promise<void> => {
    await delay(300);

    // Unassign the user from all tasks
    db.tasks = db.tasks.map(task => {
        if (task.assigneeIds.includes(userId)) {
            return {
                ...task,
                assigneeIds: task.assigneeIds.filter(id => id !== userId),
            };
        }
        return task;
    });

    // Remove user from chats, remove their messages, and clean up empty chats
    const updatedChats = db.chats
        .map(chat => {
            // Remove user's messages
            const filteredMessages = chat.messages.filter(message => message.senderId !== userId);
            // Remove user from participants
            const filteredParticipants = chat.participantIds.filter(id => id !== userId);

            return {
                ...chat,
                messages: filteredMessages,
                participantIds: filteredParticipants,
            };
        })
        .filter(chat => {
            // A chat is only valid if it has at least 2 participants.
            // This will remove 1-on-1 chats when one person is deleted.
            return chat.participantIds.length >= (chat.isGroup ? 1 : 2);
        });
    db.chats = updatedChats;


    const userToDelete = db.users.find(u => u.id === userId);
    if (userToDelete) {
        // Use the full name to delete the credential
        const username = userToDelete.name;
        delete (db.credentials as any)[username];
    }
    
    // Remove the user from the users array
    db.users = db.users.filter(u => u.id !== userId);
};