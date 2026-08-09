import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Users, Send, Bell, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { RoomParticipant, RoomMessage } from '../../hooks/useLiveRoom';
import { PomodoroTimer } from './PomodoroTimer';

interface LiveRoomViewProps {
  roomName: string;
  participants: RoomParticipant[];
  messages: RoomMessage[];
  timer: { minutes: number; seconds: number; isRunning: boolean };
  isConnected: boolean;
  typingUsers: { [key: string]: string };
  isNudged: boolean;
  currentUserId?: string;
  onLeave: () => void;
  onSendNudge: (userId: string) => void;
  onSendMessage: (text: string) => void;
  onToggleTimer: () => void;
  onTyping: () => void;
}

/**
 * In-room view.
 *
 * Rebuilt from a single tall column into two columns. Previously:
 *  - the container was a fixed `min-h-[650px] lg:h-[800px]` regardless of
 *    content, so a room with nobody in it was ~600px of blank space;
 *  - the participants grid had no empty state, which is the state a room is in
 *    almost every time you open one;
 *  - chat was absolutely positioned over the bottom of that space behind a
 *    gradient mask, so the message list floated on top of the participant area
 *    and the input looked like a detached bar;
 *  - the timer sat alone in the middle with its control spilling past the card.
 *
 * Now the left column owns the session (timer + who's here) and the right is a
 * real chat panel that scrolls internally with its composer pinned to its foot.
 */
export function LiveRoomView({
  roomName,
  participants,
  messages,
  timer,
  isConnected,
  typingUsers,
  isNudged,
  currentUserId,
  onLeave,
  onSendNudge,
  onSendMessage,
  onToggleTimer,
  onTyping
}: LiveRoomViewProps) {
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      onSendMessage(chatInput);
      setChatInput('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);
    onTyping();
  };

  const typingNames = Object.values(typingUsers);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1, x: isNudged ? [0, -10, 10, -10, 10, 0] : 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col rounded-[var(--radius-card)] overflow-hidden border border-border bg-surface shadow-[var(--shadow-card)]"
    >
      {/* ---- Header ---- */}
      <div className="px-5 py-4 flex items-center justify-between gap-4 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0" title={isConnected ? 'Connected' : 'Reconnecting'}>
            {isConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            )}
            <span className={cn('relative inline-flex rounded-full h-2.5 w-2.5', isConnected ? 'bg-accent' : 'bg-brand-orange')} />
          </span>
          <div className="min-w-0">
            <h2 className="font-heading font-bold text-lg tracking-tight truncate">{roomName}</h2>
            <p className="text-xs text-text-muted mt-0.5">
              {isConnected ? 'Connected' : 'Reconnecting…'} ·{' '}
              {participants.length === 0
                ? 'no one else here yet'
                : `${participants.length} ${participants.length === 1 ? 'person' : 'people'} here`}
            </p>
          </div>
        </div>

        <button
          onClick={onLeave}
          className="shrink-0 px-4 py-2 bg-surface-alt hover:bg-brand-pink/10 text-text-main hover:text-brand-pink transition-all rounded-xl text-sm font-semibold flex items-center gap-2 border border-border cursor-pointer min-h-[44px]"
        >
          <LogOut size={16} /> <span className="hidden sm:inline">Leave</span>
        </button>
      </div>

      {/* ---- Body: session on the left, chat on the right ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] lg:h-[560px]">
        <div className="p-5 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
          <PomodoroTimer
            minutes={timer.minutes}
            seconds={timer.seconds}
            isRunning={timer.isRunning}
            onToggle={onToggleTimer}
          />

          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Users size={16} className="text-primary" /> In this room
            </h3>

            {participants.length === 0 ? (
              /* The grid used to render nothing at all here — which is the
                 normal case, and looked like the page had failed. */
              <div className="rounded-xl border border-dashed border-border bg-surface-alt/50 py-10 px-6 text-center">
                <p className="text-sm font-semibold">You're the first one here</p>
                <p className="text-xs text-text-muted mt-1 max-w-xs mx-auto">
                  Start the timer and get going — anyone who joins will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <AnimatePresence>
                  {participants.map((p) => (
                    <motion.div
                      key={p.instanceId || p.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={cn(
                        'relative group rounded-xl border p-4 flex flex-col items-center text-center',
                        p.isMe ? 'border-primary/30 bg-primary/5' : 'border-border bg-surface-alt/50'
                      )}
                    >
                      <img
                        src={p.avatar}
                        alt=""
                        className="w-14 h-14 rounded-full object-cover border-2 border-surface"
                      />
                      <span className="mt-2 text-xs font-semibold truncate max-w-full">
                        {p.isMe ? 'You' : p.name}
                      </span>
                      <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-text-muted">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Focusing
                      </span>

                      {!p.isMe && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onSendNudge(p.id); }}
                          className="absolute top-2 right-2 p-1.5 rounded-lg text-text-muted hover:bg-primary/10 hover:text-primary transition-all active:scale-95 cursor-pointer"
                          title={`Nudge ${p.name}`}
                          aria-label={`Nudge ${p.name}`}
                        >
                          <Bell size={14} />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* ---- Chat ---- */}
        <div className="flex flex-col border-t lg:border-t-0 lg:border-l border-border bg-surface-alt/30 min-h-[380px] lg:min-h-0">
          <h3 className="px-4 py-3 text-sm font-semibold flex items-center gap-2 border-b border-border">
            <MessageSquare size={16} className="text-primary" /> Chat
          </h3>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-xs text-text-muted text-center py-8">
                No messages yet. Say hello to whoever turns up.
              </p>
            )}

            <AnimatePresence mode="popLayout">
              {messages.map((msg) => {
                const isMe = msg.senderId === currentUserId;
                const isSystem = msg.senderId === 'system';

                if (isSystem) {
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-center"
                    >
                      <span className="text-[11px] text-text-muted bg-surface px-3 py-1 rounded-full border border-border">
                        {msg.content}
                      </span>
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    key={msg.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={cn('flex flex-col max-w-[85%]', isMe ? 'ml-auto items-end' : 'mr-auto items-start')}
                  >
                    <div className="flex items-baseline gap-2 mb-1 px-1">
                      {!isMe && <span className="text-[11px] font-semibold truncate">{msg.senderName}</span>}
                      <span className="text-[11px] text-text-muted">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className={cn(
                      'px-3 py-2 rounded-2xl text-sm leading-relaxed',
                      isMe
                        ? 'bg-primary text-white rounded-br-sm'
                        : 'bg-surface border border-border rounded-bl-sm'
                    )}>
                      {msg.content}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {typingNames.length > 0 && (
              <div className="flex items-center gap-2 text-[11px] text-text-muted pl-1">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-text-muted/60 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-text-muted/60 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-text-muted/60 rounded-full animate-bounce [animation-delay:0.4s]" />
                </span>
                {typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing…
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 border-t border-border flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={handleInputChange}
              placeholder="Message the room…"
              aria-label="Message the room"
              className="flex-1 min-w-0 bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              aria-label="Send message"
              className="bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:hover:bg-primary text-white rounded-xl w-11 h-11 flex items-center justify-center transition-all active:scale-95 shrink-0 cursor-pointer disabled:cursor-not-allowed"
            >
              <Send size={17} />
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
