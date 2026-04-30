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
  UserCheck
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

  return (
    <div className="h-[calc(100vh-120px)] flex gap-6 animate-in fade-in duration-500">
      {/* Sidebar - Contacts & Tabs */}
      <div className="w-80 flex flex-col gap-6">
        <div className="glass-card p-6 flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-text-main">Messages</h1>
            <button className="p-2 hover:bg-surface rounded-xl transition-colors border border-border text-text-muted">
              <MoreHorizontal size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex bg-surface-alt/50 p-1 rounded-2xl mb-6 border border-border">
            <button 
              onClick={() => setActiveTab('chats')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all",
                activeTab === 'chats' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-text-muted hover:text-text-main"
              )}
            >
              <MessageSquare size={16} />
              Chats
            </button>
            <button 
              onClick={() => setActiveTab('friends')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all",
                activeTab === 'friends' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-text-muted hover:text-text-main"
              )}
            >
              <Users size={16} />
              Find Friends
            </button>
          </div>

          <div className="relative mb-6">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder={activeTab === 'chats' ? "Search chats..." : "Find new friends..."} 
              className="w-full bg-surface-alt/50 border border-border rounded-2xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary/30 transition-all text-text-main placeholder:text-text-muted"
            />
          </div>

          <div className="flex-grow overflow-y-auto no-scrollbar space-y-4">
            {activeTab === 'chats' ? (
              contacts.map((contact) => (
                <div 
                  key={contact.id} 
                  onClick={() => setSelectedContact(contact)}
                  className={cn(
                    "flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all group",
                    selectedContact.id === contact.id ? "bg-primary/10 border border-primary/20" : "hover:bg-surface-alt/50 border border-transparent"
                  )}
                >
                  <div className="relative shrink-0">
                    <img src={contact.avatar} alt={contact.name} className="w-12 h-12 rounded-full border-2 border-border" />
                    {contact.status === 'Online' && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-bold text-text-main truncate">{contact.name}</p>
                      <span className="text-[10px] text-text-muted">{contact.time}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-text-muted truncate">{contact.lastMsg}</p>
                      {contact.unread > 0 && (
                        <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {contact.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="space-y-6">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-2">Suggested Friends</p>
                {suggestedFriends.map((friend) => (
                  <div key={friend.id} className="flex items-center justify-between group px-2">
                    <div className="flex items-center gap-3">
                      <img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-full border border-border" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-text-main truncate">{friend.name}</p>
                        <p className="text-[10px] text-text-muted truncate">{friend.school}</p>
                      </div>
                    </div>
                    <button className="p-2 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl transition-all border border-primary/20">
                      <UserPlus size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-grow glass-card flex flex-col overflow-hidden">
        {activeTab === 'chats' ? (
          <>
            {/* Chat Header */}
            <div className="p-6 border-b border-border flex items-center justify-between bg-surface-alt/5 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img src={selectedContact.avatar} alt={selectedContact.name} className="w-12 h-12 rounded-full border-2 border-border" />
                  {selectedContact.status === 'Online' && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-main">{selectedContact.name}</h2>
                  <p className="text-xs text-green-500 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    {selectedContact.status}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-2.5 bg-surface-alt/50 hover:bg-surface-alt rounded-xl text-text-muted transition-colors border border-border">
                  <Phone size={20} />
                </button>
                <button className="p-2.5 bg-surface-alt/50 hover:bg-surface-alt rounded-xl text-text-muted transition-colors border border-border">
                  <Video size={20} />
                </button>
                <button className="p-2.5 bg-surface-alt/50 hover:bg-surface-alt rounded-xl text-text-muted transition-colors border border-border">
                  <MoreHorizontal size={20} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6 no-scrollbar">
              <div className="flex justify-center">
                <span className="text-[10px] font-bold text-text-muted bg-surface-alt/50 px-3 py-1 rounded-full border border-border uppercase tracking-widest">Today</span>
              </div>

              {/* Received Message */}
              <div className="flex gap-4 max-w-[80%]">
                <img src={selectedContact.avatar} alt={selectedContact.name} className="w-8 h-8 rounded-full border border-border self-end" />
                <div className="space-y-1">
                  <div className="bg-surface-alt/80 p-4 rounded-2xl rounded-bl-none border border-border">
                    <p className="text-sm text-text-main leading-relaxed">{selectedContact.lastMsg}</p>
                  </div>
                  <p className="text-[10px] text-text-muted ml-1">10:30 AM</p>
                </div>
              </div>

              {/* Sent Message */}
              <div className="flex gap-4 max-w-[80%] ml-auto flex-row-reverse">
                <div className="space-y-1">
                  <div className="bg-primary p-4 rounded-2xl rounded-br-none shadow-lg shadow-primary/20">
                    <p className="text-sm text-white leading-relaxed">Thanks! I'll check it out right now. Is there anything specific I should focus on?</p>
                  </div>
                  <div className="flex items-center justify-end gap-1 mr-1">
                    <p className="text-[10px] text-text-muted">10:32 AM</p>
                    <CheckCheck size={12} className="text-primary" />
                  </div>
                </div>
              </div>

              {/* Received Message */}
              <div className="flex gap-4 max-w-[80%]">
                <img src={selectedContact.avatar} alt={selectedContact.name} className="w-8 h-8 rounded-full border border-border self-end" />
                <div className="space-y-1">
                  <div className="bg-surface-alt/80 p-4 rounded-2xl rounded-bl-none border border-border">
                    <p className="text-sm text-text-main leading-relaxed">Focus on the integration parts, that's where most students struggle. I've uploaded some extra notes for you.</p>
                  </div>
                  <p className="text-[10px] text-text-muted ml-1">10:35 AM</p>
                </div>
              </div>
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-border bg-surface-alt/5 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <button className="p-2.5 text-text-muted hover:text-text-main transition-colors">
                  <Paperclip size={20} />
                </button>
                <div className="flex-grow relative">
                  <input 
                    type="text" 
                    placeholder="Type your message..." 
                    className="w-full bg-surface-alt/50 border border-border rounded-2xl py-3 pl-4 pr-12 text-sm outline-none focus:border-primary/50 transition-all text-text-main placeholder:text-text-muted"
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors">
                    <Smile size={20} />
                  </button>
                </div>
                <button className="w-12 h-12 bg-primary hover:bg-primary/90 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 transition-all transform hover:scale-105 active:scale-95">
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center p-12 text-center overflow-y-auto no-scrollbar">
            <div className="w-24 h-24 bg-primary/10 rounded-[40px] flex items-center justify-center text-primary mb-8 animate-bounce shrink-0">
              <UserCheck size={48} />
            </div>
            <h2 className="text-3xl font-bold text-text-main mb-4 tracking-tight">Expand Your Network</h2>
            <p className="text-text-muted max-w-md mb-12 leading-relaxed">
              Connect with students and instructors from across the globe. Share notes, join study groups, and learn together.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mb-12">
              <div className="glass-card p-8 group hover:border-primary/50 transition-all flex flex-col">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
                  <Search size={24} />
                </div>
                <h3 className="text-lg font-bold text-text-main mb-2">Search Username</h3>
                <p className="text-xs text-text-muted mb-6">Find friends by their unique username.</p>
                <div className="relative mb-4 mt-auto">
                  <input 
                    type="text" 
                    placeholder="@username" 
                    className="w-full bg-surface-alt/50 border border-border rounded-xl py-2.5 px-4 text-xs outline-none focus:border-primary/30 transition-all text-text-main placeholder:text-text-muted"
                  />
                </div>
                <button className="w-full py-3 bg-primary text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-primary/20">
                  Search
                </button>
              </div>
              <div className="glass-card p-8 group hover:border-secondary/50 transition-all flex flex-col">
                <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary mb-6">
                  <UserPlus size={24} />
                </div>
                <h3 className="text-lg font-bold text-text-main mb-2">Invite Friends</h3>
                <p className="text-xs text-text-muted mb-6">Share your unique invite link with others.</p>
                <div className="flex gap-2 mb-4 mt-auto">
                  <div className="flex-grow bg-surface-alt/50 border border-border rounded-xl py-2.5 px-4 text-[10px] text-text-muted truncate flex items-center">
                    aether.edu/invite/user123
                  </div>
                </div>
                <button className="w-full py-3 bg-surface-alt/50 hover:bg-surface-alt text-text-main text-xs font-bold rounded-xl transition-all border border-border">
                  Copy Invite Link
                </button>
              </div>
            </div>

            <div className="w-full max-w-2xl text-left">
              <h3 className="text-lg font-bold text-text-main mb-6">More Ways to Connect</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-surface-alt/30 border border-border hover:border-primary/30 transition-all cursor-pointer">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">
                      <Users size={18} />
                    </div>
                    <p className="font-bold text-sm text-text-main">Study Groups</p>
                  </div>
                  <p className="text-xs text-text-muted">Join groups focused on your specific subjects.</p>
                </div>
                <div className="p-4 rounded-2xl bg-surface-alt/30 border border-border hover:border-secondary/30 transition-all cursor-pointer">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-500">
                      <UserPlus size={18} />
                    </div>
                    <p className="font-bold text-sm text-text-main">Sync Contacts</p>
                  </div>
                  <p className="text-xs text-text-muted">Find friends from your school or university.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
