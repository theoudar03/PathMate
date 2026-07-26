import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Trash2, Copy, Check, ThumbsUp, ThumbsDown, RotateCcw, Flag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SourceTag from './SourceTag';

import VoiceInputButton from '../onboarding/VoiceInputButton';
import { useApp } from '../../contexts/AppContext';
import TranslateText from '../common/TranslateText';

const BotMessageContent = ({ msg, isStreaming, onFeedback, feedbackState, onRegenerate, userQuery, userId, onReportClick }) => {
  const [copied, setCopied] = useState(false);
  const [reported, setReported] = useState(false);
  const [reporting, setReporting] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReport = async () => {
    if (reported || reporting) return;
    setReporting(true);
    try {
      const response = await fetch('/api/chat/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: userQuery || "Unanswered Question",
          userId: userId || null
        })
      });
      if (response.ok) {
        setReported(true);
      }
    } catch (e) {
      console.error("Failed to report question:", e);
    } finally {
      setReporting(false);
    }
  };

  const isFallback = msg.text && msg.text.includes("couldn't find official details about that in the campus directory database");
  const isInit = msg.id === 'msg-init';
  const currentFeedback = feedbackState?.[msg.id];

  return (
    <div className="relative group w-full pb-1">
      {isInit ? (
        <p className="whitespace-pre-line text-sm text-onSurface leading-relaxed">
          <TranslateText text={msg.text} />
        </p>
      ) : (
        <div className="text-sm text-onSurface leading-relaxed">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({node, ...props}) => <h1 className="text-base font-extrabold mt-3 mb-1.5 text-onSurface" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-sm font-extrabold mt-2.5 mb-1.5 text-onSurface" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-xs font-bold mt-2 mb-1 text-onSurface" {...props} />,
              p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2 space-y-1 marker:text-primary" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2 space-y-1 marker:text-primary" {...props} />,
              li: ({node, ...props}) => <li className="pl-0.5 text-onSurfaceVariant" {...props} />,
              strong: ({node, ...props}) => <strong className="font-extrabold text-onSurface" {...props} />,
              a: ({node, ...props}) => <a className="text-primary hover:text-primaryHover font-bold underline transition-colors break-words" target="_blank" rel="noopener noreferrer" {...props} />,
              code: ({node, inline, className, children, ...props}) => {
                return inline ? (
                  <code className="bg-surfaceVariant/60 px-1 py-0.5 rounded text-[11px] font-mono font-bold text-primary" {...props}>
                    {children}
                  </code>
                ) : (
                  <div className="relative my-2">
                    <pre className="bg-surfaceVariant/40 p-3 rounded-xl overflow-x-auto text-[11px] font-mono text-onSurfaceVariant border border-outline/10 leading-normal">
                      <code {...props}>{children}</code>
                    </pre>
                  </div>
                )
              },
              table: ({node, ...props}) => <div className="overflow-x-auto my-2 border border-outline/10 rounded-xl"><table className="min-w-full divide-y divide-outline/10 rounded-xl text-xs" {...props} /></div>,
              th: ({node, ...props}) => <th className="px-3 py-2.5 bg-surfaceVariant/20 text-left text-xs font-bold text-onSurfaceVariant tracking-wider border-b border-outline/10" {...props} />,
              td: ({node, ...props}) => <td className="px-3 py-2.5 whitespace-normal text-xs text-onSurface border-b border-outline/10" {...props} />,
              blockquote: ({node, ...props}) => <blockquote className="border-l-3 border-primary/50 pl-3.5 italic text-onSurfaceVariant/85 my-2" {...props} />,
            }}
          >
            {msg.text}
          </ReactMarkdown>
        </div>
      )}

      {isFallback && !isInit && (
        <div className="mt-3 pt-2.5 border-t border-outline/5 flex items-center justify-between">
          <span className="text-[11px] text-onSurfaceVariant/70 italic">Official answer not found.</span>
          <button
            onClick={handleReport}
            disabled={reported || reporting}
            type="button"
            className={`text-xs font-extrabold px-3 py-1.5 rounded-lg border transition-all active-press flex items-center gap-1 shadow-sm ${
              reported 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-primary/5 text-primary border-primary/20 hover:bg-primary/10'
            }`}
          >
            <span className="material-symbols-outlined text-[14px] leading-none">
              {reported ? 'check_circle' : 'campaign'}
            </span>
            {reporting ? 'Reporting...' : reported ? 'Reported to Admin' : 'Report to Admin'}
          </button>
        </div>
      )}

      {/* Action Row */}
      {!isStreaming && msg.text && (
        <div className="flex items-center gap-1 mt-2.5 border-t border-outline/5 pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={handleCopy}
            type="button"
            className="p-1 rounded hover:bg-surfaceVariant/50 text-onSurfaceVariant/70 hover:text-onSurface transition-all"
            title="Copy response"
            aria-label="Copy response"
          >
            {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
          </button>
          
          <button
            onClick={() => onFeedback(msg.id, 'like')}
            type="button"
            className={`p-1 rounded hover:bg-surfaceVariant/50 transition-all ${currentFeedback === 'like' ? 'text-primary' : 'text-onSurfaceVariant/70 hover:text-onSurface'}`}
            title="Thumbs up"
            aria-label="Thumbs up"
          >
            <ThumbsUp size={13} className={currentFeedback === 'like' ? 'fill-current' : ''} />
          </button>

          <button
            onClick={() => onFeedback(msg.id, 'dislike')}
            type="button"
            className={`p-1 rounded hover:bg-surfaceVariant/50 transition-all ${currentFeedback === 'dislike' ? 'text-red-500' : 'text-onSurfaceVariant/70 hover:text-onSurface'}`}
            title="Thumbs down"
            aria-label="Thumbs down"
          >
            <ThumbsDown size={13} className={currentFeedback === 'dislike' ? 'fill-current' : ''} />
          </button>

          {!isInit && (
            <button
              onClick={() => onRegenerate(msg.id)}
              type="button"
              className="p-1 rounded hover:bg-surfaceVariant/50 text-onSurfaceVariant/70 hover:text-onSurface transition-all active-press"
              title="Regenerate response"
              aria-label="Regenerate response"
            >
              <RotateCcw size={13} />
            </button>
          )}

          {!isInit && (
            <button
              onClick={() => onReportClick(msg, userQuery)}
              type="button"
              className="p-1 rounded hover:bg-surfaceVariant/50 text-onSurfaceVariant/70 hover:text-red-500 transition-all active-press"
              title="Report incorrect answer"
              aria-label="Report incorrect answer"
            >
              <Flag size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const INITIAL_MESSAGES = [
  {
    id: 'msg-init',
    sender: 'bot',
    text: "Hello! I am PathMate, your Saranathan College of Engineering guide. I can answer questions about document verification, hostel allocations, anti-ragging policies, canteen timings, or SCE clubs. How can I help you settle in today?",
    sources: [],
    showEscalation: false
  }
];

const ChatWindow = () => {
  const { user, language, t } = useApp();
  const storageKey = user ? `pm_chat_history_${user.username || user.id}` : 'pm_chat_history';

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
  });
  const [inputValue, setInputValue] = useState('');
  const [interimVoiceText, setInterimVoiceText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [voiceReplyMode, setVoiceReplyMode] = useState(false);
  const [inputError, setInputError] = useState('');
  
  // Custom interactive states for SaaS Chatbot UI
  const [feedback, setFeedback] = useState({});
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Report Modal states
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportMsg, setReportMsg] = useState(null);
  const [reportQuestion, setReportQuestion] = useState('');
  const [reportReason, setReportReason] = useState('Incorrect faculty/staff details');
  const [reportSeverity, setReportSeverity] = useState('Medium');
  const [reportComments, setReportComments] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const handleOpenReportModal = (msg, question) => {
    setReportMsg(msg);
    setReportQuestion(question || 'General Inquiry');
    setReportReason('Incorrect faculty/staff details');
    setReportSeverity('Medium');
    setReportComments('');
    setReportSuccess(false);
    setReportModalOpen(true);
  };

  const handleCloseReportModal = () => {
    setReportModalOpen(false);
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (reportSubmitting) return;

    setReportSubmitting(true);
    try {
      const token = localStorage.getItem('pm_token');
      const response = await fetch('/api/chat/report-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          question: reportQuestion,
          aiAnswer: reportMsg?.text || '',
          reportedReason: reportReason,
          severity: reportSeverity,
          studentComments: reportComments,
          source: (reportMsg?.sources && reportMsg.sources[0]) || 'Gemini',
          conversationId: 'dad07b81-1719-466d-a84e-28f63c9b3579',
          userId: user?.id || null
        })
      });

      if (response.ok) {
        setReportSuccess(true);
        setTimeout(() => {
          setReportModalOpen(false);
        }, 1500);
      } else {
        alert("Failed to submit report. Please try again.");
      }
    } catch (err) {
      console.error("Error submitting AI report:", err);
      alert("Failed to submit report. Please check your connection.");
    } finally {
      setReportSubmitting(false);
    }
  };
  
  const displayValue = interimVoiceText ? `${inputValue} ${interimVoiceText}`.trim() : inputValue;

  const scrollContainerRef = useRef(null);
  // Track whether the last change was triggered by user/bot (should scroll) vs mount (should NOT scroll)
  const shouldScrollRef = useRef(false);
  const isMountRef = useRef(true);

  // Reload messages when user changes — mark as mount so no scroll fires
  useEffect(() => {
    isMountRef.current = true;
    shouldScrollRef.current = false;
    if (user) {
      const saved = localStorage.getItem(`pm_chat_history_${user.username || user.id}`);
      setMessages(saved ? JSON.parse(saved) : INITIAL_MESSAGES);
    } else {
      setMessages(INITIAL_MESSAGES);
    }
  }, [user]);

  // Persist messages and selectively scroll — never on first mount
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(messages));

    if (isMountRef.current) {
      // Very first render: reset scroll position to top, never scroll down
      isMountRef.current = false;
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      return;
    }

    if (shouldScrollRef.current) {
      scrollToBottom(true);
      shouldScrollRef.current = false;
    } else {
      scrollToBottom(false);
    }
  }, [messages, storageKey]);

  /**
   * Scrolls the chat message container itself — NOT the browser window.
   * Uses scrollTop on the container div to avoid the scrollIntoView() bubble-up
   * effect that would scroll the entire page when navigating to the Assistant tab.
   */
  const scrollToBottom = (force = false) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
    if (force || isNearBottom) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  };

  const handleScroll = (e) => {
    const container = e.target;
    if (!container) return;
    const isFar = container.scrollHeight - container.scrollTop - container.clientHeight > 200;
    setShowScrollBottom(isFar);
  };

  const handleFeedback = (msgId, type) => {
    setFeedback(prev => ({
      ...prev,
      [msgId]: prev[msgId] === type ? null : type
    }));
  };

  const handleRegenerate = (botMsgId) => {
    const botIdx = messages.findIndex(m => m.id === botMsgId);
    if (botIdx <= 0) return;

    let lastUserQuery = "";
    for (let i = botIdx - 1; i >= 0; i--) {
      if (messages[i].sender === 'user') {
        lastUserQuery = messages[i].text;
        break;
      }
    }

    if (lastUserQuery) {
      // Remove bot message and trigger rewrite
      setMessages(prev => prev.slice(0, botIdx));
      handleSend(lastUserQuery);
    }
  };

  // Listen for FAQ card click events from Chatbot.jsx
  useEffect(() => {
    const handleInsertQuery = (e) => {
      const queryText = e.detail;
      if (queryText) {
        setInputValue(queryText);
        setTimeout(() => {
          handleSend(queryText);
        }, 150);
      }
    };
    window.addEventListener('pm-insert-query', handleInsertQuery);
    return () => {
      window.removeEventListener('pm-insert-query', handleInsertQuery);
    };
  }, [messages]);

  const speakText = (text) => {
    if (!voiceReplyMode) return;
    if (!('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (language === 'ta') {
      utterance.lang = 'ta-IN';
    } else if (language === 'hi') {
      utterance.lang = 'hi-IN';
    } else {
      utterance.lang = 'en-IN';
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    utterance.onstart = () => {};
    utterance.onend = () => {};
    utterance.onerror = () => {};
    
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (textToSend) => {
    const queryText = textToSend || inputValue;
    if (!queryText.trim()) return;

    window.speechSynthesis.cancel();
    // Clear any interim text just in case
    setInterimVoiceText('');

    const userMsgId = `msg-user-${Date.now()}`;
    const userMsg = {
      id: userMsgId,
      sender: 'user',
      text: queryText
    };

    // Mark that scroll IS wanted for this user-initiated update
    shouldScrollRef.current = true;
    const currentMessages = [...messages, userMsg];
    setMessages(currentMessages);
    setInputValue('');
    setIsTyping(true);

    try {
      const token = localStorage.getItem('pm_auth_token');
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          userId: user?.id,
          query: queryText,
          language: language || 'en',
          history: messages.slice(-10).map(m => ({ role: m.sender, text: m.text }))
        })
      });

      const data = await res.json();
      setIsTyping(false);

      if (data && data.answer) {
        let currentText = "";
        const words = data.answer.split(' ');
        let wordIndex = 0;
        const botMsgId = `msg-bot-${Date.now()}`;

        const newBotMsg = {
          id: botMsgId,
          sender: 'bot',
          text: '',
          sources: data.sourceTable ? [data.sourceTable] : []
        };

        setMessages(prev => [...prev, newBotMsg]);

        const timer = setInterval(() => {
          if (wordIndex < words.length) {
            currentText += (wordIndex === 0 ? '' : ' ') + words[wordIndex];
            setMessages(prev => prev.map(msg =>
              msg.id === botMsgId
                ? { ...msg, text: currentText }
                : msg
            ));
            wordIndex++;
            // Scroll only within the container during streaming
            scrollToBottom(false);
          } else {
            clearInterval(timer);
            // After stream finishes, start TTS
            speakText(data.answer);
          }
        }, 30);
      } else {
        const errMsg = {
          id: `msg-bot-err-${Date.now()}`,
          sender: 'bot',
          text: t('chatbotError') || "I'm having trouble reaching the campus directory service. Please try again or ask an administrative mentor.",
          sources: []
        };
        setMessages(prev => [...prev, errMsg]);
      }
    } catch (err) {
      console.error("Error communicating with chat backend:", err);
      setIsTyping(false);
      const errMsg = {
        id: `msg-bot-err-${Date.now()}`,
        sender: 'bot',
        text: t('chatbotError') || "I'm having trouble reaching the campus directory service. Please try again or ask an administrative mentor.",
        sources: []
      };
      setMessages(prev => [...prev, errMsg]);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm(t('confirmClearHistory') || "Are you sure you want to clear chat history?")) {
      setMessages(INITIAL_MESSAGES);
      window.speechSynthesis.cancel();
    }
  };

  // Rotate input placeholder examples dynamically
  const placeholders = [
    "Ask about clubs...",
    "Where is the library?",
    "When is the next event?",
    "Tell me about hostel allocations...",
    "Search UG academic regulations..."
  ];
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx(prev => (prev + 1) % placeholders.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSuggestionClick = (query) => {
    setInputValue(query);
    setTimeout(() => {
      handleSend(query);
    }, 100);
  };

  const isChatEmpty = messages.length <= 1;

  return (
    <div className="flex flex-col h-[calc(100vh-270px)] min-h-[480px] max-h-[620px] bg-gradient-to-b from-[#F5F7FA] to-[#EFF6FF]/20 rounded-3xl border border-surfaceVariant/60 overflow-hidden font-sans shadow-elevation2 relative">
      
      {/* Chat Header — Stationary Solid Header */}
      <div className="flex justify-between items-center bg-white px-5 py-4 border-b border-outline/10 z-20 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-glow-primary relative">
            <span className="material-symbols-outlined text-[15px] select-none">smart_toy</span>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full"></span>
          </div>
          <div>
            <h2 className="text-sm font-extrabold font-sans leading-none text-onSurface">{t('groundedAssistantTitle')}</h2>
            <span className="text-[10px] text-onSurfaceVariant/80 font-bold mt-1 block">{t('informationDesk')}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClearHistory}
          className="text-onSurfaceVariant/70 hover:text-onSurface p-2 rounded-full hover:bg-surfaceVariant/45 transition-all flex items-center justify-center active:scale-[0.95]"
          title={t('clearHistoryBtn')}
          aria-label={t('clearHistoryBtn')}
        >
          <span className="material-symbols-outlined text-[20px] select-none align-middle">delete</span>
        </button>
      </div>

      {/* Messages Scroll Area — scrolls itself, never the page */}
      <div 
        ref={scrollContainerRef} 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-transparent scroll-smooth pb-24"
      >
        <div className="max-w-3xl mx-auto space-y-6 w-full">
          {messages.map((msg) => {
            const isBot = msg.sender === 'bot';
            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 max-w-[85%] animate-slide-up ${
                  isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm relative ${
                    isBot 
                      ? 'bg-gradient-to-tr from-primary to-indigo-600 text-white glow-primary' 
                      : 'bg-primaryContainer text-onPrimaryContainer font-bold'
                  }`}
                  aria-hidden="true"
                >
                  {isBot ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] select-none align-middle">smart_toy</span>
                      <span className={`absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 border border-white rounded-full ${isTyping ? 'animate-ping' : ''}`}></span>
                    </>
                  ) : (
                    <span className="material-symbols-outlined text-[18px] select-none align-middle">person</span>
                  )}
                </div>

                {/* Message Bubble */}
                <div className="space-y-1 max-w-[calc(100%-48px)]">
                  <div
                    className={`rounded-2xl px-4 py-3.5 text-sm leading-relaxed text-left ${
                      isBot
                        ? 'bg-white border border-outline/10 text-onSurface shadow-sm'
                        : 'bg-primary text-onPrimary shadow-sm hover:shadow-md transition-shadow'
                    }`}
                  >
                    {isBot ? (
                      <BotMessageContent 
                        msg={msg} 
                        isStreaming={msg.text === ''} 
                        onFeedback={handleFeedback} 
                        feedbackState={feedback} 
                        onRegenerate={handleRegenerate}
                        userQuery={messages[messages.indexOf(msg) - 1]?.text || ""}
                        userId={user?.id}
                        onReportClick={handleOpenReportModal}
                      />
                    ) : (
                      <p className="whitespace-pre-line text-sm font-medium">
                        {msg.text}
                      </p>
                    )}

                    {/* Streaming Indicator */}
                    {isBot && msg.text === '' && (
                      <span className="inline-flex gap-1 items-center py-1">
                        <span className="w-1.5 h-1.5 bg-onSurfaceVariant rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-onSurfaceVariant rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-onSurfaceVariant rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </span>
                    )}
                  </div>

                  {/* Sources & Escalations */}
                  {isBot && msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap pt-1 gap-1">
                      {msg.sources.map((src) => (
                        <SourceTag key={src} sourceName={src} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3.5 max-w-[80%] mr-auto animate-slide-up">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-indigo-600 text-white flex items-center justify-center shadow-sm relative animate-pulse" aria-hidden="true">
                <span className="material-symbols-outlined text-[18px] select-none align-middle">smart_toy</span>
              </div>
              <div className="bg-white border border-outline/10 rounded-2xl px-4.5 py-3 text-xs text-onSurfaceVariant/80 shadow-sm flex items-center gap-2">
                <span className="font-bold">PathMate is thinking</span>
                <span className="inline-flex gap-0.5 items-center">
                  <span className="w-1 h-1 bg-onSurfaceVariant rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1 h-1 bg-onSurfaceVariant rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1 h-1 bg-onSurfaceVariant rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
              </div>
            </div>
          )}

          {/* Welcome empty state suggestion grid */}
          {isChatEmpty && (
            <div className="pt-4 pb-8 space-y-6 text-center max-w-lg mx-auto animate-slide-up">
              <div className="w-16 h-16 rounded-full bg-primaryContainer text-primary flex items-center justify-center mx-auto shadow-sm">
                <span className="material-symbols-outlined text-[32px]">waving_hand</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-extrabold text-onSurface">Hey, I'm PathMate! 👋</h3>
                <p className="text-xs text-onSurfaceVariant font-medium leading-relaxed">
                  I'm your official SCE AI companion. Click any suggestion below to start, or type your own question!
                </p>
              </div>

              {/* Suggestions Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                {[
                  { label: "📍 Navigate Campus", q: "How do I navigate to the different blocks on campus?" },
                  { label: "📅 Upcoming Events", q: "What are the upcoming events at Saranathan College?" },
                  { label: "🏠 Hostel Facilities", q: "Tell me about the hostel facilities and warden allocations." },
                  { label: "📚 Regulations Hub", q: "What are the academic regulations and assessment rules?" },
                  { label: "🎓 Campus Clubs", q: "What student clubs can I join at SCE?" },
                  { label: "🤖 Ask General Info", q: "Tell me general details about Saranathan College of Engineering." }
                ].map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSuggestionClick(s.q)}
                    className="p-3 text-xs font-bold text-onSurface/90 border border-outline/15 bg-white rounded-xl hover:bg-primaryContainer hover:border-primary/35 hover:text-primary transition-all text-left shadow-sm active-press"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Bottom Spacer to prevent floating input bar overlap */}
          <div className="h-28 flex-shrink-0" />
        </div>
      </div>

      {/* Floating Scroll to Bottom trigger */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white border border-outline/25 text-primary shadow-lg flex items-center justify-center hover:bg-slate-50 transition-premium active-press z-20 animate-fade-in"
          aria-label="Scroll to bottom"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_downward</span>
        </button>
      )}

      {/* Input Area — Centered Floating Pill Input */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-2xl bg-white border border-outline/25 rounded-3xl shadow-lg p-2.5 z-20 flex flex-col gap-2 transition-premium focus-within:shadow-xl focus-within:border-primary/20">
        
        {/* Top feedback bar (Mic Transcription or Error warnings) */}
        <div className="flex items-center justify-between px-2 text-[10px]">
          {isVoiceRecording ? (
            <div className="flex items-center gap-1.5 font-bold text-red-500 animate-pulse">
              <span className="w-1.5 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-4 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              <span className="w-1.5 h-6 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '450ms' }}></span>
              <span>LISTENING... TALK NOW</span>
            </div>
          ) : inputError ? (
            <span className="font-semibold text-error truncate mr-2">{inputError}</span>
          ) : (
            <span className="font-bold text-onSurfaceVariant/60 select-none">AI ground-truth answering</span>
          )}
          
          <div className="flex items-center gap-1.5 shrink-0">
            <input
              type="checkbox"
              id="voiceReplyToggle"
              checked={voiceReplyMode}
              onChange={(e) => {
                setVoiceReplyMode(e.target.checked);
                if (!e.target.checked) window.speechSynthesis.cancel();
              }}
              className="w-3.5 h-3.5 text-primary rounded border-outline focus:ring-primary focus:ring-1 cursor-pointer accent-primary"
            />
            <label htmlFor="voiceReplyToggle" className="font-bold text-onSurface/70 cursor-pointer select-none text-[10px]">
              Voice Reply
            </label>
          </div>
        </div>

        {/* Form elements */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2 items-center"
        >
          <input
            type="text"
            value={displayValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholders[placeholderIdx]}
            className="flex-1 px-4 py-2.5 text-sm text-onSurface outline-none bg-transparent"
            aria-label="Chat input message text"
          />

          <div className="flex items-center gap-1.5">
            <VoiceInputButton 
              onInterimTranscript={(text) => setInterimVoiceText(text)}
              onFinalTranscript={(text) => {
                setInputValue(prev => `${prev} ${text}`.trim());
                setInterimVoiceText('');
              }}
              onError={(err) => {
                setInterimVoiceText('');
                setInputError(err);
                if (err) setTimeout(() => setInputError(''), 5000);
              }}
              onRecordingStateChange={(recording) => setIsVoiceRecording(recording)}
              disabled={isTyping}
            />

            <button
              type="submit"
              disabled={!displayValue.trim()}
              className={`w-[38px] h-[38px] flex-shrink-0 rounded-full flex items-center justify-center transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active-press ${
                displayValue.trim()
                  ? 'bg-primary hover:bg-[#123669] text-onPrimary shadow-sm hover:shadow-glow-primary'
                  : 'bg-surfaceVariant text-onSurfaceVariant/40 border border-transparent cursor-not-allowed'
              }`}
              aria-label="Send message"
            >
              <span className="material-symbols-outlined text-[17px] align-middle select-none ml-0.5">send</span>
            </button>
          </div>
        </form>
      </div>

      {/* Report Incorrect Answer Dialog Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in text-left">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-elevation4 border border-outline/10 overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-outline/10 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-red-500 text-[22px] select-none">report_problem</span>
                <h3 className="font-extrabold text-sm text-onSurface">Report AI Answer Inaccuracy</h3>
              </div>
              <button
                type="button"
                onClick={handleCloseReportModal}
                className="text-onSurfaceVariant/70 hover:text-onSurface p-1.5 rounded-full hover:bg-slate-200/50 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px] select-none">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitReport} className="flex-1 overflow-y-auto p-6 space-y-4">
              {reportSuccess ? (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100 shadow-sm animate-bounce">
                    <span className="material-symbols-outlined text-[26px] select-none">check_circle</span>
                  </div>
                  <h4 className="font-bold text-sm text-onSurface">Report Submitted successfully!</h4>
                  <p className="text-xs text-onSurfaceVariant max-w-xs">
                    Thank you. Our campus administration team will review the answer and correct the database immediately.
                  </p>
                </div>
              ) : (
                <>
                  {/* Read-only details */}
                  <div className="bg-slate-50 border border-outline/10 rounded-xl p-3.5 space-y-2 text-left">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-onSurfaceVariant/70">Student Question</span>
                      <p className="text-xs text-onSurface font-medium line-clamp-2 mt-0.5">{reportQuestion}</p>
                    </div>
                    <div className="border-t border-outline/5 pt-2">
                      <span className="text-[10px] uppercase font-bold text-onSurfaceVariant/70">AI Response Preview</span>
                      <p className="text-xs text-onSurfaceVariant line-clamp-2 mt-0.5 italic">"{reportMsg?.text}"</p>
                    </div>
                  </div>

                  {/* Form Selects */}
                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div className="space-y-1.5">
                      <label htmlFor="reportReason" className="text-xs font-bold text-onSurfaceVariant">
                        Reason for Report <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="reportReason"
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="w-full bg-slate-50 border border-outline/20 rounded-xl px-3 py-2.5 text-xs font-semibold text-onSurface focus:border-primary focus:bg-white focus:outline-none"
                        required
                      >
                        <option value="Incorrect faculty/staff details">Incorrect Faculty/Staff Details</option>
                        <option value="Incorrect department details">Incorrect Department Details</option>
                        <option value="Outdated schedule or calendar dates">Outdated Timetable/Calendar Dates</option>
                        <option value="Incorrect academic rules/regulations">Incorrect Rules/Regulations</option>
                        <option value="Other factual inaccuracy">Other Factual Inaccuracy</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="reportSeverity" className="text-xs font-bold text-onSurfaceVariant">
                        Severity Level
                      </label>
                      <select
                        id="reportSeverity"
                        value={reportSeverity}
                        onChange={(e) => setReportSeverity(e.target.value)}
                        className="w-full bg-slate-50 border border-outline/20 rounded-xl px-3 py-2.5 text-xs font-semibold text-onSurface focus:border-primary focus:bg-white focus:outline-none"
                      >
                        <option value="Low">Low (Typo / Format)</option>
                        <option value="Medium">Medium (Incorrect info)</option>
                        <option value="High">High (Critical dates/numbers)</option>
                      </select>
                    </div>
                  </div>

                  {/* Textarea for comments */}
                  <div className="space-y-1.5 text-left">
                    <label htmlFor="reportComments" className="text-xs font-bold text-onSurfaceVariant">
                      What is the correct information? (Optional)
                    </label>
                    <textarea
                      id="reportComments"
                      rows="3"
                      value={reportComments}
                      onChange={(e) => setReportComments(e.target.value)}
                      placeholder="e.g. The correct ECE HOD is Dr. M. Santhi, not the one listed."
                      className="w-full bg-slate-50 border border-outline/20 rounded-xl px-3.5 py-2.5 text-xs text-onSurface focus:border-primary focus:bg-white focus:outline-none resize-none"
                    ></textarea>
                  </div>

                  {/* Info Badge */}
                  <div className="text-[10px] text-onSurfaceVariant/85 bg-primary/5 rounded-xl p-3 flex items-start gap-1.5 text-left">
                    <span className="material-symbols-outlined text-primary text-[15px] shrink-0 select-none">info</span>
                    <span>
                      <strong>Auto-Attached Context:</strong> Conversation ID, Timestamp, current department, and source tag ({ (reportMsg?.sources && reportMsg.sources[0]) || 'Gemini' }) will be transmitted to help the admin verify this report.
                    </span>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-3.5 border-t border-outline/10 flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={handleCloseReportModal}
                      className="px-4 py-2 text-xs font-bold text-onSurfaceVariant hover:bg-slate-100 rounded-xl transition-colors active-press"
                      disabled={reportSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-[#123669] rounded-xl shadow-sm transition-all active-press flex items-center gap-1.5"
                      disabled={reportSubmitting}
                    >
                      {reportSubmitting ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[14px]">send</span>
                          <span>Submit Report</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ChatWindow;

