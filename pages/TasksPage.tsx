import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskStatus, User, Project } from '../types';
import { getTasks, getUsers, createTask, updateTask, getProjects, createProject } from '../services/api';
import TaskCard from '../components/TaskCard';
import CreateTaskModal from '../components/CreateTaskModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

type ProjectFilter = 'all' | 'unassigned' | string;

const ProjectSidebar: React.FC<{
    projects: Project[];
    selectedProjectId: ProjectFilter;
    onSelectProject: (id: ProjectFilter) => void;
    onAddProject: (name: string) => void;
}> = ({ projects, selectedProjectId, onSelectProject, onAddProject }) => {
    const [newProjectName, setNewProjectName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const { t } = useLanguage();

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newProjectName.trim()) {
            onAddProject(newProjectName.trim());
            setNewProjectName('');
            setIsAdding(false);
        }
    };

    const ProjectButton: React.FC<{
        onClick: () => void;
        isActive: boolean;
        children: React.ReactNode;
        color?: string;
    }> = ({ onClick, isActive, children, color }) => (
        <button
            onClick={onClick}
            className={`flex items-center w-full text-start px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
        >
            {color && <span className="w-3 h-3 rounded-full me-3 flex-shrink-0" style={{ backgroundColor: color }}></span>}
            <span className="truncate">{children}</span>
        </button>
    );

    return (
        <>
            <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-700 px-4">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">{t('tasksPage.projects')}</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <ProjectButton onClick={() => onSelectProject('all')} isActive={selectedProjectId === 'all'}>
                    {t('tasksPage.allTasks')}
                </ProjectButton>
                <ProjectButton onClick={() => onSelectProject('unassigned')} isActive={selectedProjectId === 'unassigned'}>
                    {t('tasksPage.generalTasks')}
                </ProjectButton>
                <hr className="my-3 border-gray-200 dark:border-gray-700" />
                {projects.map(project => (
                    <ProjectButton
                        key={project.id}
                        onClick={() => onSelectProject(project.id)}
                        isActive={selectedProjectId === project.id}
                        color={project.color}
                    >
                        {project.name}
                    </ProjectButton>
                ))}
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                {isAdding ? (
                    <form onSubmit={handleAddSubmit}>
                        <input
                            type="text"
                            value={newProjectName}
                            onChange={e => setNewProjectName(e.target.value)}
                            placeholder={t('tasksPage.newProjectPlaceholder')}
                            className="w-full px-3 py-2 text-sm border rounded-md dark:bg-gray-600 dark:border-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            autoFocus
                        />
                        <div className="flex justify-end space-x-2 mt-2">
                             <button type="button" onClick={() => setIsAdding(false)} className="px-3 py-1 text-xs rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 dark:text-gray-200 dark:bg-gray-500 dark:hover:bg-gray-400">{t('tasksPage.cancel')}</button>
                             <button type="submit" className="px-3 py-1 text-xs rounded-md text-white bg-indigo-600 hover:bg-indigo-700">{t('tasksPage.add')}</button>
                        </div>
                    </form>
                ) : (
                    <button onClick={() => setIsAdding(true)} className="w-full px-4 py-2 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-900 transition-colors">
                        {t('tasksPage.addNewProject')}
                    </button>
                )}
            </div>
        </>
    );
};

const TasksPage: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<TaskStatus | 'all'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user: currentUser } = useAuth();
    const { addToast } = useToast();
    const { t } = useLanguage();
    const [notifiedTaskIds, setNotifiedTaskIds] = useState<Set<string>>(new Set());
    const [selectedProjectId, setSelectedProjectId] = useState<ProjectFilter>('all');

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [fetchedTasks, fetchedUsers, fetchedProjects] = await Promise.all([getTasks(), getUsers(), getProjects()]);
            setTasks(fetchedTasks);
            setUsers(fetchedUsers);
            setProjects(fetchedProjects);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (!tasks.length || !currentUser) return;

        const checkDueDates = () => {
            const now = new Date();
            const oneDayInMs = 24 * 60 * 60 * 1000;

            tasks.forEach(task => {
                const isAssignedToMe = task.assigneeIds.includes(currentUser.id);
                const dueDate = new Date(task.dueDate);
                const timeDiff = dueDate.getTime() - now.getTime();

                if (isAssignedToMe && task.status !== TaskStatus.COMPLETED && timeDiff > 0 && timeDiff <= oneDayInMs) {
                    if (!notifiedTaskIds.has(task.id)) {
                         addToast({
                            type: 'warning',
                            message: t('tasksPage.dueDateAlert', { taskTitle: task.title }),
                        });
                        setNotifiedTaskIds(prev => new Set(prev).add(task.id));
                    }
                }
            });
        };

        checkDueDates();
    }, [tasks, currentUser, addToast, t]);
    
    const handleCreateTask = async (taskData: Omit<Task, 'id' | 'createdBy'>) => {
        if (!currentUser) return;
        const newTask = await createTask({ ...taskData, createdBy: currentUser.id });
        setTasks(prevTasks => [newTask, ...prevTasks]);
        setIsModalOpen(false);
        addToast({ type: 'success', message: t('tasksPage.taskCreatedSuccess') });
    };

    const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus) => {
        const taskToUpdate = tasks.find(t => t.id === taskId);
        if(!taskToUpdate || !currentUser) return;
        
        const updatedTask = await updateTask(taskId, { status });
        setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));

        const wasAssignedToMe = taskToUpdate.assigneeIds.includes(currentUser.id);
        if (wasAssignedToMe && updatedTask.status === TaskStatus.COMPLETED) {
            addToast({
                type: 'success',
                message: t('tasksPage.taskCompletedSuccess', { taskTitle: updatedTask.title }),
            });
        }
    };
    
    const handleAddProject = async (name: string) => {
        const randomColor = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
        const newProject = await createProject({ name, color: randomColor });
        setProjects(prev => [...prev, newProject]);
        setSelectedProjectId(newProject.id);
        addToast({ type: 'success', message: t('tasksPage.projectCreatedSuccess', { projectName: name }) });
    };

    const filteredTasks = useMemo(() => {
        return tasks
            .filter(task => {
                if (selectedProjectId === 'all') return true;
                if (selectedProjectId === 'unassigned') return !task.projectId;
                return task.projectId === selectedProjectId;
            })
            .filter(task => activeTab === 'all' || task.status === activeTab)
            .filter(task => {
                const assignedUsers = task.assigneeIds.map(id => users.find(u => u.id === id)?.name || '').join(' ');
                return (
                    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    assignedUsers.toLowerCase().includes(searchTerm.toLowerCase())
                );
            });
    }, [tasks, users, activeTab, searchTerm, selectedProjectId]);
    
    const tabs: { label: string; value: TaskStatus | 'all' }[] = [
        { label: t('tasksPage.tabAll'), value: 'all' },
        { label: t('tasksPage.tabPending'), value: TaskStatus.PENDING },
        { label: t('tasksPage.tabCompleted'), value: TaskStatus.COMPLETED },
        { label: t('tasksPage.tabOnHold'), value: TaskStatus.ON_HOLD },
    ];

    const selectedProject = projects.find(p => p.id === selectedProjectId);
    const pageTitle = selectedProjectId === 'all' 
        ? t('tasksPage.allTasks') 
        : selectedProjectId === 'unassigned' 
        ? t('tasksPage.generalTasks')
        : selectedProject?.name || t('tasksPage.taskBoard');

    return (
        <div className="flex h-full bg-gray-100 dark:bg-gray-900">
             <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                <header className="flex flex-col md:flex-row justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4 md:mb-0">{pageTitle}</h1>
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            placeholder={t('tasksPage.searchTasks')}
                            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64 bg-white dark:bg-gray-700 dark:border-gray-600"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md whitespace-nowrap"
                        >
                            {t('tasksPage.newTask')}
                        </button>
                    </div>
                </header>
                
                <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
                    <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab.value}
                                onClick={() => setActiveTab(tab.value)}
                                className={`${
                                    activeTab === tab.value
                                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {isLoading ? (
                    <div className="text-center py-10">{t('tasksPage.loadingTasks')}</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredTasks.length > 0 ? (
                            filteredTasks.map(task => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    users={users}
                                    projects={projects}
                                    onStatusChange={handleUpdateTaskStatus}
                                />
                            ))
                        ) : (
                            <p className="col-span-full text-center py-10 text-gray-500">{t('tasksPage.noTasksFound')}</p>
                        )}
                    </div>
                )}
            </main>
            
            <aside className="w-72 flex-shrink-0 bg-white dark:bg-gray-800 border-s border-gray-200 dark:border-gray-700 flex flex-col">
                <ProjectSidebar 
                    projects={projects}
                    selectedProjectId={selectedProjectId}
                    onSelectProject={setSelectedProjectId}
                    onAddProject={handleAddProject}
                />
            </aside>
            
            <CreateTaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateTask}
                users={users}
                projects={projects}
                initialProjectId={selectedProjectId !== 'all' && selectedProjectId !== 'unassigned' ? selectedProjectId : null}
            />
        </div>
    );
};

export default TasksPage;
