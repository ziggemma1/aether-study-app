import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus,
  ArrowLeft,
  MessageCircle,
  Clock,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import api from '../services/api';
import { motion, AnimatePresence } from 'motion/react';

// New Modular Components
import { ConversationList, Conversation } from '../components/messages/ConversationList';
import { ChatWindow } from '../components/messages/ChatWindow';
import { FriendRequestItem } from '../components/messages/FriendRequestItem';

// New Custom Hooks
import { useMessaging } from '../hooks/useMessaging';
import { useFriendRequests } from '../hooks/useFriendRequests';

export default function Messages() {
  const { user, showToast } = useAppContext();
  const [activeTab, setActiveTab] = useState<'chats' | 'friends' | 'groups' | 'requests'>('chats');
  const [selectedChat, setSelectedChat] = useState<{ id: string, type: 'private' | 'group', name: string, avatar: string } | null>(null);
  const [showChatMobile, setShowChatMobile] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConvs, setIsLoadingConvs] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');

  // Fetch conversations from API
  const fetchConversations = async () => {
    setIsLoadingConvs(true);
    try {
      const res = await api.get('/messages/conversations');
      setConversations(res.data);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setIsLoadingConvs(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Friend Requests Hook
  const { requests: friendRequests, respondToRequest } = useFriendRequests();

  // Messaging Hook
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

  // Update local conversations unread counts from socket
  useEffect(() => {
    if (Object.keys(unreadCounts).length > 0) {
      setConversations(prev => prev.map(c => ({
        ...c,
        unread: unreadCounts[c.id] !== undefined ? unreadCounts[c.id] : c.unread
      })));
    }
  }, [unreadCounts]);

  const handleSendMessage = (text: string) => {
    if (!selectedChat) return;
    if (selectedChat.type === 'group') {
      sendGroupMessage(text);
    } else {
      sendDM(text);
    }
    
    // Update last message in list locally
    setConversations(prev => prev.map(c => 
      c.id === selectedChat.id ? { ...c, lastMsg: text, time: new Date().toISOString() } : c
    ));
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    try {
      const res = await api.post('/groups', { name: groupName });
      if (res.data) {
        showToast('Group study link established.', 'success');
        setShowCreateGroup(false);
        setGroupName('');
        const newGroup: Conversation = {
          id: res.data._id,
          name: res.data.name,
          avatar: res.data.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${res.data.name}`,
          type: 'group',
          lastMsg: 'Group created',
          unread: 0
        };
        setConversations(prev => [newGroup, ...prev]);
        setSelectedChat(newGroup);
        setShowChatMobile(true);
      }
    } catch (err) {
      showToast('Neural link failed. Group creation interrupted.', 'error');
    }
  };

  const handleRespondToRequest = async (id: string, status: 'accepted' | 'declined') => {
    const res = await respondToRequest(id, status);
    if (res.success) {
      showToast(status === 'accepted' ? 'Alliance formed.' : 'Request neutralized.', 'success');
      if (status === 'accepted') fetchConversations();
    } else {
      showToast(res.message, 'error');
    }
  };

  const filteredConversations = useMemo(() => {
    if (activeTab === 'chats') return conversations;
    if (activeTab === 'groups') return conversations.filter(c => c.type === 'group');
    if (activeTab === 'friends') return conversations.filter(c => c.type === 'private');
    return [];
  }, [conversations, activeTab]);

  return (
    <div className="h-[calc(100vh-140px)] sm:h-[calc(100vh-100px)] flex gap-6 animate-in fade-in duration-700 relative overflow-hidden">
      
      {/* Sidebar - Conversation List */}
      <div className={cn(
        "w-full sm:w-96 flex flex-col gap-6",
        showChatMobile ? "hidden sm:flex" : "flex"
      )}>
        {/* Header Summary Card */}
        <div className="bg-[#141A24] border border-white/5 rounded-3xl p-5 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#6C5CE7]/10 blur-3xl rounded-full -mr-10 -mt-10" />
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
               <div className="p-2 bg-[#6C5CE7]/20 rounded-xl">
                 <MessageCircle size={20} className="text-[#6C5CE7]" />
               </div>
               <h1 className="text-xl font-black text-[#F0F3F8] uppercase tracking-tighter italic">Comms</h1>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setActiveTab('requests')}
                className="relative p-2 bg-white/5 hover:bg-[#6C5CE7]/20 text-[#8E9AAF] hover:text-[#6C5CE7] rounded-xl transition-all border border-white/5 group"
                title="Friend Requests"
              >
                <UserCheck size={18} />
                {friendRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#6C5CE7] text-white text-[8px] flex items-center justify-center rounded-full border-2 border-[#141A24] animate-bounce font-black">
                    {friendRequests.length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setShowCreateGroup(true)}
                className="p-2 bg-white/5 hover:bg-[#00D2FF]/20 text-[#8E9AAF] hover:text-[#00D2FF] rounded-xl transition-all border border-white/5"
                title="Create Group"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">Network Status: <span className="text-[#00E5A0]">Online</span></p>

          {/* Search bar */}
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" />
            <input 
              type="text" 
              placeholder="Search neuro-links..." 
              className="w-full bg-[#0B0E14] border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-xs outline-none focus:border-[#6C5CE7]/30 transition-all text-[#F0F3F8] placeholder:text-white/10"
            />
          </div>
        </div>

        {/* List Content */}
        <div className="flex-grow flex flex-col min-h-0">
          {/* Tabs */}
          <div className="flex gap-1 bg-[#141A24]/60 backdrop-blur-md p-1.5 rounded-2xl mb-4 border border-white/5">
            {['chats', 'groups', 'friends'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "flex-1 py-2 rounded-xl text-[10px] font-black transition-all capitalize tracking-widest",
                  activeTab === tab ? "bg-[#6C5CE7] text-white shadow-lg shadow-[#6C5CE7]/20" : "text-[#8E9AAF] hover:text-[#F0F3F8] hover:bg-white/5"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-grow overflow-hidden flex flex-col">
            <AnimatePresence mode="wait">
              {activeTab === 'requests' ? (
                <motion.div 
                  key="requests"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                   <div className="flex items-center justify-between px-2 mb-2">
                     <h3 className="text-[10px] font-black text-[#8E9AAF] uppercase tracking-widest">Incoming Requests</h3>
                     <button onClick={() => setActiveTab('chats')} className="text-[10px] font-black text-[#6C5CE7] uppercase">Back</button>
                   </div>
                   {friendRequests.length === 0 ? (
                     <div className="bg-[#141A24] border border-white/5 rounded-2xl p-8 text-center">
                        <ShieldCheck size={32} className="mx-auto mb-3 text-white/5" />
                        <p className="text-xs font-bold text-[#8E9AAF]">No pending requests</p>
                     </div>
                   ) : (
                     friendRequests.map(req => (
                       <FriendRequestItem 
                        key={req._id} 
                        request={req} 
                        onRespond={handleRespondToRequest} 
                       />
                     ))
                   )}
                </motion.div>
              ) : (
                <motion.div 
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full"
                >
                  <ConversationList 
                    conversations={filteredConversations}
                    selectedId={selectedChat?.id}
                    isLoading={isLoadingConvs}
                    onSelect={(conv) => {
                      setSelectedChat(conv);
                      setShowChatMobile(true);
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="mt-auto hidden sm:flex items-center justify-between px-4 opacity-30 group cursor-default">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-[#00E5A0]" />
             <span className="text-[8px] font-black uppercase tracking-widest">Secure Link Active</span>
           </div>
           <Clock size={12} />
        </div>
      </div>

      {/* Main Chat Window */}
      <div className={cn(
        "flex-grow bg-[#141A24] border border-white/5 rounded-[40px] shadow-2xl relative overflow-hidden",
        !showChatMobile ? "hidden sm:flex" : "flex"
      )}>
        <ChatWindow 
          chat={selectedChat}
          messages={chatMessages}
          isTyping={isTyping}
          isConnected={isConnected}
          currentUserId={user?.id || ''}
          onSendMessage={handleSendMessage}
          onTyping={setTypingStatus}
          onBack={() => setShowChatMobile(false)}
          isBlocked={selectedChat?.type === 'private' && !conversations.find(c => c.id === selectedChat.id)?.isFriend}
        />
      </div>

      {/* Group Create Modal (Inline Overlay) */}
      <AnimatePresence>
        {showCreateGroup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0B0E14]/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#141A24] border border-white/5 w-full max-w-sm rounded-[32px] p-8 shadow-2xl"
            >
              <div className="w-16 h-16 bg-[#00D2FF]/20 rounded-3xl flex items-center justify-center mb-6 border border-[#00D2FF]/30 mx-auto">
                <Plus size={28} className="text-[#00D2FF]" />
              </div>
              <h2 className="text-xl font-black text-[#F0F3F8] text-center uppercase tracking-tight italic mb-2">Initialize Hub</h2>
              <p className="text-xs text-[#8E9AAF] text-center mb-8">Establish a collective intelligence link for your study collective.</p>
              
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">Registry Name</label>
                  <input 
                    type="text" 
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="E.g. Quantum Physics 101..."
                    className="w-full bg-[#0B0E14] border border-white/5 rounded-2xl py-4 px-5 text-sm outline-none focus:border-[#00D2FF]/40 transition-all text-[#F0F3F8]"
                    autoFocus
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowCreateGroup(false)}
                    className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#8E9AAF] hover:text-white transition-all"
                  >
                    Abort
                  </button>
                  <button 
                    type="submit" 
                    disabled={!groupName.trim()}
                    className="flex-1 bg-[#6C5CE7] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#6C5CE7]/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    Sync Link
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
