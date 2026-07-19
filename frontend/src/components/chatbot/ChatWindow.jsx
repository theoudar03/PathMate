import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Trash2, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SourceTag from './SourceTag';
import EscalationDraftCard from './EscalationDraftCard';
import VoiceInputButton from '../onboarding/VoiceInputButton';
import { useApp } from '../../contexts/AppContext';
import TranslateText from '../common/TranslateText';

const BotMessageContent = ({ msg, isStreaming }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isInit = msg.id === 'msg-init';

  return (
    <div className="relative group w-full pr-8">
      {isInit ? (
        <p className="whitespace-pre-line text-sm">
          <TranslateText text={msg.text} />
        </p>
      ) : (
        <div className="text-sm">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({node, ...props}) => <h1 className="text-lg font-bold mt-4 mb-2" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-base font-bold mt-3 mb-2" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-sm font-bold mt-2 mb-1" {...props} />,
              p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2 space-y-1 marker:text-onSurface/70" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2 space-y-1 marker:text-onSurface/70" {...props} />,
              li: ({node, ...props}) => <li className="pl-1" {...props} />,
              strong: ({node, ...props}) => <strong className="font-bold text-onSurface" {...props} />,
              a: ({node, ...props}) => <a className="text-primary underline hover:text-primary/80 break-words" target="_blank" rel="noopener noreferrer" {...props} />,
              code: ({node, inline, className, children, ...props}) => {
                return inline ? (
                  <code className="bg-surfaceVariant/50 px-1 py-0.5 rounded text-xs font-mono text-onSurfaceVariant" {...props}>
                    {children}
                  </code>
                ) : (
                  <pre className="bg-surfaceVariant/50 p-3 rounded-lg overflow-x-auto text-xs font-mono text-onSurfaceVariant mb-2 border border-surfaceVariant/50">
                    <code {...props}>{children}</code>
                  </pre>
                )
              },
              table: ({node, ...props}) => <div className="overflow-x-auto mb-2"><table className="min-w-full divide-y divide-surfaceVariant/50 border border-surfaceVariant/50 rounded-lg text-sm" {...props} /></div>,
              th: ({node, ...props}) => <th className="px-3 py-2 bg-surfaceVariant/30 text-left text-xs font-semibold text-onSurfaceVariant tracking-wider border-b border-surfaceVariant/50" {...props} />,
              td: ({node, ...props}) => <td className="px-3 py-2 whitespace-normal text-sm text-onSurface border-b border-surfaceVariant/30" {...props} />,
              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary/40 pl-3 italic text-onSurfaceVariant my-2" {...props} />,
            }}
          >
            {msg.text}
          </ReactMarkdown>
        </div>
      )}

      {/* Copy Button */}
      {!isStreaming && msg.text && (
        <button
          onClick={handleCopy}
          className="absolute top-0 -right-2 p-1.5 rounded bg-surfaceVariant/50 text-onSurfaceVariant opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surfaceVariant active:scale-95 shadow-sm"
          title="Copy response"
          aria-label="Copy response"
        >
          {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
        </button>
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
          sources: data.sourceTable ? [data.sourceTable] : [],
          showEscalation: !data.isGrounded,
          unresolvedQuery: !data.isGrounded ? queryText : undefined,
          escalationDraft: data.escalationDraft
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

  return (
    <div className="flex flex-col h-[calc(100vh-270px)] min-h-[460px] max-h-[600px] bg-surface rounded-2xl border border-surfaceVariant overflow-hidden font-sans shadow-elevation1">
      {/* Chat Header */}
      <div className="flex justify-between items-center bg-primary text-onPrimary px-5 py-4 shadow-elevation1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primaryContainer text-onPrimaryContainer flex items-center justify-center font-bold text-xs">
            PM
          </div>
          <div>
            <h2 className="text-sm font-bold font-sans leading-none text-onPrimary">{t('groundedAssistantTitle')}</h2>
            <span className="text-[10px] text-primaryContainer font-medium mt-1 block">{t('informationDesk')}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClearHistory}
          className="text-primaryContainer hover:text-onPrimary p-2 rounded-full hover:bg-white/10 transition-all flex items-center justify-center active:scale-[0.95]"
          title={t('clearHistoryBtn')}
          aria-label={t('clearHistoryBtn')}
        >
          <span className="material-symbols-outlined text-[20px] select-none align-middle">delete</span>
        </button>
      </div>

      {/* Messages Scroll Area — scrolls itself, never the page */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-surfaceVariant/10">
        {messages.map((msg) => {
          const isBot = msg.sender === 'bot';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${
                isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${
                  isBot ? 'bg-primary text-onPrimary' : 'bg-primaryContainer text-onPrimaryContainer font-bold'
                }`}
                aria-hidden="true"
              >
                {isBot ? (
                  <span className="material-symbols-outlined text-[16px] select-none align-middle">smart_toy</span>
                ) : (
                  <span className="material-symbols-outlined text-[16px] select-none align-middle">person</span>
                )}
              </div>

              {/* Message Bubble */}
              <div className="space-y-1">
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed text-left ${
                    isBot
                      ? 'bg-surface border border-surfaceVariant text-onSurface'
                      : 'bg-primary text-onPrimary shadow-sm'
                  }`}
                >
                  {isBot ? (
                    <BotMessageContent msg={msg} isStreaming={msg.text === ''} />
                  ) : (
                    <p className="whitespace-pre-line text-sm">
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
                  <div className="flex flex-wrap pt-0.5">
                    {msg.sources.map((src) => (
                      <SourceTag key={src} sourceName={src} />
                    ))}
                  </div>
                )}

                {isBot && msg.showEscalation && (
                  <EscalationDraftCard unresolvedQuery={msg.unresolvedQuery} />
                )}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex gap-3 max-w-[80%] mr-auto">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-onPrimary" aria-hidden="true">
              <span className="material-symbols-outlined text-[16px] select-none align-middle">smart_toy</span>
            </div>
            <div className="bg-surface border border-surfaceVariant rounded-2xl px-4 py-3 text-sm">
              <span className="inline-flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-onSurfaceVariant rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-onSurfaceVariant rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-onSurfaceVariant rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-surfaceVariant bg-surface space-y-3">
        
        {/* Voice Reply Toggle */}
        <div className="flex items-center justify-between px-2">
          {inputError ? (
            <span className="text-xs font-semibold text-error truncate mr-2">{inputError}</span>
          ) : (
            <span className="text-xs font-semibold text-onSurfaceVariant/70 select-none">Voice Typing Enabled</span>
          )}
          
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="checkbox"
              id="voiceReplyToggle"
              checked={voiceReplyMode}
              onChange={(e) => {
                setVoiceReplyMode(e.target.checked);
                if (!e.target.checked) window.speechSynthesis.cancel();
              }}
              className="w-4 h-4 text-primary rounded border-outline focus:ring-primary focus:ring-1 cursor-pointer accent-primary"
            />
            <label htmlFor="voiceReplyToggle" className="text-xs font-semibold text-onSurface cursor-pointer select-none">
              Voice Reply
            </label>
          </div>
        </div>

        {/* Text Input Row */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2 items-end"
        >
          <div className="flex-1 relative flex items-center bg-surface border border-outline rounded-3xl focus-within:ring-1 focus-within:ring-primary focus-within:border-primary overflow-hidden shadow-sm">
            <input
              type="text"
              value={displayValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t('assistantPlaceholder')}
              className="flex-1 px-4 py-3 text-sm text-onSurface outline-none bg-transparent"
              aria-label="Chat input message text"
            />
            <div className="pr-1.5 py-1">
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
                disabled={isTyping}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!displayValue.trim()}
            className={`w-[46px] h-[46px] flex-shrink-0 rounded-full flex items-center justify-center transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              displayValue.trim()
                ? 'bg-primary hover:bg-[#123669] text-onPrimary shadow-sm'
                : 'bg-surfaceVariant text-onSurfaceVariant/40 border border-transparent cursor-not-allowed'
            }`}
            aria-label="Send message"
          >
            <span className="material-symbols-outlined text-[20px] align-middle select-none ml-1">send</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;

