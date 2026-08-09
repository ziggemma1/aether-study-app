import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search, UserPlus, MessageSquare, Users, Send, CheckCheck, ArrowLeft,
  Loader2, AlertTriangle, RotateCw, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cn, formatChatTime } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import api from '../services/api';
import { useMessaging } from '../hooks/useMessaging';
import { useConversations, Conversation } from '../hooks/useConversations';
import { Avatar } from '../components/ui/Avatar';

type Selection = { id: string; type: 'private' | 'group'; name: string; avatar: string | null; isFriend: boolean };

export default function Messages() {
  const { user, setGroups, allProfiles, friendRequests, showToast } = useAppContext();

  const [selected, setSelected] = useState<Selection | null>(null);
  const [showChatMobile, setShowChatMobile] = useState(false);
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [showNew, setShowNew] = useState(false);

  const { conversations, loading: loadingList, error: listError, refetch, markRead } = useConversations();

  const { messages, loading: loadingThread, error: threadError, isTyping, isConnected, sendMessage, setTypingStatus } =
    useMessaging(
      selected?.type === 'private' ? selected.id : undefined,
      selected?.type === 'group' ? selected.id : undefined
    );

  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  // The search box had no value and no onChange — it was decoration. It filters.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.lastMessage || '').toLowerCase().includes(q)
    );
  }, [conversations, query]);

  /** Mutual followers you have not messaged yet — the "start a chat" list. */
  const startable = useMemo(() => {
    if (!user) return [];
    const existing = new Set(conversations.filter((c) => c.type === 'private').map((c) => c.id));
    return allProfiles
      .filter((p: any) => p.id !== user.id && !existing.has(p.id))
      .filter((p: any) => user.following?.includes(p.id) && p.following?.includes(user.id));
  }, [allProfiles, conversations, user]);

  const open = (c: Conversation | Selection) => {
    setSelected({ id: c.id, type: c.type, name: c.name, avatar: c.avatar, isFriend: c.isFriend });
    setShowChatMobile(true);
    setShowNew(false);
    if (c.type === 'private' && 'unread' in c && c.unread > 0) void markRead(c.id);
  };

  const blocked = selected?.type === 'private' && !selected.isFriend;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selected || blocked) return;
    sendMessage(input.trim());
    setInput('');
    setTypingStatus(false);
  };

  const [groupName, setGroupName] = useState('');
  const [creating, setCreating] = useState(false);
  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    setCreating(true);
    try {
      const { data } = await api.post('/groups', { name: groupName.trim() });
      const id = data.id || data._id;
      setGroups((prev: any) => [...prev, { ...data, id }]);
      setGroupName('');
      setShowNew(false);
      await refetch();
      setSelected({ id, type: 'group', name: data.name, avatar: data.avatar || null, isFriend: true });
      setShowChatMobile(true);
    } catch (err: any) {
      // Group creation used to fail silently into console.error.
      showToast(err?.response?.data?.message || "We couldn't create that group.", 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-4 md:p-6 h-full min-h-0 flex flex-col">
      <div className="flex-1 min-h-0 flex gap-4 lg:gap-6">
        {/* ---------------- Conversation list ---------------- */}
        <aside className={cn(
          'w-full sm:w-80 lg:w-96 shrink-0 min-h-0 flex-col rounded-[var(--radius-card)] bg-surface border border-border shadow-[var(--shadow-card)] overflow-hidden',
          showChatMobile ? 'hidden sm:flex' : 'flex'
        )}>
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h1 className="font-heading text-lg font-bold text-text-main tracking-tight">Messages</h1>
              <div className="flex items-center gap-1.5">
                <Link
                  to="/community"
                  title="Friend requests"
                  aria-label="Friend requests"
                  className="relative p-2 rounded-xl text-text-muted hover:bg-surface-alt hover:text-text-main transition-colors"
                >
                  <UserPlus size={17} />
                  {friendRequests.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-brand-pink text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                      {friendRequests.length}
                    </span>
                  )}
                </Link>
                <button
                  onClick={() => setShowNew((v) => !v)}
                  title="New conversation"
                  aria-label="New conversation"
                  className="p-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  <Plus size={17} />
                </button>
              </div>
            </div>

            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search conversations"
                aria-label="Search conversations"
                className="w-full bg-surface-alt border border-border rounded-xl py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary/40 transition-colors text-text-main placeholder:text-text-muted"
              />
            </div>
          </div>

          <AnimatePresence>
            {showNew && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-border bg-surface-alt/50"
              >
                <div className="p-4 space-y-4">
                  <form onSubmit={createGroup} className="space-y-2">
                    <p className="text-xs font-semibold text-text-main">New study group</p>
                    <div className="flex gap-2">
                      <input
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="Group name"
                        aria-label="Group name"
                        className="flex-1 min-w-0 bg-surface border border-border rounded-xl py-2 px-3 text-sm outline-none focus:border-primary/40 text-text-main placeholder:text-text-muted"
                      />
                      <button
                        type="submit"
                        disabled={!groupName.trim() || creating}
                        className="shrink-0 px-3 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50 cursor-pointer min-h-[40px]"
                      >
                        {creating ? <Loader2 size={15} className="animate-spin" /> : 'Create'}
                      </button>
                    </div>
                  </form>

                  <div>
                    <p className="text-xs font-semibold text-text-main mb-2">Message a friend</p>
                    {startable.length === 0 ? (
                      <p className="text-xs text-text-muted leading-relaxed">
                        You have messaged everyone you are friends with.{' '}
                        <Link to="/community" className="text-primary font-medium hover:underline">Find more friends</Link>.
                      </p>
                    ) : (
                      <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                        {startable.map((p: any) => (
                          <button
                            key={p.id}
                            onClick={() => open({ id: p.id, type: 'private', name: p.name, avatar: p.avatar, isFriend: true })}
                            className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-surface text-left cursor-pointer"
                          >
                            <Avatar name={p.name || 'User'} src={p.avatar} size={30} />
                            <span className="text-sm text-text-main truncate">{p.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2">
            {listError ? (
              <ListState
                icon={<AlertTriangle size={20} />}
                tone="bg-brand-pink/10 text-brand-pink"
                title="We couldn't load your conversations"
                body={listError}
                action={
                  <button onClick={refetch} className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold cursor-pointer">
                    <RotateCw size={13} /> Try again
                  </button>
                }
              />
            ) : loadingList ? (
              <div className="space-y-2 p-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 rounded-xl bg-[var(--skeleton)] animate-pulse" />
                ))}
              </div>
            ) : visible.length === 0 ? (
              <ListState
                icon={<MessageSquare size={20} />}
                tone="bg-pastel-lavender text-pastel-lavender-ink"
                title={query ? 'No matches' : 'No conversations yet'}
                body={
                  query
                    ? 'Nothing here matches that search.'
                    : 'Start one with a friend, or make a study group.'
                }
              />
            ) : (
              visible.map((c) => (
                <button
                  key={`${c.type}-${c.id}`}
                  onClick={() => open(c)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors cursor-pointer',
                    selected?.id === c.id ? 'bg-primary/10' : 'hover:bg-surface-alt'
                  )}
                >
                  <span className="relative shrink-0">
                    <Avatar name={c.name} src={c.avatar} size={44} />
                    {c.type === 'group' && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-pastel-mint text-pastel-mint-ink flex items-center justify-center border border-surface">
                        <Users size={9} />
                      </span>
                    )}
                  </span>

                  <span className="flex-1 min-w-0">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={cn('text-sm truncate', c.unread > 0 ? 'font-bold text-text-main' : 'font-semibold text-text-main')}>
                        {c.name}
                      </span>
                      {/* A real timestamp. `time` was hardcoded to '' on every row. */}
                      {c.lastAt && (
                        <span className="shrink-0 text-[11px] text-text-muted">{formatChatTime(c.lastAt)}</span>
                      )}
                    </span>
                    <span className="flex items-center gap-1.5 mt-0.5">
                      <span className={cn('flex-1 text-xs truncate', c.unread > 0 ? 'text-text-main font-medium' : 'text-text-muted')}>
                        {/* The real last message, not "Tap to message". */}
                        {c.lastMessage
                          ? `${c.sentByMe ? 'You: ' : ''}${c.lastMessage}`
                          : c.type === 'group' ? 'No messages yet' : 'Say hello'}
                      </span>
                      {c.unread > 0 && (
                        <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center">
                          {c.unread > 99 ? '99+' : c.unread}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* ---------------- Thread ---------------- */}
        <section className={cn(
          'flex-1 min-w-0 min-h-0 flex-col rounded-[var(--radius-card)] bg-surface border border-border shadow-[var(--shadow-card)] overflow-hidden',
          showChatMobile ? 'flex' : 'hidden sm:flex'
        )}>
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <span className="w-12 h-12 rounded-2xl bg-pastel-lavender text-pastel-lavender-ink flex items-center justify-center">
                <MessageSquare size={22} />
              </span>
              <h2 className="font-heading text-base font-bold text-text-main mt-3">Pick a conversation</h2>
              <p className="text-sm text-text-muted mt-1 max-w-xs">
                Messages are delivered live to anyone you follow who follows you back.
              </p>
            </div>
          ) : (
            <>
              <header className="px-4 py-3 border-b border-border flex items-center gap-3">
                <button
                  onClick={() => setShowChatMobile(false)}
                  aria-label="Back to conversations"
                  className="sm:hidden p-1.5 -ml-1 rounded-lg text-text-muted hover:bg-surface-alt cursor-pointer"
                >
                  <ArrowLeft size={18} />
                </button>
                <Avatar name={selected.name} src={selected.avatar} size={38} />
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-text-main text-sm truncate">{selected.name}</h2>
                  <p className="text-[11px] text-text-muted flex items-center gap-1.5">
                    {isTyping ? (
                      <span className="text-primary">typing…</span>
                    ) : selected.type === 'group' ? (
                      'Study group'
                    ) : blocked ? (
                      'Mutual friends only'
                    ) : (
                      <>
                        <span className={cn('w-1.5 h-1.5 rounded-full', isConnected ? 'bg-accent' : 'bg-brand-orange')} />
                        {isConnected ? 'Connected' : 'Reconnecting…'}
                      </>
                    )}
                  </p>
                </div>
                {/* The call and video buttons that used to sit here had no
                    onClick and no implementation behind them — the app has no
                    calling of any kind. */}
              </header>

              {/* `min-h-full` + `justify-end` on an inner wrapper anchors a
                  short thread to the bottom of the pane, the way a chat reads,
                  without the clipping that `justify-end` on the scroller itself
                  causes once the content overflows. */}
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4">
                <div className="min-h-full flex flex-col justify-end gap-3">
                {threadError ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                    <span className="w-11 h-11 rounded-xl bg-brand-pink/10 text-brand-pink flex items-center justify-center">
                      <AlertTriangle size={19} />
                    </span>
                    <p className="text-sm font-semibold text-text-main mt-3">We couldn't load this conversation</p>
                    <p className="text-xs text-text-muted mt-1">{threadError}</p>
                  </div>
                ) : loadingThread ? (
                  <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className={cn('h-10 rounded-2xl bg-[var(--skeleton)] animate-pulse', i % 2 ? 'ml-auto w-40' : 'w-52')} />
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12">
                    <p className="text-sm font-semibold text-text-main">No messages yet</p>
                    <p className="text-xs text-text-muted mt-1">Say hello to get things started.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const mine = msg.fromUserId === user?.id;
                    return (
                      <div key={msg.id} className={cn('flex flex-col max-w-[85%] sm:max-w-[70%]', mine && 'ml-auto items-end')}>
                        <div className={cn(
                          'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words',
                          mine ? 'bg-primary text-white rounded-br-sm' : 'bg-surface-alt border border-border text-text-main rounded-bl-sm'
                        )}>
                          {msg.text}
                        </div>
                        <span className="flex items-center gap-1 mt-1 px-1 text-[11px] text-text-muted">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {mine && selected.type === 'private' && (
                            /* Was `text-secondary-light`, a token that does not
                               exist, so a read receipt rendered the same as an
                               unread one. */
                            <CheckCheck size={12} className={msg.isRead ? 'text-accent' : 'text-text-muted/60'} />
                          )}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={endRef} />
                </div>
              </div>

              <div className="p-3 border-t border-border">
                {blocked ? (
                  <p className="text-xs text-text-muted text-center py-2">
                    You can only message people who follow you back.
                  </p>
                ) : (
                  <form onSubmit={handleSend} className="flex items-center gap-2">
                    <input
                      value={input}
                      onChange={(e) => { setInput(e.target.value); setTypingStatus(e.target.value.length > 0); }}
                      onBlur={() => setTypingStatus(false)}
                      placeholder="Type a message…"
                      aria-label="Message"
                      className="flex-1 min-w-0 bg-surface-alt border border-border rounded-xl py-2.5 px-3.5 text-sm outline-none focus:border-primary/40 transition-colors text-text-main placeholder:text-text-muted"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim()}
                      aria-label="Send message"
                      className="w-11 h-11 shrink-0 bg-primary hover:bg-primary/90 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Send size={17} />
                    </button>
                  </form>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function ListState({ icon, tone, title, body, action }: {
  icon: React.ReactNode; tone: string; title: string; body: string; action?: React.ReactNode;
}) {
  return (
    <div className="px-6 py-12 text-center">
      <span className={cn('inline-flex w-11 h-11 rounded-xl items-center justify-center', tone)}>{icon}</span>
      <p className="text-sm font-semibold text-text-main mt-3">{title}</p>
      <p className="text-xs text-text-muted mt-1 leading-relaxed">{body}</p>
      {action}
    </div>
  );
}
