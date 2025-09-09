import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Chat, User, Role } from '../types';
import { getChats, getUsers, sendMessage as apiSendMessage, findOrCreateChat, findAdminByAccountId, createGroupChat } from '../services/api';
import { useToast } from '../context/ToastContext';
import CreateGroupModal from '../components/CreateGroupModal';

const ChatPage: React.FC = () => {
    const { user: currentUser } = useAuth();
    const { addToast } = useToast();
    const [chats, setChats] = useState<Chat[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const previousChatsRef = useRef<Chat[]>([]);
    
    // Admin specific states
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [adminSearchId, setAdminSearchId] = useState('');
    const [foundAdmin, setFoundAdmin] = useState<User | null>(null);
    const [searchError, setSearchError] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const isAdmin = currentUser?.role === Role.ADMIN;

    useEffect(() => {
        previousChatsRef.current = chats;
    }, [chats]);

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) return;
            const [fetchedChats, fetchedUsers] = await Promise.all([getChats(currentUser.id), getUsers()]);
            setChats(fetchedChats);
            setUsers(fetchedUsers.filter(u => u.id !== currentUser.id));
            if (fetchedChats.length > 0 && !activeChatId) {
                setActiveChatId(fetchedChats[0].id);
            }
        };
        fetchData();
    }, [currentUser]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeChatId, chats]);

    useEffect(() => {
        if (!currentUser) return;

        const intervalId = setInterval(async () => {
            const newChats = await getChats(currentUser.id);
            const allUsers = await getUsers();
            let hasNewData = false;
            
            if (newChats.length !== previousChatsRef.current.length) {
                hasNewData = true;
            } else {
                 newChats.forEach(newChat => {
                    const oldChat = previousChatsRef.current.find(c => c.id === newChat.id);
                    if (oldChat && newChat.messages.length > oldChat.messages.length) {
                        const lastMessage = newChat.messages[newChat.messages.length - 1];
                        if (lastMessage.senderId !== currentUser.id) {
                            if (newChat.id !== activeChatId) {
                                const sender = allUsers.find(u => u.id === lastMessage.senderId);
                                addToast({
                                    type: 'info',
                                    message: `رسالة جديدة من ${sender ? sender.name : 'مستخدم'} في "${newChat.name}"`,
                                });
                            }
                        }
                        hasNewData = true;
                    }
                });
            }
           
            if(hasNewData) {
                 setChats(newChats);
            }

        }, 5000); 

        return () => clearInterval(intervalId);
    }, [currentUser, activeChatId, addToast]);

    const getChatPartner = (chat: Chat): User | undefined => {
        if (chat.isGroup || !currentUser) return undefined;
        const partnerId = chat.participantIds.find(id => id !== currentUser.id);
        const allUsersList = users.concat(currentUser ? [currentUser] : []);
        return allUsersList.find(u => u.id === partnerId);
    };

    const activeChat = chats.find(c => c.id === activeChatId);
    
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChatId || !currentUser) return;
        
        const sentMessage = await apiSendMessage(activeChatId, currentUser.id, newMessage);

        setChats(prevChats =>
            prevChats.map(chat =>
                chat.id === activeChatId
                    ? { ...chat, messages: [...chat.messages, sentMessage] }
                    : chat
            )
        );
        setNewMessage('');
    };
    
    const handleStartNewChat = async (partnerId: string) => {
        if (!currentUser) return;
        const chat = await findOrCreateChat(currentUser.id, partnerId);
        
        if (!chats.some(c => c.id === chat.id)) {
            setChats(prevChats => [chat, ...prevChats]);
        }
        
        setActiveChatId(chat.id);
    };

    const handleAdminSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setSearchError('');
        setFoundAdmin(null);
        if (!adminSearchId.trim()) return;
        setIsSearching(true);
        try {
            const admin = await findAdminByAccountId(adminSearchId.trim());
            if (admin && admin.id !== currentUser?.id) {
                setFoundAdmin(admin);
            } else if (admin?.id === currentUser?.id) {
                setSearchError('لا يمكنك البحث عن نفسك.');
            } else {
                setSearchError('لم يتم العثور على مدير بهذا الرقم.');
            }
        } catch {
            setSearchError('حدث خطأ أثناء البحث.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleStartChatWithFoundAdmin = async () => {
        if (!foundAdmin) return;
        await handleStartNewChat(foundAdmin.id);
        setFoundAdmin(null);
        setAdminSearchId('');
        setSearchError('');
    };

    const handleCreateGroup = async (groupData: { name: string; participantIds: string[] }) => {
        if (!currentUser) return;
        const newGroup = await createGroupChat(groupData.name, groupData.participantIds, currentUser.id);
        setChats(prev => [newGroup, ...prev]);
        setActiveChatId(newGroup.id);
        setIsGroupModalOpen(false);
        addToast({ type: 'success', message: `تم إنشاء مجموعة "${newGroup.name}"!` });
    };

    if (!currentUser) return null;

    const usersToChatWith = users.filter(user => {
        return !chats.some(chat => 
            !chat.isGroup && chat.participantIds.includes(user.id)
        );
    });

    return (
        <div className="flex h-full">
            <div className="w-1/3 xl:w-1/4 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold">الدردشة</h2>
                </div>
                
                {isAdmin && (
                    <div className="p-4 border-b dark:border-gray-700 space-y-4">
                        <button onClick={() => setIsGroupModalOpen(true)} className="w-full px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow">
                            + إنشاء مجموعة جديدة
                        </button>
                        <div>
                             <h3 className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider mb-2">البحث عن مدير</h3>
                             <form onSubmit={handleAdminSearch} className="flex space-x-2 space-x-reverse">
                                 <input 
                                     type="text"
                                     placeholder="أدخل رقم حساب المدير..."
                                     value={adminSearchId}
                                     onChange={e => setAdminSearchId(e.target.value)}
                                     className="flex-1 min-w-0 px-3 py-2 text-sm border rounded-md dark:bg-gray-600 dark:border-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                 />
                                 <button type="submit" disabled={isSearching} className="px-3 py-1 text-xs rounded-md text-white bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400">
                                     {isSearching ? '...' : 'بحث'}
                                 </button>
                             </form>
                             {searchError && <p className="text-xs text-red-500 mt-2">{searchError}</p>}
                             {foundAdmin && (
                                 <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-between">
                                     <div className="flex items-center">
                                        <img src={foundAdmin.avatar} alt={foundAdmin.name} className="w-8 h-8 rounded-full" />
                                        <p className="mr-2 text-sm font-semibold">{foundAdmin.name}</p>
                                     </div>
                                     <button onClick={handleStartChatWithFoundAdmin} className="px-2 py-1 text-xs rounded-md text-white bg-green-600 hover:bg-green-700">بدء الدردشة</button>
                                 </div>
                             )}
                        </div>
                    </div>
                )}
                
                <div className="flex-1 overflow-y-auto">
                     <div className="p-3">
                         <h3 className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">المحادثات الحالية</h3>
                    </div>
                    {chats.map(chat => {
                        const partner = getChatPartner(chat);
                        const chatName = chat.isGroup ? chat.name : partner?.name || "مستخدم غير معروف";
                        const avatar = chat.isGroup ? `https://i.pravatar.cc/150?u=${chat.id}` : partner?.avatar;
                        const lastMessage = chat.messages[chat.messages.length - 1];

                        return (
                            <div
                                key={chat.id}
                                onClick={() => setActiveChatId(chat.id)}
                                className={`flex items-center p-3 cursor-pointer transition-colors ${
                                    activeChatId === chat.id ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            >
                                <img src={avatar} alt={chatName} className="w-12 h-12 rounded-full object-cover" />
                                <div className="mr-3 flex-1 overflow-hidden">
                                    <p className="font-semibold text-gray-800 dark:text-white truncate">{chatName}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{lastMessage?.text || 'ابدأ المحادثة'}</p>
                                </div>
                            </div>
                        );
                    })}

                    {usersToChatWith.length > 0 && (
                        <>
                            <div className="p-3 mt-4 border-t dark:border-gray-700">
                                <h3 className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider">بدء محادثة جديدة</h3>
                            </div>
                            {usersToChatWith.map(user => (
                                <div
                                    key={user.id}
                                    onClick={() => handleStartNewChat(user.id)}
                                    className="flex items-center p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                                    <div className="mr-3 flex-1">
                                        <p className="font-semibold text-gray-800 dark:text-white">{user.name}</p>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
                {activeChat ? (
                    <>
                        <div className="flex items-center p-4 border-b bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm">
                            <img src={activeChat.isGroup ? `https://i.pravatar.cc/150?u=${activeChat.id}` : getChatPartner(activeChat)?.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                            <h3 className="mr-3 font-semibold text-lg">{activeChat.isGroup ? activeChat.name : getChatPartner(activeChat)?.name}</h3>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto">
                            {activeChat.messages.map(msg => (
                                <div key={msg.id} className={`flex mb-4 ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl ${msg.senderId === currentUser.id ? 'bg-indigo-500 text-white' : 'bg-white dark:bg-gray-700'}`}>
                                        <p>{msg.text}</p>
                                        <p className="text-xs opacity-75 mt-1 text-right">{new Date(msg.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
                            <form onSubmit={handleSendMessage} className="flex items-center">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    placeholder="اكتب رسالتك هنا..."
                                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <button type="submit" className="mr-3 px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors">
                                    إرسال
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        <p>اختر محادثة أو ابدأ محادثة جديدة</p>
                    </div>
                )}
            </div>
            
            {isAdmin && (
                <CreateGroupModal
                    isOpen={isGroupModalOpen}
                    onClose={() => setIsGroupModalOpen(false)}
                    onSave={handleCreateGroup}
                    users={users}
                />
            )}
        </div>
    );
};

export default ChatPage;