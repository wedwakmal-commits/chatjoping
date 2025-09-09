import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Chat, User, Message } from '../types';
import { getChats, getUsers, createChat, sendMessage, searchAdminByAccountId, markMessagesAsRead, getTypingUsers, startTyping, stopTyping } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import CreateGroupModal from '../components/CreateGroupModal';
import { SearchIcon, CloseIcon, ChevronUpIcon, ChevronDownIcon, CheckCircleIcon } from '../components/icons';
import { useDebouncedCallback } from 'use-debounce';

const ChatPage: React.FC = () => {
    const [chats, setChats] = useState<Chat[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [activeChat, setActiveChat] = useState<Chat | null>(null);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchAccountId, setSearchAccountId] = useState('');
    const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<string[]>([]);
    const [currentResultIndex, setCurrentResultIndex] = useState(-1);

    const { user: currentUser } = useAuth();
    const { t } = useLanguage();
    const { addToast } = useToast();
    const messageEndRef = useRef<HTMLDivElement>(null);
    const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    const fetchData = useCallback(async () => {
        // No loading indicator on refetch to avoid flicker
        try {
            const [fetchedChats, fetchedUsers] = await Promise.all([getChats(), getUsers()]);
            setChats(fetchedChats);
            setUsers(fetchedUsers);
            
            if (activeChat) {
                const updatedActiveChat = fetchedChats.find(c => c.id === activeChat.id);
                if (updatedActiveChat) {
                    setActiveChat(updatedActiveChat);
                } else {
                    setActiveChat(null); // Active chat was deleted
                }
            }
        } catch (error) {
            console.error("Failed to fetch chat data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [activeChat]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [fetchData]);

    useEffect(() => {
        if (!searchQuery) {
            messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activeChat?.messages, searchQuery]);

     useEffect(() => {
        if (activeChat && currentUser) {
            markMessagesAsRead(activeChat.id, currentUser.id);
        }
        // Reset search on chat change
        setSearchQuery('');
        setSearchResults([]);
        setCurrentResultIndex(-1);
    }, [activeChat?.id, currentUser]);

    // Typing indicators polling
    useEffect(() => {
        if (!activeChat) return;

        const pollTyping = async () => {
            const typingIds = await getTypingUsers(activeChat.id);
            setTypingUserIds(typingIds.filter(id => id !== currentUser?.id));
        };
        const intervalId = setInterval(pollTyping, 2000);
        return () => clearInterval(intervalId);
    }, [activeChat, currentUser?.id]);
    
    // Search logic
    useEffect(() => {
        if (searchQuery && activeChat) {
            const results = activeChat.messages
                .filter(msg => msg.text.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(msg => msg.id);
            setSearchResults(results);
            setCurrentResultIndex(results.length > 0 ? 0 : -1);
        } else {
            setSearchResults([]);
            setCurrentResultIndex(-1);
        }
    }, [searchQuery, activeChat]);

    // Scroll to search result
    useEffect(() => {
        if (currentResultIndex !== -1 && searchResults[currentResultIndex]) {
            const messageId = searchResults[currentResultIndex];
            messageRefs.current.get(messageId)?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [currentResultIndex, searchResults]);

    const debouncedTyping = useDebouncedCallback(() => {
        if (activeChat && currentUser) {
            stopTyping(activeChat.id, currentUser.id);
        }
    }, 2000);

    const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(e.target.value);
        if (activeChat && currentUser) {
            startTyping(activeChat.id, currentUser.id);
            debouncedTyping();
        }
    };
    
    const getUserById = (id: string) => users.find(u => u.id === id);

    const getChatName = (chat: Chat) => {
        if (chat.isGroup) {
            return chat.name;
        }
        const otherUserId = chat.participantIds.find(id => id !== currentUser?.id);
        return otherUserId ? getUserById(otherUserId)?.name : t('chatPage.unknownUser');
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !activeChat || !currentUser) return;
        
        stopTyping(activeChat.id, currentUser.id);
        const sentMessage = await sendMessage(activeChat.id, { text: message.trim(), senderId: currentUser.id });
        
        const updatedChats = chats.map(c => 
            c.id === activeChat.id 
            ? { ...c, messages: [...c.messages, sentMessage] } 
            : c
        );
        setChats(updatedChats);
        setActiveChat(updatedChats.find(c => c.id === activeChat.id) || null);
        
        setMessage('');
    };

    const handleCreateGroup = async (groupData: { name: string; participantIds: string[] }) => {
        if (!currentUser) return;
        const newGroup = await createChat({ ...groupData, participantIds: [...groupData.participantIds, currentUser.id], isGroup: true });
        setChats(prev => [newGroup, ...prev]);
        setIsGroupModalOpen(false);
        setActiveChat(newGroup);
        addToast({ type: 'success', message: t('chatPage.newGroupSuccess', { groupName: newGroup.name }) });
    };

    const handleSearchAndStartChat = async () => {
        if (!searchAccountId.trim() || !currentUser) return;
        if(users.find(u=>u.id === currentUser.id)?.accountId === searchAccountId) {
            addToast({ type: 'error', message: t('chatPage.searchErrorSelf') });
            return;
        }
        setIsSearching(true);
        try {
            const admin = await searchAdminByAccountId(searchAccountId);
            if (admin) {
                const existingChat = chats.find(c => !c.isGroup && c.participantIds.includes(admin.id) && c.participantIds.includes(currentUser.id));
                if (existingChat) {
                    setActiveChat(existingChat);
                } else {
                    const newChat = await createChat({ name: 'DM', participantIds: [currentUser.id, admin.id], isGroup: false });
                    setChats(prev => [newChat, ...prev]);
                    setActiveChat(newChat);
                }
                setSearchAccountId('');
            } else {
                addToast({ type: 'error', message: t('chatPage.searchErrorNotFound') });
            }
        } catch (error) {
            addToast({ type: 'error', message: t('chatPage.searchErrorGeneric') });
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearchResultNavigation = (direction: 'next' | 'prev') => {
        if (searchResults.length === 0) return;
        let nextIndex = currentResultIndex;
        if (direction === 'next') {
            nextIndex = (currentResultIndex + 1) % searchResults.length;
        } else {
            nextIndex = (currentResultIndex - 1 + searchResults.length) % searchResults.length;
        }
        setCurrentResultIndex(nextIndex);
    };

    const highlightText = (text: string, highlight: string) => {
        if (!highlight.trim()) {
            return <span>{text}</span>;
        }
        const regex = new RegExp(`(${highlight})`, 'gi');
        const parts = text.split(regex);
        return (
            <span>
                {parts.map((part, i) =>
                    regex.test(part) ? (
                        <mark key={i} className="bg-yellow-300 dark:bg-yellow-500 rounded px-0.5">
                            {part}
                        </mark>
                    ) : (
                        part
                    )
                )}
            </span>
        );
    };

    const typingUsers = useMemo(() => typingUserIds.map(getUserById).filter(Boolean) as User[], [typingUserIds, users]);

    const userChats = chats.filter(c => c.participantIds.includes(currentUser?.id || ''));

    const ReadReceipt: React.FC<{ message: Message }> = ({ message }) => {
        if (!currentUser || message.senderId !== currentUser.id) return null;
        
        const isReadByOthers = message.readBy.some(id => id !== currentUser.id);

        return (
            <div className="me-1">
                <CheckCircleIcon 
                    className={`w-4 h-4 ${isReadByOthers ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'}`} 
                    isDouble={isReadByOthers}
                />
            </div>
        );
    };

    return (
        <div className="flex h-full bg-gray-100 dark:bg-gray-900">
            <aside className="w-80 flex-shrink-0 bg-white dark:bg-gray-800 border-e border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="h-16 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">{t('chatPage.title')}</h2>
                    <button onClick={() => setIsGroupModalOpen(true)} className="px-3 py-1.5 text-xs bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-900">
                        {t('chatPage.newGroup')}
                    </button>
                </div>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold mb-2">{t('chatPage.searchAdmin')}</p>
                    <div className="flex space-x-2">
                        <input 
                            type="text" 
                            placeholder={t('chatPage.searchAdminPlaceholder')}
                            value={searchAccountId}
                            onChange={(e) => setSearchAccountId(e.target.value)}
                            className="flex-grow px-3 py-1.5 text-sm border rounded-md dark:bg-gray-600 dark:border-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button onClick={handleSearchAndStartChat} disabled={isSearching} className="px-3 py-1.5 text-sm rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400">
                            {isSearching ? t('chatPage.searching') : t('chatPage.search')}
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {userChats.map(chat => (
                        <button key={chat.id} onClick={() => setActiveChat(chat)} className={`w-full text-start px-4 py-3 flex items-center space-x-3 transition-colors ${activeChat?.id === chat.id ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                            {/* Avatar placeholder */}
                            <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0"></div>
                            <div>
                                <p className="font-semibold text-sm text-gray-800 dark:text-white">{getChatName(chat)}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{chat.messages[chat.messages.length - 1]?.text}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </aside>
            <main className="flex-1 flex flex-col">
                {activeChat ? (
                    <>
                        <header className="h-16 flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
                            <h3 className="font-bold text-gray-800 dark:text-white">{getChatName(activeChat)}</h3>
                             <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <SearchIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 ms-2" />
                                <input
                                    type="text"
                                    placeholder={t('chatPage.searchInConversation')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="px-2 py-1.5 text-sm bg-transparent focus:outline-none w-40"
                                />
                                {searchQuery && (
                                    <>
                                        {searchResults.length > 0 && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400 px-1">
                                                {currentResultIndex + 1}/{searchResults.length}
                                            </span>
                                        )}
                                        <button onClick={() => handleSearchResultNavigation('prev')} disabled={searchResults.length < 2} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"><ChevronUpIcon className="w-4 h-4"/></button>
                                        <button onClick={() => handleSearchResultNavigation('next')} disabled={searchResults.length < 2} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"><ChevronDownIcon className="w-4 h-4"/></button>
                                        <button onClick={() => setSearchQuery('')} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 me-1"><CloseIcon className="w-4 h-4"/></button>
                                    </>
                                )}
                            </div>
                        </header>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {activeChat.messages.map(msg => {
                                const sender = getUserById(msg.senderId);
                                const isMe = msg.senderId === currentUser?.id;
                                const isCurrentSearchResult = searchResults[currentResultIndex] === msg.id;
                                return (
                                    <div 
                                        key={msg.id}
                                        // FIX: The ref callback should not return a value. 
                                        // Map.set returns the map, and Map.delete returns a boolean, both of which are invalid.
                                        // Wrapping the logic in a block with explicit statements fixes this.
                                        ref={el => {
                                            if (el) {
                                                messageRefs.current.set(msg.id, el);
                                            } else {
                                                messageRefs.current.delete(msg.id);
                                            }
                                        }}
                                        className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'} ${isCurrentSearchResult ? 'scale-105 transition-transform duration-300' : ''}`}
                                    >
                                        {!isMe && sender && <img src={sender.avatar} alt={sender.name} className="w-8 h-8 rounded-full" />}
                                        <div className={`max-w-md p-3 rounded-xl ${isMe ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                                            {!isMe && <p className="text-xs font-bold mb-1 text-indigo-600 dark:text-indigo-400">{sender?.name}</p>}
                                            <p className="text-sm">{highlightText(msg.text, searchQuery)}</p>
                                            <div className="text-xs opacity-70 mt-1 flex items-center justify-end">
                                                <ReadReceipt message={msg} />
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                             <div ref={messageEndRef} />
                        </div>
                        <footer className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                            <div className="h-5 text-xs text-gray-500 dark:text-gray-400 italic ps-4">
                                {typingUsers.length > 0 && 
                                    `${typingUsers.map(u => u.name).join(', ')} ${t('chatPage.isTyping')}`
                                }
                            </div>
                            <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                                <input type="text" value={message} onChange={handleMessageChange} placeholder={t('chatPage.typeMessagePlaceholder')} className="flex-1 px-4 py-2 border rounded-full bg-gray-100 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700">{t('chatPage.send')}</button>
                            </form>
                        </footer>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">{t('chatPage.selectConversationPrompt')}</div>
                )}
            </main>
            <CreateGroupModal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} onSave={handleCreateGroup} users={users.filter(u => u.id !== currentUser?.id)} />
        </div>
    );
};

export default ChatPage;