import React, { useState, useEffect } from 'react';
import { 
  Search, 
  UserPlus, 
  Plus,
  MessageSquare, 
  Users, 
  MoreHorizontal, 
  Phone, 
  Video,
  Send,
  Smile,
  Paperclip,
  CheckCheck,
  UserCheck,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import api from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { useMessaging } from '../hooks/useMessaging';


export default function Messages() {
  const { 
    user, 
    groups, 
    setGroups, 
    allProfiles, 
    friendRequests,
    isLoading: isLoadingProfiles 
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<'chats' | 'friends' | 'groups'>('chats');
  const [selectedChat, setSelectedChat] = useState<{ id: string, type: 'private' | 'group', name: string, avatar: string } | null>(null);
  const [showChatMobile, setShowChatMobile] = useState(false);
  const [input, setInput] = useState('');

  // Persistent Messaging Hook
  const {
    chatMessages,
    unreadCounts,
    isTyping,
    isConnected,
    sendDM,
    sendGroupMessage,
    setTypingStatus
  } = useMessaging(
    selectedChat?.type === 'private' ? selectedChat.id : undefined,
    selectedChat?.type === 'group' ? selectedChat.id : undefined
  );

  // Derive final chat list combining profiles and groups
  const chatList = React.useMemo(() => {
    if (!user) return [];
    
    if (activeTab === 'groups') {
      return groups.map(g => {
        return {
          id: g.id,
          name: g.name,
          avatar: g.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${g.name}`,
          type: 'group',
          lastMsg: 'Study Group',
          time: '',
          unread: 0,
          isTyping: false
        };
      });
    }

    const contactMap = new Map();
    
    // Add profiles
    allProfiles.filter(p => p.id !== user.id).forEach(p => {
      const isFriend = user.following?.includes(p.id) && p.following?.includes(user.id);
      
      // If we're on 'chats' tab, we might want to only show people we have messages with or friends
      if (activeTab === 'friends' || (activeTab === 'chats' && isFriend)) {
        contactMap.set(p.id, {
          id: p.id,
          name: p.name || 'User',
          avatar: p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`,
          lastMsg: isFriend ? 'Tap to message' : 'Follow each other to chat',
          time: '',
          unread: unreadCounts[p.id] || 0,
          type: 'private',
          isTyping: false,
          isFriend
        });
      }
    });

    return Array.from(contactMap.values());
  }, [user, allProfiles, activeTab, groups, unreadCounts]);

  const currentChatData = chatList.find(c => c.id === selectedChat?.id);
  const isChatBlocked = selectedChat?.type === 'private' && !currentChatData?.isFriend;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedChat || isChatBlocked) return;
    
    if (selectedChat.type === 'group') {
      sendGroupMessage(input.trim());
    } else {
      sendDM(input.trim());
    }
    
    setInput('');
    setTypingStatus(false);
  };

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    try {
      const res = await api.post('/groups', { name: groupName });
      if (res.data) {
        setGroups(prev => [...prev, res.data]);
        setShowCreateGroup(false);
        setGroupName('');
        setSelectedChat({ 
          id: res.data._id || res.data.id, 
          type: 'group', 
          name: res.data.name, 
          avatar: res.data.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${res.data.name}`
        });
      }
    } catch (err) {
      console.error('Error creating group:', err);
    }
  };

  const activeMessages = React.useMemo(() => {
    return [...chatMessages].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [chatMessages]);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  return (
    <div className="h-[calc(100vh-140px)] sm:h-[calc(100vh-120px)] flex gap-4 sm:gap-6 animate-in fade-in duration-500">
      {/* Sidebar - Contacts & Tabs */}
      <div className={cn(
        "w-full sm:w-80 flex flex-col gap-4 sm:gap-6",
        showChatMobile ? "hidden sm:flex" : "flex"
      )}>
        <div className="glass-card p-4 sm:p-6 flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-text-main">Messages</h1>
            <div className="flex gap-2">
              <Link
                to="/community"
                title="Friend Requests"
                className="relative p-1.5 sm:p-2 bg-secondary/10 text-secondary hover:bg-secondary hover:text-white rounded-xl transition-all border border-secondary/20"
              >
                <UserPlus size={18} />
                {friendRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full border-2 border-surface animate-pulse">
                    {friendRequests.length}
                  </span>
                )}
              </Link>
              <button 
                onClick={() => setShowCreateGroup(true)}
                title="Create Group"
                className="p-1.5 sm:p-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-all border border-primary/20"
              >
                <Users size={18} />
              </button>
            </div>

          </div>

          <AnimatePresence>
            {showCreateGroup && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 bg-surface-alt/30 border border-border rounded-2xl p-4 overflow-hidden"
              >
                <form onSubmit={handleCreateGroup} className="space-y-3">
                  <p className="text-xs font-bold text-text-main">Create New Study Group</p>
                  <input 
                    type="text" 
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Group Name..."
                    className="w-full bg-surface border border-border rounded-xl py-2 px-3 text-xs outline-none focus:border-primary/50 text-text-main"
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 bg-primary text-white text-[10px] font-bold py-2 rounded-lg">Create</button>
                    <button type="button" onClick={() => setShowCreateGroup(false)} className="flex-1 bg-surface-alt text-text-muted text-[10px] font-bold py-2 rounded-lg">Cancel</button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs */}
          <div className="flex bg-surface-alt/50 p-1 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 border border-border">
            {['chats', 'groups', 'friends'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold transition-all capitalize",
                  activeTab === tab ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-text-muted hover:text-text-main"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative mb-4 sm:mb-6">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full bg-surface-alt/50 border border-border rounded-xl sm:rounded-2xl py-2 sm:py-2.5 pl-9 sm:pl-10 pr-4 text-xs sm:text-sm outline-none focus:border-primary/30 transition-all text-text-main placeholder:text-text-muted"
            />
          </div>

          <div className="flex-grow overflow-y-auto custom-scrollbar space-y-3 sm:space-y-4">
            {isLoadingProfiles ? (
              <div className="flex flex-col items-center justify-center h-40 text-text-muted">
                <Loader2 size={24} className="animate-spin mb-2" />
                <p className="text-xs">Loading...</p>
              </div>
            ) : (
              chatList.map((chat) => (
                <div 
                  key={chat.id} 
                  onClick={() => {
                    setSelectedChat(chat);
                    setShowChatMobile(true);
                  }}
                  className={cn(
                    "flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-xl sm:rounded-2xl cursor-pointer transition-all group",
                    selectedChat?.id === chat.id ? "bg-primary/10 border border-primary/20" : "hover:bg-surface-alt/50 border border-transparent"
                  )}
                >
                  <div className="relative shrink-0">
                    <img src={chat.avatar} alt={chat.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-border object-cover" />
                    {chat.isTyping && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-xs sm:text-sm font-bold text-text-main truncate">{chat.name}</p>
                      <span className="text-[8px] sm:text-[10px] text-text-muted">{chat.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      {chat.type === 'private' && !chat.isFriend && (
                        <span className="shrink-0 text-[8px] bg-surface-alt text-text-muted px-1 rounded uppercase font-bold">Not Friend</span>
                      )}
                      <p className={cn(
                        "text-[10px] sm:text-xs truncate",
                        chat.isTyping ? "text-primary italic" : "text-text-muted"
                      )}>
                        {chat.isTyping ? 'typing...' : chat.lastMsg}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={cn(
        "flex-grow glass-card flex flex-col overflow-hidden",
        !showChatMobile ? "hidden sm:flex" : "flex"
      )}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between bg-surface-alt/5 backdrop-blur-md">
              <div className="flex items-center gap-3 sm:gap-4">
                <button 
                  onClick={() => setShowChatMobile(false)}
                  className="p-1.5 hover:bg-surface rounded-lg text-text-muted sm:hidden"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="relative">
                  <img src={selectedChat.avatar} alt={selectedChat.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-border" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-lg font-bold text-text-main truncate max-w-[120px] sm:max-w-none">{selectedChat.name}</h2>
                  <p className="text-[10px] sm:text-xs text-primary font-medium flex items-center gap-1">
                    {isTyping ? 'typing...' : (selectedChat.type === 'group' ? 'Group Study' : (isChatBlocked ? 'Mutual friends only' : (isConnected ? 'Online' : 'Reconnecting...')))}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-3">
                <button className="p-2 sm:p-2.5 bg-surface-alt/50 hover:bg-surface-alt rounded-lg text-text-muted border border-border">
                  <Phone size={18} />
                </button>
                <button className="p-2 sm:p-2.5 bg-surface-alt/50 hover:bg-surface-alt rounded-lg text-text-muted border border-border">
                  <Video size={18} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
              {activeMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-text-muted">
                  <MessageSquare size={48} className="mb-4 opacity-10" />
                  <p className="text-xs">No messages history. Say hello!</p>
                </div>
              ) : (
                activeMessages.map((msg, idx) => (
                  <div 
                    key={msg._id || idx}
                    className={cn(
                      "flex flex-col gap-1 max-w-[85%]",
                      msg.fromUserId === user?.id ? "ml-auto" : ""
                    )}
                  >
                    {selectedChat.type === 'group' && msg.fromUserId !== user?.id && (
                      <p className="text-[10px] font-bold text-primary ml-1">{msg.fromUserName || 'Member'}</p>
                    )}
                    <div className={cn(
                      "p-3 rounded-2xl text-xs sm:text-sm shadow-sm",
                      msg.fromUserId === user?.id 
                        ? "bg-primary text-white rounded-br-none" 
                        : "bg-surface-alt border border-border text-text-main rounded-bl-none"
                    )}>
                      {msg.text}
                      <div className={cn(
                        "flex items-center gap-1 mt-1 opacity-70 text-[8px]",
                        msg.fromUserId === user?.id ? "justify-end" : "justify-start"
                      )}>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {msg.fromUserId === user?.id && selectedChat.type === 'private' && (
                          msg.isRead ? <CheckCheck size={10} className="text-secondary-light" /> : <CheckCheck size={10} />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>


            {/* Input Area */}
            <div className="p-4 sm:p-6 border-t border-border">
              {isChatBlocked ? (
                <div className="bg-surface-alt/50 border border-border rounded-xl p-3 text-center">
                  <p className="text-xs text-text-muted">You can only message friends who also follow you back.</p>
                </div>
              ) : (
                <form onSubmit={handleSend} className="flex items-center gap-2 sm:gap-4">
                  <button type="button" className="p-2 text-text-muted hover:text-text-main">
                    <Paperclip size={20} />
                  </button>
                  <div className="flex-grow relative">
                    <input 
                      type="text" 
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        setTypingStatus(e.target.value.length > 0);
                      }}
                      onBlur={() => setTypingStatus(false)}
                      placeholder="Type a message..." 
                      className="w-full bg-surface-alt/50 border border-border rounded-xl py-2.5 sm:py-3 px-4 text-xs sm:text-sm outline-none focus:border-primary/50 transition-all text-text-main"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={!input.trim()}
                    className="w-10 h-10 sm:w-12 sm:h-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Send size={18} />
                  </button>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
            <MessageSquare size={48} className="mb-4 text-text-muted opacity-10" />
            <h2 className="text-lg font-bold text-text-main mb-2">Your Conversations</h2>
            <p className="text-xs text-text-muted">Select a chat to start real-time messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
}


