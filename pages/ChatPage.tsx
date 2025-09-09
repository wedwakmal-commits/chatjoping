import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Chat, User } from '../types';
import { getChats, getUsers, sendMessage as apiSendMessage, findOrCreateChat } from '../services/api';
import { useToast } from '../context/ToastContext';

const ChatPage: React.FC = () => {
    const { user: currentUser } = useAuth();
    const { addToast } = useToast();
    const [chats, setChats] = useState<Chat[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const previousChatsRef = useRef<Chat[]>([]);

    useEffect(() => {
        previousChatsRef.current = chats;
    }, [chats]);

    // Initial data fetch
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
    }, [currentUser, activeChatId]); // re-check activeChatId to avoid race condition on first load

    // Scroll to bottom when new messages arrive or chat is changed
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeChatId, chats]);

    // Polling for new messages and showing notifications
    useEffect(() => {
        if (!currentUser) return;

        const intervalId = setInterval(async () => {
            const [newChats, allUsers] = await Promise.all([getChats(currentUser.id), getUsers()]);
            const oldChats = previousChatsRef.current;
            let hasNewData = false;

            newChats.forEach(newChat => {
                const oldChat = oldChats.find(c => c.id === newChat.id);
                
                if (!oldChat && newChat.messages.length > 0) {
                     const firstMessage = newChat.messages[0];
                     if(firstMessage && firstMessage.senderId !== currentUser.id){
                         const sender = allUsers.find(u => u.id === firstMessage.senderId);
                         addToast({
                            type: 'info',
                            message: `${sender ? sender.name : 'مستخدم'} بدأ محادثة جديدة معك.`
                         });
                         hasNewData = true;
                     }
                } else if (oldChat && newChat.messages.length > oldChat.messages.length) {
                    const lastMessage = newChat.messages[newChat.messages.length - 1];
                    if (lastMessage.senderId !== currentUser.id) {
                        if (newChat.id !== activeChatId) {
                            const sender = allUsers.find(u => u.id === lastMessage.senderId);
                            addToast({
                                type: 'info',
                                message: `رسالة جديدة من ${sender ? sender.name : 'مستخدم'}:\n"${lastMessage.text}"`,
                            });
                        }
                        hasNewData = true;
                    }
                }
            });

            if (hasNewData) {
                setChats(newChats);
            }

        }, 3000); // Poll every 3 seconds

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

    if (!currentUser) return null;

    const usersToChatWith = users.filter(user => {
        return !chats.some(chat => 
            !chat.isGroup && chat.participantIds.includes(user.id)
        );
    });

    return (
        <div className="flex h-full">
            {/* Chat List */}
            <div className="w-1/3 xl:w-1/4 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold">الدردشة</h2>
                </div>
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

            {/* Chat Window */}
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
        </div>
    );
};

export default ChatPage;