import React, { useState } from 'react';
import { 
  Search, 
  UserPlus, 
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
  ArrowLeft
} from 'lucide-react';
import { cn } from '../lib/utils';

const contacts = [
  { id: 1, name: 'Dr. Adebayo (Math)', status: 'Online', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Adebayo', lastMsg: 'The assignment is due tomorrow.', time: '10:30 AM', unread: 2 },
  { id: 2, name: 'Mrs. Smith (English)', status: 'Online', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Smith', lastMsg: 'Great job on your essay!', time: 'Yesterday', unread: 0 },
  { id: 3, name: 'Budi (Study Group)', status: '8 minutes ago', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Budi', lastMsg: 'Anyone up for a quick review?', time: '2:15 PM', unread: 5 },
  { id: 4, name: 'Aether AI Tutor', status: 'Online', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aether', lastMsg: 'How can I help you today?', time: 'Just now', unread: 0 },
];

const suggestedFriends = [
  { id: 101, name: 'Sarah Jenkins', school: 'Lagos State University', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
  { id: 102, name: 'David Okafor', school: 'University of Ibadan', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David' },
  { id: 103, name: 'Chinelo Obi', school: 'Covenant University', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chinelo' },
  { id: 104, name: 'Tunde Bakare', school: 'Obafemi Awolowo University', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tunde' },
];

export default function Messages() {
  const [activeTab, setActiveTab] = useState<'chats' | 'friends'>('chats');
  const [selectedContact, setSelectedContact] = useState(contacts[0]);
  const [showChatMobile, setShowChatMobile] = useState(false);

  const handleContactSelect = (contact: typeof contacts[0]) => {
    setSelectedContact(contact);
    setShowChatMobile(true);
  };

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
            <button className="p-1.5 sm:p-2 hover:bg-surface rounded-xl transition-colors border border-border text-text-muted">
              <MoreHorizontal size={18} className="sm:hidden" />
              <MoreHorizontal size={20} className="hidden sm:block" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex bg-surface-alt/50 p-1 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 border border-border">
            <button 
              onClick={() => setActiveTab('chats')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all",
                activeTab === 'chats' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-text-muted hover:text-text-main"
              )}
            >
              <MessageSquare size={14} className="sm:hidden" />
              <MessageSquare size={16} className="hidden sm:block" />
              Chats
            </button>
            <button 
              onClick={() => setActiveTab('friends')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all",
                activeTab === 'friends' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-text-muted hover:text-text-main"
              )}
            >
              <Users size={14} className="sm:hidden" />
              <Users size={16} className="hidden sm:block" />
              Find Friends
            </button>
          </div>

          <div className="relative mb-4 sm:mb-6">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted sm:hidden" />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted hidden sm:block" />
            <input 
              type="text" 
              placeholder={activeTab === 'chats' ? "Search..." : "Find friends..."} 
              className="w-full bg-surface-alt/50 border border-border rounded-xl sm:rounded-2xl py-2 sm:py-2.5 pl-9 sm:pl-10 pr-4 text-xs sm:text-sm outline-none focus:border-primary/30 transition-all text-text-main placeholder:text-text-muted"
            />
          </div>

          <div className="flex-grow overflow-y-auto no-scrollbar space-y-3 sm:space-y-4">
            {activeTab === 'chats' ? (
              contacts.map((contact) => (
                <div 
                  key={contact.id} 
                  onClick={() => handleContactSelect(contact)}
                  className={cn(
                    "flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-xl sm:rounded-2xl cursor-pointer transition-all group",
                    selectedContact.id === contact.id ? "bg-primary/10 border border-primary/20" : "hover:bg-surface-alt/50 border border-transparent"
                  )}
                >
                  <div className="relative shrink-0">
                    <img src={contact.avatar} alt={contact.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-border" />
                    {contact.status === 'Online' && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-xs sm:text-sm font-bold text-text-main truncate">{contact.name}</p>
                      <span className="text-[8px] sm:text-[10px] text-text-muted">{contact.time}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] sm:text-xs text-text-muted truncate">{contact.lastMsg}</p>
                      {contact.unread > 0 && (
                        <span className="bg-primary text-white text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] sm:min-w-[18px] text-center">
                          {contact.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="space-y-4 sm:space-y-6">
                <p className="text-[8px] sm:text-[10px] font-bold text-text-muted uppercase tracking-widest px-2">Suggested Friends</p>
                {suggestedFriends.map((friend) => (
                  <div key={friend.id} className="flex items-center justify-between group px-2">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <img src={friend.avatar} alt={friend.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-border" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-text-main truncate">{friend.name}</p>
                        <p className="text-[8px] sm:text-[10px] text-text-muted truncate">{friend.school}</p>
                      </div>
                    </div>
                    <button className="p-1.5 sm:p-2 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg sm:rounded-xl transition-all border border-primary/20">
                      <UserPlus size={14} className="sm:hidden" />
                      <UserPlus size={16} className="hidden sm:block" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={cn(
        "flex-grow glass-card flex flex-col overflow-hidden",
        !showChatMobile ? "hidden sm:flex" : "flex"
      )}>
        {activeTab === 'chats' ? (
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
                  <img src={selectedContact.avatar} alt={selectedContact.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-border" />
                  {selectedContact.status === 'Online' && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-background" />
                  )}
                </div>
                <div>
                  <h2 className="text-sm sm:text-lg font-bold text-text-main truncate max-w-[120px] sm:max-w-none">{selectedContact.name}</h2>
                  <p className="text-[10px] sm:text-xs text-green-500 font-medium flex items-center gap-1 sm:gap-1.5">
                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-500 rounded-full" />
                    {selectedContact.status}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-3">
                <button className="p-2 sm:p-2.5 bg-surface-alt/50 hover:bg-surface-alt rounded-lg sm:rounded-xl text-text-muted transition-colors border border-border">
                  <Phone size={16} className="sm:hidden" />
                  <Phone size={20} className="hidden sm:block" />
                </button>
                <button className="p-2 sm:p-2.5 bg-surface-alt/50 hover:bg-surface-alt rounded-lg sm:rounded-xl text-text-muted transition-colors border border-border">
                  <Video size={16} className="sm:hidden" />
                  <Video size={20} className="hidden sm:block" />
                </button>
                <button className="p-2 sm:p-2.5 bg-surface-alt/50 hover:bg-surface-alt rounded-lg sm:rounded-xl text-text-muted transition-colors border border-border">
                  <MoreHorizontal size={16} className="sm:hidden" />
                  <MoreHorizontal size={20} className="hidden sm:block" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 no-scrollbar">
              <div className="flex justify-center">
                <span className="text-[8px] sm:text-[10px] font-bold text-text-muted bg-surface-alt/50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-border uppercase tracking-widest">Today</span>
              </div>

              {/* Received Message */}
              <div className="flex gap-2 sm:gap-4 max-w-[90%] sm:max-w-[80%]">
                <img src={selectedContact.avatar} alt={selectedContact.name} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-border self-end" />
                <div className="space-y-1">
                  <div className="bg-surface-alt/80 p-3 sm:p-4 rounded-xl sm:rounded-2xl rounded-bl-none border border-border">
                    <p className="text-xs sm:text-sm text-text-main leading-relaxed">{selectedContact.lastMsg}</p>
                  </div>
                  <p className="text-[8px] sm:text-[10px] text-text-muted ml-1">10:30 AM</p>
                </div>
              </div>

              {/* Sent Message */}
              <div className="flex gap-2 sm:gap-4 max-w-[90%] sm:max-w-[80%] ml-auto flex-row-reverse">
                <div className="space-y-1">
                  <div className="bg-primary p-3 sm:p-4 rounded-xl sm:rounded-2xl rounded-br-none shadow-lg shadow-primary/20">
                    <p className="text-xs sm:text-sm text-white leading-relaxed">Thanks! I'll check it out right now. Is there anything specific I should focus on?</p>
                  </div>
                  <div className="flex items-center justify-end gap-1 mr-1">
                    <p className="text-[8px] sm:text-[10px] text-text-muted">10:32 AM</p>
                    <CheckCheck size={10} className="text-primary sm:hidden" />
                    <CheckCheck size={12} className="text-primary hidden sm:block" />
                  </div>
                </div>
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 sm:p-6 border-t border-border bg-surface-alt/5 backdrop-blur-md">
              <div className="flex items-center gap-2 sm:gap-4">
                <button className="p-1.5 sm:p-2.5 text-text-muted hover:text-text-main transition-colors">
                  <Paperclip size={18} className="sm:hidden" />
                  <Paperclip size={20} className="hidden sm:block" />
                </button>
                <div className="flex-grow relative">
                  <input 
                    type="text" 
                    placeholder="Message..." 
                    className="w-full bg-surface-alt/50 border border-border rounded-xl sm:rounded-2xl py-2.5 sm:py-3 pl-4 pr-10 sm:pr-12 text-xs sm:text-sm outline-none focus:border-primary/50 transition-all text-text-main placeholder:text-text-muted"
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors">
                    <Smile size={18} className="sm:hidden" />
                    <Smile size={20} className="hidden sm:block" />
                  </button>
                </div>
                <button className="w-10 h-10 sm:w-12 sm:h-12 bg-primary hover:bg-primary/90 text-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 transition-all transform hover:scale-105 active:scale-95">
                  <Send size={18} className="sm:hidden" />
                  <Send size={20} className="hidden sm:block" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center p-6 sm:p-12 text-center overflow-y-auto no-scrollbar">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-primary/10 rounded-[30px] sm:rounded-[40px] flex items-center justify-center text-primary mb-6 sm:mb-8 animate-bounce shrink-0">
              <UserCheck size={32} className="sm:hidden" />
              <UserCheck size={48} className="hidden sm:block" />
            </div>
            <h2 className="text-xl sm:text-3xl font-bold text-text-main mb-2 sm:mb-4 tracking-tight">Expand Your Network</h2>
            <p className="text-xs sm:text-text-muted max-w-md mb-8 sm:mb-12 leading-relaxed">
              Connect with students and instructors from across the globe. Share notes and join study groups.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full max-w-2xl mb-8 sm:mb-12">
              <div className="glass-card p-4 sm:p-8 group hover:border-primary/50 transition-all flex flex-col">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-primary mb-4 sm:mb-6">
                  <Search size={20} className="sm:hidden" />
                  <Search size={24} className="hidden sm:block" />
                </div>
                <h3 className="text-sm sm:text-lg font-bold text-text-main mb-1 sm:mb-2">Search Username</h3>
                <p className="text-[10px] sm:text-xs text-text-muted mb-4 sm:mb-6">Find friends by their unique username.</p>
                <div className="relative mb-3 sm:mb-4 mt-auto">
                  <input 
                    type="text" 
                    placeholder="@username" 
                    className="w-full bg-surface-alt/50 border border-border rounded-lg sm:rounded-xl py-2 sm:py-2.5 px-3 sm:px-4 text-[10px] sm:text-xs outline-none focus:border-primary/30 transition-all text-text-main placeholder:text-text-muted"
                  />
                </div>
                <button className="w-full py-2.5 sm:py-3 bg-primary text-white text-[10px] sm:text-xs font-bold rounded-lg sm:rounded-xl transition-all shadow-lg shadow-primary/20">
                  Search
                </button>
              </div>
              <div className="glass-card p-4 sm:p-8 group hover:border-secondary/50 transition-all flex flex-col">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-secondary/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-secondary mb-4 sm:mb-6">
                  <UserPlus size={20} className="sm:hidden" />
                  <UserPlus size={24} className="hidden sm:block" />
                </div>
                <h3 className="text-sm sm:text-lg font-bold text-text-main mb-1 sm:mb-2">Invite Friends</h3>
                <p className="text-[10px] sm:text-xs text-text-muted mb-4 sm:mb-6">Share your unique invite link with others.</p>
                <div className="flex gap-2 mb-3 sm:mb-4 mt-auto">
                  <div className="flex-grow bg-surface-alt/50 border border-border rounded-lg sm:rounded-xl py-2 sm:py-2.5 px-3 sm:px-4 text-[8px] sm:text-[10px] text-text-muted truncate flex items-center">
                    aether.edu/invite/user123
                  </div>
                </div>
                <button className="w-full py-2.5 sm:py-3 bg-surface-alt/50 hover:bg-surface-alt text-text-main text-[10px] sm:text-xs font-bold rounded-lg sm:rounded-xl transition-all border border-border">
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
