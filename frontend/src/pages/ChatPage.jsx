// src/pages/ChatPage.jsx — Real-time 1-to-1 chat with Socket.io
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { timeAgo, getInitials } from '../utils/helpers';
import toast from 'react-hot-toast';

/* ── Conversation list item ─────────────────────────── */
const ConvItem = ({ conv, isActive, onClick }) => {
  const partner = conv._id;
  const last    = conv.lastMessage;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
      style={{
        background:   isActive ? 'rgba(34,197,94,0.08)' : 'transparent',
        borderLeft:   isActive ? '2px solid var(--clr-accent)' : '2px solid transparent',
      }}
    >
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
          style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--clr-accent2)' }}>
          {getInitials(partner?.name)}
        </div>
        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2`}
          style={{
            borderColor: 'var(--clr-surface)',
            background:  partner?.isOnline ? 'var(--clr-accent)' : 'var(--clr-muted)',
          }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--clr-text)' }}>{partner?.name}</p>
          {last?.createdAt && (
            <span className="text-xs flex-shrink-0 ml-2" style={{ color: 'var(--clr-muted)' }}>
              {timeAgo(last.createdAt)}
            </span>
          )}
        </div>
        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--clr-muted)' }}>
          {last?.content || 'Start a conversation'}
        </p>
      </div>
      {conv.unreadCount > 0 && (
        <span className="flex-shrink-0 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center"
          style={{ background: 'var(--clr-accent)', color: '#0a0f0d' }}>
          {conv.unreadCount}
        </span>
      )}
    </button>
  );
};

/* ── Single message bubble ──────────────────────────── */
const Bubble = ({ msg, isOwn }) => (
  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
    {!isOwn && (
      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0 self-end mb-1"
        style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--clr-accent2)' }}>
        {getInitials(msg.sender?.name)}
      </div>
    )}
    <div className="max-w-xs lg:max-w-sm">
      <div
        className="px-4 py-2.5 rounded-2xl text-sm"
        style={isOwn
          ? { background: 'var(--clr-accent)', color: '#0a0f0d', borderBottomRightRadius: 4 }
          : { background: 'var(--clr-card)', color: 'var(--clr-text)', border: '1px solid var(--clr-border)', borderBottomLeftRadius: 4 }
        }
      >
        {msg.content}
      </div>
      <p className={`text-xs mt-1 ${isOwn ? 'text-right' : ''}`} style={{ color: 'var(--clr-muted)' }}>
        {timeAgo(msg.createdAt)}
        {isOwn && msg.isRead && <span className="ml-1" style={{ color: 'var(--clr-accent)' }}>✓✓</span>}
      </p>
    </div>
  </div>
);

/* ── Main ChatPage ──────────────────────────────────── */
const ChatPage = () => {
  const { user }              = useAuth();
  const [searchParams]        = useSearchParams();
  const navigate              = useNavigate();
  const initUserId            = searchParams.get('userId');
  const initRequestId         = searchParams.get('requestId');

  const [conversations, setConversations] = useState([]);
  const [activeUserId, setActiveUserId]   = useState(initUserId || null);
  const [activeUser, setActiveUser]       = useState(null);
  const [messages, setMessages]           = useState([]);
  const [input, setInput]                 = useState('');
  const [sending, setSending]             = useState(false);
  const [typing, setTyping]               = useState(false);
  const [loadingConvs, setLoadingConvs]   = useState(true);
  const [loadingMsgs, setLoadingMsgs]     = useState(false);
  const messagesEndRef                    = useRef(null);
  const typingTimerRef                    = useRef(null);

  /* Load conversation list */
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/messages');
        setConversations(data.conversations || []);
      } catch { /* silent */ }
      finally { setLoadingConvs(false); }
    };
    load();
  }, []);

  /* Load messages for active chat */
  useEffect(() => {
    if (!activeUserId) return;
    const load = async () => {
      setLoadingMsgs(true);
      try {
        const [msgRes, userRes] = await Promise.all([
          api.get(`/messages/${activeUserId}`),
          api.get(`/users/${activeUserId}`),
        ]);
        setMessages(msgRes.data.messages || []);
        setActiveUser(userRes.data.user);
      } catch {
        toast.error('Could not load messages');
      } finally {
        setLoadingMsgs(false);
      }
    };
    load();
  }, [activeUserId]);

  /* Scroll to bottom on new message */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* HTTP Polling for real-time messages (Serverless workaround) */
  useEffect(() => {
    if (!activeUserId) return;

    const poll = async () => {
      try {
        const { data } = await api.get(`/messages/${activeUserId}`);
        // Only update if new messages arrived to avoid flicker/jumping
        setMessages((prev) => {
          if (!data.messages) return prev;
          if (data.messages.length > prev.length) return data.messages;
          return prev;
        });
      } catch { /* silent fail on polling */ }
    };

    // Poll every 3 seconds
    const intervalId = setInterval(poll, 3000);
    return () => clearInterval(intervalId);
  }, [activeUserId]);

  /* Socket events removed for Serverless Migration */

  /* Send message */
  const handleSend = useCallback(async () => {
    if (!input.trim() || !activeUserId || sending) return;
    const content = input.trim();
    setInput('');
    setSending(true);

    // Optimistic UI
    const optimistic = {
      _id:       Date.now().toString(),
      sender:    { _id: user._id, name: user.name },
      receiver:  { _id: activeUserId },
      content,
      createdAt: new Date().toISOString(),
      isRead:    false,
      optimistic: true,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const { data } = await api.post('/messages', {
        receiverId:     activeUserId,
        content,
        relatedRequest: initRequestId || undefined,
      });

      // Replace optimistic with real
      setMessages((prev) => prev.map((m) => m.optimistic ? data.message : m));

      // Real-time delivery happens via HTTP polling now
    } catch {
      toast.error('Failed to send');
      setMessages((prev) => prev.filter((m) => !m.optimistic));
    } finally {
      setSending(false);
    }
  }, [input, activeUserId, sending, user, initRequestId]);

  /* Typing emit */
  const handleInputChange = (e) => {
    setInput(e.target.value);
    // Typing indicator removed for Serverless Migration
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex h-full animate-fade-in" style={{ height: 'calc(100vh - 0px)' }}>

      {/* ── Conversation List ─────────────────── */}
      <div className="flex flex-col w-72 flex-shrink-0 border-r" style={{ borderColor: 'var(--clr-border)', background: 'var(--clr-surface)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--clr-border)' }}>
          <h2 className="font-display font-bold text-lg" style={{ color: 'var(--clr-text)' }}>Messages</h2>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {loadingConvs ? (
            <div className="flex justify-center py-8"><div className="spinner w-6 h-6" /></div>
          ) : conversations.length === 0 && !initUserId ? (
            <div className="empty-state px-4 py-12 text-sm">
              <span className="text-3xl mb-2">💬</span>
              <p>No conversations yet</p>
              <p className="text-xs mt-1">Respond to a request to start chatting</p>
            </div>
          ) : (
            <>
              {/* If coming from a request link and no existing conv, show placeholder */}
              {initUserId && !conversations.find((c) => (c._id?._id || c._id) === initUserId) && (
                <button
                  onClick={() => setActiveUserId(initUserId)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                  style={{ background: activeUserId === initUserId ? 'rgba(34,197,94,0.08)' : 'transparent', borderLeft: activeUserId === initUserId ? '2px solid var(--clr-accent)' : '2px solid transparent' }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                    style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--clr-accent2)' }}>
                    ?
                  </div>
                  <p className="text-sm" style={{ color: 'var(--clr-subtext)' }}>New conversation</p>
                </button>
              )}
              {conversations.map((conv) => (
                <ConvItem
                  key={conv._id?._id || conv._id}
                  conv={conv}
                  isActive={activeUserId === (conv._id?._id || conv._id)}
                  onClick={() => setActiveUserId(conv._id?._id || conv._id)}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* ── Chat Window ───────────────────────── */}
      {activeUserId ? (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'var(--clr-border)' }}>
            <div className="relative">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--clr-accent2)' }}>
                {getInitials(activeUser?.name)}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                style={{ borderColor: 'var(--clr-bg)', background: activeUser?.isOnline ? 'var(--clr-accent)' : 'var(--clr-muted)' }} />
            </div>
            <div>
              <p className="font-semibold" style={{ color: 'var(--clr-text)' }}>{activeUser?.name || 'Loading...'}</p>
              <p className="text-xs" style={{ color: 'var(--clr-muted)' }}>
                {typing ? <span style={{ color: 'var(--clr-accent2)' }}>typing...</span>
                  : activeUser?.isOnline ? 'Online' : `Last seen ${timeAgo(activeUser?.lastSeen)}`}
              </p>
            </div>
            {activeUser && (
              <button
                className="btn-ghost text-xs ml-auto"
                onClick={() => navigate(`/users/${activeUserId}`)}
              >
                View Profile
              </button>
            )}
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {loadingMsgs ? (
              <div className="flex justify-center py-12"><div className="spinner w-8 h-8" /></div>
            ) : messages.length === 0 ? (
              <div className="empty-state h-full">
                <span className="text-4xl mb-3">👋</span>
                <p>Say hello!</p>
                <p className="text-xs mt-1">Start the conversation</p>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <Bubble
                    key={msg._id}
                    msg={msg}
                    isOwn={(msg.sender?._id || msg.sender) === user._id}
                  />
                ))}
                {typing && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="px-4 py-2.5 rounded-2xl text-sm flex gap-1" style={{ background: 'var(--clr-card)', border: '1px solid var(--clr-border)' }}>
                      {[0, 150, 300].map((d) => (
                        <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce"
                          style={{ background: 'var(--clr-muted)', animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="px-5 py-4 border-t" style={{ borderColor: 'var(--clr-border)' }}>
            <div className="flex items-end gap-3">
              <textarea
                className="input flex-1 resize-none"
                rows={1}
                placeholder="Type a message… (Enter to send)"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                style={{ minHeight: 44, maxHeight: 120 }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="btn-primary flex-shrink-0 h-11 w-11 rounded-xl p-0"
                style={{ opacity: !input.trim() ? 0.4 : 1 }}
              >
                {sending ? <span className="spinner w-4 h-4" /> : '↑'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty chat state */
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center" style={{ color: 'var(--clr-muted)' }}>
            <span className="text-6xl mb-4 block">💬</span>
            <p className="text-lg font-medium" style={{ color: 'var(--clr-subtext)' }}>Select a conversation</p>
            <p className="text-sm mt-1">or respond to a request to start chatting</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
