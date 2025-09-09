export enum Role {
    ADMIN = 'admin',
    EMPLOYEE = 'employee',
}

export enum TaskStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    ON_HOLD = 'ON_HOLD',
}

export interface Project {
    id: string;
    name: string;
    color: string;
}

export interface User {
    id:string;
    name: string;
    role: Role;
    avatar: string;
    accountId: string;
}

export interface Task {
    id: string;
    title: string;
    description: string;
    assigneeIds: string[];
    dueDate: string;
    status: TaskStatus;
    createdBy: string;
    projectId?: string | null;
}

export interface Message {
    id: string;
    senderId: string;
    text: string;
    timestamp: string;
    imageUrl?: string;
    documentUrl?: string;
    readBy: string[];
}

export interface Chat {
    id: string;
    name: string;
    participantIds: string[];
    messages: Message[];
    isGroup: boolean;
}

export interface AppDB {
    users: User[];
    projects: Project[];
    tasks: Task[];
    chats: Chat[];
    credentials: Record<string, { password: string; userId: string; }>;
}