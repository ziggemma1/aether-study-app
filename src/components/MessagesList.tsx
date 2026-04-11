import React from 'react';
import { Search, Plus, MoreHorizontal, MessageSquare, Phone } from 'lucide-react';
import { cn } from '../lib/utils';

const contacts = [
  { id: 1, name: 'Dr. Adebayo (Math)', status: 'Online', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Adebayo' },
  { id: 2, name: 'Mrs. Smith (English)', status: 'Online', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Smith' },
  { id: 3, name: 'Budi (Study Group)', status: '8 minutes ago', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Budi' },
  { id: 4, name: 'Aether AI Tutor', status: 'Online', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aether' },
  { id: 5, name: 'Sarah Jenkins', status: '2 hours ago', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
  { id: 6, name: 'Physics Lab Group', status: 'Online', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lab' },
  { id: 7, name: 'David Chen', status: 'Online', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David' },
  { id: 8, name: 'Emma Wilson', status: 'Yesterday', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma' },
];

interface MessagesListProps {
  className?: string;
}

export default function MessagesList({ className }: MessagesListProps) {
  return (
    <div className={cn("glass-card p-6 flex flex-col", className)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-surface-alt rounded-2xl flex items-center justify-center text-text-muted">
            <MessageSquare size={20} />
          </div>
          <h2 className="text-lg font-bold text-text-main">Messages</h2>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-surface-alt rounded-full transition-colors border border-border text-text-muted">
            <Plus size={18} />
          </button>
          <button className="p-1.5 hover:bg-surface-alt rounded-full transition-colors border border-border text-text-muted">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input 
          type="text" 
          placeholder="Search here..." 
          className="w-full bg-surface-alt/50 border border-border rounded-2xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary/30 transition-all text-text-main placeholder:text-text-muted"
        />
      </div>

      <div className="space-y-6 overflow-y-auto pr-2 no-scrollbar">
        {contacts.map((contact) => (
          <div key={contact.id} className="flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img 
                  src={contact.avatar} 
                  alt={contact.name} 
                  className="w-12 h-12 rounded-full border-2 border-border shadow-sm"
                />
                {contact.status === 'Online' && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-text-main mb-0.5">{contact.name}</p>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                  {contact.status === 'Online' && <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />}
                  {contact.status}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
              <button className="p-2 bg-surface-alt hover:bg-surface-alt/80 rounded-xl text-text-muted transition-colors border border-border">
                <MessageSquare size={16} />
              </button>
              <button className="p-2 bg-surface-alt hover:bg-surface-alt/80 rounded-xl text-text-muted transition-colors border border-border">
                <Phone size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
