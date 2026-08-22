"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, ArrowUp, Edit, FileText, ThumbsUp, ThumbsDown, Sparkles, ArrowUpRight, LogIn, ExternalLink, AlertTriangle, Check, Loader2, Phone } from 'lucide-react';
import { findMatch, detectLanguage, getContextualSuggestions, detectDataQuery, detectActionQuery, shouldEscalate, getInitialGreeting, DEFAULT_SUGGESTIONS, getPageSuggestions } from '@/lib/support-bot/index';
import { saveMessages, loadMessages, clearMessages, getCachedAIResponse, cacheAIResponse, trackTopic, clearContext } from '@/lib/support-bot/chatMemory';
import { detectFlowTrigger, getFlowDefinition, getStepQuestion, processFlowInput, isYes, isNo, isCancel, wantsDoIt, wantsShowHow } from '@/lib/support-bot/chatFlows';
import { getChatSalesData, getChatProductData, getChatOrderData, getChatStockAlerts, getChatSubscriptionData, getChatWebsiteStatus, getChatTopProducts, getChatCustomerData, getChatOffersData, getChatNotifications, getChatVisitorData, storeChatFeedback, storeChatConversation, chatUpdateProductPrice, chatUpdateProductStock, chatUpdateOrderStatus, chatAddProduct, chatCreateOffer, chatAddCategory, chatDeleteProduct, chatPublishWebsite, chatSmartQuery } from '@/app/actions/chatDataActions';
import { useRouter, usePathname } from 'next/navigation';
import { getSupportConfig } from '@/app/actions/supportActions';
import { createBrowserClient } from '@supabase/ssr';

// Kodee Logo Component
const KodeeLogo = ({ className }) => (
    <div className={className || "text-[#8A63D2]"}>
        <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2L14.7 9.3L22 12L14.7 14.7L12 22L9.3 14.7L2 12L9.3 9.3L12 2ZM12 6.8L10.6 10.6L6.8 12L10.6 13.4L12 17.2L13.4 13.4L17.2 12L13.4 10.6L12 6.8Z" fill="currentColor"/>
        </svg>
    </div>
);

export default function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [contactFounderNumber, setContactFounderNumber] = useState(null);
  const [user, setUser] = useState(null);
  const [hoveredPrompt, setHoveredPrompt] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClientSite, setIsClientSite] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const isMainDomain = hostname === 'bizvistar.in' || hostname === 'www.bizvistar.in' || hostname === 'app.bizvistar.in' || hostname === 'localhost' || hostname.endsWith('.vercel.app');
      if (!isMainDomain) {
         setIsClientSite(true);
      }
    }
  }, []);
  const [dynamicSuggestions, setDynamicSuggestions] = useState([]);
  const [ownerName, setOwnerName] = useState('');
  const [currentLang, setCurrentLang] = useState('en');
  const [feedbackGiven, setFeedbackGiven] = useState({});
  const [isFirstResponse, setIsFirstResponse] = useState(true);
  const [activePill, setActivePill] = useState(null);
  // Flow (wizard) state
  const [activeFlow, setActiveFlow] = useState(null);
  // Chat session ID for per-message feedback tracking
  const [chatSessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);

  const loadingSteps = [
    "Analyzing your request...",
    "Searching knowledge base...",
    "Generating response..."
  ];

  useEffect(() => {
    let interval;
    if (isLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep(prev => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Load saved messages + owner name on mount
  useEffect(() => {
    const saved = loadMessages();
    if (saved && saved.length > 0) {
      setMessages(saved);
      setIsFirstResponse(false); // Already has messages, don't greet again
    }
    const cachedName = typeof window !== 'undefined' ? localStorage.getItem('bizvistar_owner_name') : '';
    if (cachedName) setOwnerName(cachedName);
  }, []);

  // Save messages whenever they change
  useEffect(() => {
    if (messages.length > 0) saveMessages(messages);
  }, [messages]);

  const messagesEndRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();

  // Build dynamic suggestions — page-based is the baseline
  const activeSuggestions = dynamicSuggestions.length > 0 ? dynamicSuggestions : (getPageSuggestions(pathname) || DEFAULT_SUGGESTIONS);

  // Map suggestions into the prompt format for UI
  const suggestedPrompts = activeSuggestions.map(s => ({ short: s, full: s }));
  const suggestedPills = ["Products", "Orders", "Website", "Analytics"];

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
      getSupportConfig().then(config => {
          if (config.contactFounder) {
              setContactFounderNumber(config.contactFounder);
          }
      });

      const checkUser = async () => {
          const { data: { session } } = await supabase.auth.getSession();
          setUser(session?.user || null);
      };
      checkUser();

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user || null);
      });

      return () => subscription.unsubscribe();
  }, [supabase]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isLoading]);

  // Update suggestions when user navigates to a different page
  useEffect(() => {
    if (!activeFlow) {
      const pageSuggs = getPageSuggestions(pathname);
      if (pageSuggs) setDynamicSuggestions(pageSuggs);
    }
  }, [pathname, activeFlow]);

  const handleNewChat = () => {
      setShowClearConfirm(true);
  };

  const confirmClearChat = async () => {
      // Store the session in DB before clearing
      if (messages.length > 1 && user) {
        try {
          const topics = [...new Set(messages.filter(m => m.role === 'user').map(m => m.content?.substring(0, 50)))];
          await storeChatConversation({
            sessionId: chatSessionId,
            messageCount: messages.length,
            topics: topics.slice(0, 10),
            startedAt: messages[0]?.timestamp ? new Date(messages[0].timestamp).toISOString() : new Date().toISOString(),
            metadata: { lastTopic: topics[topics.length - 1] || '' },
          });
        } catch (e) { /* silent fail */ }
      }
      setMessages([]);
      setInput('');
      setShowClearConfirm(false);
      setDynamicSuggestions([]);
      setIsFirstResponse(true); // Reset greeting for fresh session
      clearMessages();
      clearContext();
  };

  const handleDownload = () => {
      const text = messages.map(m => `${m.role === 'user' ? 'You' : 'Vista'}: ${m.content}`).join('\n\n');
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'chat-history.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  // Store session to DB when panel closes
  const handleClose = async () => {
    setIsOpen(false);
    if (messages.length > 1 && user) {
      try {
        const topics = [...new Set(messages.filter(m => m.role === 'user').map(m => m.content?.substring(0, 50)))];
        await storeChatConversation({
          sessionId: chatSessionId,
          messageCount: messages.length,
          topics: topics.slice(0, 10),
          startedAt: messages[0]?.timestamp ? new Date(messages[0].timestamp).toISOString() : new Date().toISOString(),
          metadata: { lastTopic: topics[topics.length - 1] || '' },
        });
      } catch (e) { /* silent fail */ }
    }
  };

  // DATA QUERY HANDLER MAP
  const dataHandlers = {
    getChatSalesData, getChatProductData, getChatOrderData, getChatStockAlerts,
    getChatSubscriptionData, getChatWebsiteStatus, getChatTopProducts,
    getChatCustomerData, getChatOffersData, getChatNotifications, getChatVisitorData,
  };

  // ACTION HANDLER MAP
  const actionHandlers = {
    chatUpdateProductPrice, chatUpdateProductStock, chatUpdateOrderStatus,
  };

  // FLOW ACTION HANDLER MAP
  const flowActionHandlers = {
    addProduct: chatAddProduct,
    chatCreateOffer,
    addCategory: chatAddCategory,
    chatUpdateProductPrice,
    chatUpdateProductStock,
    chatUpdateOrderStatus,
    chatDeleteProduct,
    chatPublishWebsite,
  };

  // Cancel the active flow
  const cancelFlow = () => {
    setActiveFlow(null);
    setMessages(prev => [...prev, { role: 'assistant', content: '❌ Action cancelled. How else can I help?', timestamp: Date.now() }]);
    setDynamicSuggestions(DEFAULT_SUGGESTIONS);
  };

  // Warm prefix for first bot response in a session
  const getWarmPrefix = () => {
    const hour = new Date().getHours();
    let prefixes;
    if (hour >= 5 && hour < 12) {
      prefixes = ['Hope you\'re having a lovely morning! ☀️ ', 'Great to see you this morning! ', 'Hope your day is off to a great start! '];
    } else if (hour >= 12 && hour < 17) {
      prefixes = ['Hope you\'re having a wonderful afternoon! 🌤️ ', 'Great to see you! Hope your day is going well. ', 'Hope you\'re having a productive day! '];
    } else if (hour >= 17 && hour < 21) {
      prefixes = ['Hope you had a lovely day! 🌅 ', 'Great to see you this evening! ', 'Hope your evening is going great! '];
    } else {
      // 9 PM to 5 AM — Night
      prefixes = ['Burning the midnight oil? 🌙 ', 'Working late? You\'re dedicated! 💪 ', 'Hope your night is going great! 🌙 '];
    }
    return prefixes[Math.floor(Math.random() * prefixes.length)];
  };

  // Handle pill click to set category suggestions
  const handlePillClick = (pill) => {
    setActivePill(pill);
    const categoryMap = { 'Products': 'products', 'Orders': 'orders', 'Website': 'website', 'Analytics': 'analytics' };
    const cat = categoryMap[pill];
    if (cat) {
      const suggestions = getContextualSuggestions(cat, []);
      setDynamicSuggestions(suggestions);
    }
  };

  // Handle feedback (per-message thumbs up/down)
  const handleFeedback = async (msgIdx, type) => {
    // Toggle: if same feedback clicked again, remove it
    const currentFeedback = feedbackGiven[msgIdx];
    if (currentFeedback === type) {
      setFeedbackGiven(prev => { const n = { ...prev }; delete n[msgIdx]; return n; });
      return;
    }
    setFeedbackGiven(prev => ({ ...prev, [msgIdx]: type }));
    const msg = messages[msgIdx];
    if (msg) {
      try {
        await storeChatFeedback({
          sessionId: chatSessionId,
          messageIndex: msgIdx,
          message: msg.content?.substring(0, 500),
          feedback: type,
        });
      } catch (e) { /* silent fail */ }
    }
  };

  const handleSendMessage = async (e, textOverride = null) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isLoading) return;

    const userText = textOverride || input.trim();
    if (!userText) return;

    setInput('');
    setHoveredPrompt(null);
    
    // Detect language
    const lang = detectLanguage(userText);
    setCurrentLang(lang);
    
    const newMessages = [...messages, { role: 'user', content: userText, timestamp: Date.now() }];
    setMessages(newMessages);
    setIsLoading(true);

    // ═══════════════════════════════════
    // FLOW ENGINE: Active flow takes priority
    // ═══════════════════════════════════
    if (activeFlow) {
      // Cancel check
      if (isCancel(userText)) {
        cancelFlow();
        setIsLoading(false);
        return;
      }

      const flow = getFlowDefinition(activeFlow.flowId);
      if (!flow) { setActiveFlow(null); setIsLoading(false); return; }

      // Phase: choose_mode — user choosing "do it for me" vs "show me how"
      if (activeFlow.phase === 'choose_mode') {
        if (wantsShowHow(userText) || userText.trim() === '2') {
          // Show how mode
          setTimeout(() => {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: flow.showHowText,
              action: flow.showHowAction,
              timestamp: Date.now(),
            }]);
            setActiveFlow(null);
            setIsLoading(false);
          }, 300);
          return;
        }
        // Default: do it for me (user said yes/1/do it/anything else)
        if (flow.steps.length === 0) {
          // No steps — go straight to confirmation (e.g., publish)
          setTimeout(() => {
            setMessages(prev => [...prev, { role: 'assistant', content: flow.buildConfirmation({}), timestamp: Date.now() }]);
            setActiveFlow({ ...activeFlow, phase: 'confirming', collectedData: {} });
            setIsLoading(false);
          }, 300);
          return;
        }
        const firstQ = getStepQuestion(flow, 0, {});
        setTimeout(() => {
          setMessages(prev => [...prev, { role: 'assistant', content: firstQ, timestamp: Date.now() }]);
          setActiveFlow({ ...activeFlow, phase: 'collecting', currentStep: 0 });
          setIsLoading(false);
        }, 300);
        return;
      }

      // Phase: collecting — gathering step data
      if (activeFlow.phase === 'collecting') {
        const stepIdx = activeFlow.currentStep;
        const result = processFlowInput(flow, stepIdx, userText, activeFlow.collectedData);

        if (!result.valid) {
          setTimeout(() => {
            setMessages(prev => [...prev, { role: 'assistant', content: result.error, timestamp: Date.now() }]);
            setIsLoading(false);
          }, 300);
          return;
        }

        const newData = { ...activeFlow.collectedData, [flow.steps[stepIdx].key]: result.value };
        const nextStep = stepIdx + 1;

        if (nextStep >= flow.steps.length) {
          // All steps done — show confirmation
          const confirmText = flow.buildConfirmation(newData);
          setTimeout(() => {
            setMessages(prev => [...prev, { role: 'assistant', content: confirmText, timestamp: Date.now() }]);
            setActiveFlow({ ...activeFlow, phase: 'confirming', collectedData: newData });
            setIsLoading(false);
          }, 300);
          return;
        }

        // Ask next question
        const nextQ = getStepQuestion(flow, nextStep, newData);
        setTimeout(() => {
          setMessages(prev => [...prev, { role: 'assistant', content: nextQ, timestamp: Date.now() }]);
          setActiveFlow({ ...activeFlow, currentStep: nextStep, collectedData: newData });
          setIsLoading(false);
        }, 300);
        return;
      }

      // Phase: confirming — yes/no/edit
      if (activeFlow.phase === 'confirming') {
        if (isYes(userText)) {
          // Execute the action!
          const handler = flowActionHandlers[flow.handler];
          if (handler) {
            try {
              const payload = flow.buildPayload(activeFlow.collectedData);
              const result = flow.isArrayArgs ? await handler(...payload) : await handler(payload);
              const responseText = result.text || result.error || 'Done!';
              setMessages(prev => [...prev, { role: 'assistant', content: responseText, timestamp: Date.now() }]);
              if (flow.followUp) setDynamicSuggestions(flow.followUp);
            } catch (err) {
              setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again or do it from the dashboard. 😔', timestamp: Date.now() }]);
            }
          }
          setActiveFlow(null);
          setIsLoading(false);
          return;
        }

        if (isNo(userText) && userText.toLowerCase().includes('edit')) {
          // Restart flow
          const firstQ = getStepQuestion(flow, 0, {});
          setTimeout(() => {
            setMessages(prev => [...prev, { role: 'assistant', content: `Let's start over! ${firstQ}`, timestamp: Date.now() }]);
            setActiveFlow({ ...activeFlow, phase: 'collecting', currentStep: 0, collectedData: {} });
            setIsLoading(false);
          }, 300);
          return;
        }

        // No / Cancel
        cancelFlow();
        setIsLoading(false);
        return;
      }
    }

    try {
      // ═══════════════════════════════════
      // LAYER 0: Flow Trigger Detection
      // ═══════════════════════════════════
      const flowId = detectFlowTrigger(userText);
      if (flowId && user) {
        const flow = getFlowDefinition(flowId);
        if (flow) {
          // Offer dual-mode: do it for me vs show me how
          const modePrompt = `${flow.emoji} **${flow.name}**\n\n${flow.intro}\n\nHow would you like to proceed?\n\n1️⃣ **Do it for me** — I'll guide you step by step\n2️⃣ **Show me how** — I'll give you the steps to do it yourself\n\nType **1** or **2**, or just say "do it" / "show me"`;
          setTimeout(() => {
            setMessages(prev => [...prev, { role: 'assistant', content: modePrompt, timestamp: Date.now() }]);
            setActiveFlow({ flowId, currentStep: 0, collectedData: {}, phase: 'choose_mode' });
            setDynamicSuggestions(['Do it for me', 'Show me how', 'Cancel']);
            setIsLoading(false);
          }, 300);
          return;
        }
      }

      // ═══════════════════════════════════
      // LAYER 1: Local Intent Matching (400+ intents)
      // ═══════════════════════════════════
      const match = findMatch(userText, ownerName);

      if (match) {
        // Check if the action is a data query that needs server-side data
        if (match.response.action?.type === 'data_query') {
          const handlerName = match.response.action.handler;
          const handler = dataHandlers[handlerName];
          if (handler && user) {
            try {
              const result = await handler();
              let responseText = result.text || result.error || 'Sorry, I couldn\'t fetch that data right now.';
              if (isFirstResponse) { responseText = getWarmPrefix() + '\n\n' + responseText; setIsFirstResponse(false); }
              setMessages(prev => [...prev, { role: 'assistant', content: responseText, timestamp: Date.now() }]);
              trackTopic(match.category);
              setDynamicSuggestions(getContextualSuggestions(match.category, match.followUp));
            } catch (err) {
              setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I couldn\'t fetch that data right now. Please try again.', timestamp: Date.now() }]);
            }
            setIsLoading(false);
            return;
          } else if (!user) {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: 'Please **sign in** to view your store data.',
              action: { type: 'navigate', label: 'Sign In', url: '/sign-in' },
              timestamp: Date.now(),
            }]);
            setIsLoading(false);
            return;
          }
        }

        // Check if action is WhatsApp escalation
        if (match.response.action?.type === 'whatsapp') {
          const whatsappNum = contactFounderNumber || '919876543210';
          setTimeout(() => {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: match.response.text,
              action: { type: 'link', label: match.response.action.label || '📱 Chat on WhatsApp', url: `https://wa.me/${whatsappNum}?text=Hi%2C%20I%20need%20help%20with%20my%20BizVistar%20store` },
              timestamp: Date.now(),
            }]);
            setIsLoading(false);
            trackTopic(match.category);
            setDynamicSuggestions(getContextualSuggestions(match.category, match.followUp));
          }, 400);
          return;
        }

        // Regular intent match — instant response
        setTimeout(() => {
          let text = match.response.text;
          if (isFirstResponse && !match.isGreeting) { text = getWarmPrefix() + '\n\n' + text; setIsFirstResponse(false); }
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: text,
            action: match.response.action,
            timestamp: Date.now(),
          }]);
          setIsLoading(false);
          trackTopic(match.category);
          setDynamicSuggestions(getContextualSuggestions(match.category, match.followUp));
        }, 400);
        return;
      }

      // ═══════════════════════════════════
      // LAYER 2: Data Query Pattern Detection (fallback)
      // ═══════════════════════════════════
      const dataHandler = detectDataQuery(userText);
      if (dataHandler && user) {
        const handler = dataHandlers[dataHandler];
        if (handler) {
          try {
            const result = await handler();
            const responseText = result.text || result.error || 'Sorry, I couldn\'t fetch that data right now.';
            setMessages(prev => [...prev, { role: 'assistant', content: responseText, timestamp: Date.now() }]);
            trackTopic('analytics');
            setDynamicSuggestions(getContextualSuggestions('analytics', []));
          } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I couldn\'t fetch that data right now.', timestamp: Date.now() }]);
          }
          setIsLoading(false);
          return;
        }
      }
      // ═══════════════════════════════════
      // LAYER 2.5: Smart DB Query (natural language → specific data)
      // "price of cotton tshirt", "order #42", "customer Rahul"
      // ═══════════════════════════════════
      if (user) {
        try {
          const smartResult = await chatSmartQuery(userText);
          if (smartResult) {
            let text = smartResult.text;
            if (isFirstResponse) { text = getWarmPrefix() + '\n\n' + text; setIsFirstResponse(false); }
            setMessages(prev => [...prev, { role: 'assistant', content: text, timestamp: Date.now() }]);
            if (smartResult.followUp) setDynamicSuggestions(smartResult.followUp);
            setIsLoading(false);
            return;
          }
        } catch (err) { /* smart query failed, continue to next layer */ }
      }
      // ═══════════════════════════════════
      // LAYER 3: Action Engine (price/stock/order updates)
      // ═══════════════════════════════════
      const actionQuery = detectActionQuery(userText);
      if (actionQuery && user) {
        const handler = actionHandlers[actionQuery.handler];
        if (handler) {
          try {
            const result = await handler(...actionQuery.params);
            const responseText = result.text || result.error || 'Sorry, I couldn\'t perform that action.';
            setMessages(prev => [...prev, { role: 'assistant', content: responseText, timestamp: Date.now() }]);
            trackTopic('products');
            setDynamicSuggestions(['Show my products', 'Show pending orders', 'What are my sales?']);
          } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I couldn\'t complete that action. Please try from the dashboard.', timestamp: Date.now() }]);
          }
          setIsLoading(false);
          return;
        }
      }

      // ═══════════════════════════════════
      // LAYER 4: Escalation Check
      // ═══════════════════════════════════
      if (shouldEscalate(userText)) {
        const whatsappNum = contactFounderNumber || '919876543210';
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: "I understand this needs personal attention. Let me connect you with our support team — they'll help you right away! 💙",
            action: { type: 'link', label: '📱 Chat on WhatsApp', url: `https://wa.me/${whatsappNum}?text=Hi%2C%20I%20need%20help%20with%20my%20BizVistar%20store` },
            timestamp: Date.now(),
          }]);
          setIsLoading(false);
          setDynamicSuggestions([]);
        }, 400);
        return;
      }

      // ═══════════════════════════════════
      // GUEST CHECK — No AI for guests
      // ═══════════════════════════════════
      if (!user) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: "I can help with basic questions about BizVistar! For AI-powered help and to access your store data, please **sign in** to your account. 😊",
            action: { type: 'navigate', label: 'Sign In / Register', url: '/sign-in' },
            timestamp: Date.now(),
          }]);
          setIsLoading(false);
        }, 500);
        return;
      }

      // ═══════════════════════════════════
      // LAYER 3: AI — Check cache first, then API
      // ═══════════════════════════════════
      const cached = getCachedAIResponse(userText);
      if (cached) {
        setMessages(prev => [...prev, { role: 'assistant', content: cached, timestamp: Date.now() }]);
        setIsLoading(false);
        setDynamicSuggestions(['What else can you help with?', 'Show my dashboard', 'How to increase sales?']);
        return;
      }

      const apiMessages = newMessages.slice(-6).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, language: currentLang }),
      });

      const data = await response.json();

      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply, timestamp: Date.now() }]);
        cacheAIResponse(userText, data.reply);
        setDynamicSuggestions(['What else can you help with?', 'Show my sales', 'How to add a product?']);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble right now. Please try again, or reach out on WhatsApp! 📱", timestamp: Date.now() }]);
      }

    } catch (error) {
      console.error("Support Widget Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Something went wrong. Please check your connection and try again. 😔", timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action) => {
      if (action.type === 'navigate') {
          setIsOpen(false);
          router.push(action.url);
      } else if (action.type === 'link') {
          window.open(action.url, '_blank');
      }
  };

  if (isClientSite || pathname?.startsWith('/site/') || pathname?.startsWith('/preview/') || pathname?.startsWith('/templates/')) {
    return null;
  }

  const renderMessageContent = (msg) => {
    if (msg.content === '[ESCALATE_TO_HUMAN]') {
        if (!user) return null;

        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2 mt-2">
                <div className="flex items-center gap-2 text-red-700 font-semibold">
                    <AlertTriangle size={18} />
                    <span>Urgent Issue</span>
                </div>
                <p className="text-sm text-red-600">
                    I see this is an urgent issue. Please chat directly with the Founder.
                </p>
                <a 
                    href={`https://wa.me/${contactFounderNumber || '919876543210'}?text=I%20need%20urgent%20help%20with%20my%20BizVistar%20account`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-2 rounded-md text-sm font-medium transition-colors"
                >
                    <MessageCircle size={16} />
                    Chat on WhatsApp
                </a>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <p className="whitespace-pre-wrap leading-relaxed text-[15px] text-gray-800">
                {msg.content.split('**').map((part, i) => 
                    i % 2 === 1 ? <span key={i} className="font-bold">{part}</span> : part
                )}
            </p>
            {msg.action && (
                <button
                    onClick={() => handleActionClick(msg.action)}
                    className="flex items-center gap-2 text-xs font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 px-3 py-2 rounded-md transition-colors w-fit border border-brand-100 mt-2"
                >
                    {msg.action.url?.includes('http') ? <ExternalLink size={14} /> : <LogIn size={14} />}
                    {msg.action.label}
                </button>
            )}
        </div>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
        <AnimatePresence mode="wait">
            {!isOpen ? (
                 <motion.button
                    key="button"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-[#8A63D2] to-[#6C4AB6] text-white rounded-full shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                >
                    <MessageCircle size={22} className="text-white" strokeWidth={2} />
                    <span className="font-semibold text-[16px] pr-1">Ask Vista</span>
                </motion.button>
            ) : (
                <motion.div
                    key="window"
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="w-[calc(100vw-2rem)] md:w-[420px] h-[700px] max-h-[85vh] bg-white border border-gray-200 shadow-2xl rounded-3xl flex flex-col overflow-hidden relative"
                >
                    {/* Clear Chat Confirm Modal */}
                    <AnimatePresence>
                        {showClearConfirm && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
                            >
                                <motion.div 
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.95, opacity: 0 }}
                                    className="bg-white rounded-2xl p-6 w-full max-w-[320px] shadow-xl relative"
                                >
                                    <button 
                                        onClick={() => setShowClearConfirm(false)} 
                                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors"
                                    >
                                        <X size={20} strokeWidth={2} />
                                    </button>
                                    <h3 className="text-[18px] font-bold text-center mb-3 mt-2 text-gray-900">Clear chat</h3>
                                    <p className="text-gray-600 text-center mb-6 text-[14.5px]">
                                        After clearing history you won't be able to access previous chats.
                                    </p>
                                    <div className="flex gap-3 justify-center">
                                        <button 
                                            onClick={() => setShowClearConfirm(false)} 
                                            className="flex-1 py-2.5 font-semibold text-[#8A63D2] hover:bg-gray-50 rounded-xl transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={confirmClearChat} 
                                            className="flex-1 py-2.5 font-semibold text-white bg-[#8A63D2] hover:bg-[#7a52c2] rounded-xl transition-colors"
                                        >
                                            Clear chat
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Header */}
                    <div className="px-6 py-4 bg-white text-gray-900 flex items-center justify-between z-10 relative">
                        <h3 className="font-bold text-[1.1rem]">Vista</h3>
                        <div className="flex items-center gap-4">
                            <div className="relative group flex items-center justify-center">
                                <a 
                                    href={`https://wa.me/${contactFounderNumber || '919876543210'}?text=Hi%2C%20I%20need%20help`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-900 hover:text-[#25D366] transition-colors"
                                >
                                    <Phone size={19} strokeWidth={1.5} />
                                </a>
                                <span className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[11px] py-1 px-2 rounded whitespace-nowrap pointer-events-none">
                                    WhatsApp
                                </span>
                            </div>
                            <div className="relative group flex items-center justify-center">
                                <button 
                                    onClick={handleDownload}
                                    className="text-gray-900 hover:text-gray-600 transition-colors"
                                >
                                    <FileText size={20} strokeWidth={1.5} />
                                </button>
                                <span className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[11px] py-1 px-2 rounded whitespace-nowrap pointer-events-none">
                                    Download
                                </span>
                            </div>
                            <div className="relative group flex items-center justify-center">
                                <button 
                                    onClick={handleNewChat}
                                    className="text-gray-900 hover:text-gray-600 transition-colors"
                                >
                                    <Edit size={20} strokeWidth={1.5} />
                                </button>
                                <span className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[11px] py-1 px-2 rounded whitespace-nowrap pointer-events-none">
                                    New chat
                                </span>
                            </div>
                            <div className="relative group flex items-center justify-center">
                                <button 
                                    onClick={handleClose}
                                    className="text-gray-900 hover:text-gray-600 transition-colors ml-1"
                                >
                                    <X size={22} strokeWidth={1.5} />
                                </button>
                                <span className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[11px] py-1 px-2 rounded whitespace-nowrap pointer-events-none">
                                    Close
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto px-6 py-2 flex flex-col bg-white">
                        {messages.length === 0 ? (
                            <div className="flex flex-col flex-1 pb-4 items-center justify-center mt-4">
                                <div className="flex flex-col items-center justify-center flex-1">
                                    <h2 className="text-[28px] font-bold text-gray-900 mb-2">Hello 👋</h2>
                                    <p className="text-gray-600 text-[16px]">How can I help you today?</p>
                                </div>

                                <div className="w-full flex flex-col gap-2 mt-6">
                                    {suggestedPrompts.map((p, i) => (
                                        <button
                                            key={i}
                                            className="flex items-center gap-4 py-3.5 px-4 rounded-xl hover:bg-gray-100 transition-colors text-left group border border-transparent hover:border-gray-100"
                                            onMouseEnter={() => setHoveredPrompt(p)}
                                            onMouseLeave={() => setHoveredPrompt(null)}
                                            onClick={() => handleSendMessage(null, p.full)}
                                        >
                                            <ArrowUpRight size={20} className="text-gray-900 shrink-0" strokeWidth={2} />
                                            <span className="text-[14.5px] font-medium text-gray-800">{p.short}</span>
                                        </button>
                                    ))}
                                </div>
                                
                                <div className="flex gap-2 mt-3 overflow-x-auto w-full pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                    {suggestedPills.map((pill, i) => (
                                        <button 
                                          key={i}
                                          onClick={() => handlePillClick(pill)}
                                          className={`whitespace-nowrap px-4 py-1.5 rounded-full border text-[14px] transition-colors focus:outline-none cursor-pointer ${activePill === pill ? 'border-[#8A63D2] text-[#8A63D2] bg-[#8A63D2]/5' : 'border-gray-200 text-gray-600 hover:border-[#8A63D2] hover:text-[#8A63D2]'}`}
                                        >
                                            {pill}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 pb-4 flex flex-col flex-1">
                                {messages.map((msg, idx) => {
                                    const isLastMessage = idx === messages.length - 1;
                                    return (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                                        >
                                            {msg.role === 'assistant' ? (
                                                <div className="w-full flex flex-col">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <MessageCircle size={18} className="text-[#8A63D2]" />
                                                        <span className="font-bold text-[15px] text-gray-900">Vista</span>
                                                    </div>
                                                    <div className="w-full">
                                                        {renderMessageContent(msg)}
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-4 text-gray-500">
                                                        <button 
                                                            onClick={() => handleFeedback(idx, 'up')}
                                                            className={`transition-colors ${feedbackGiven[idx] === 'up' ? 'text-[#8A63D2]' : 'hover:text-gray-900'}`}
                                                        >
                                                            <ThumbsUp size={18} strokeWidth={1.5} fill={feedbackGiven[idx] === 'up' ? 'currentColor' : 'none'} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleFeedback(idx, 'down')}
                                                            className={`transition-colors ${feedbackGiven[idx] === 'down' ? 'text-red-500' : 'hover:text-gray-900'}`}
                                                        >
                                                            <ThumbsDown size={18} strokeWidth={1.5} fill={feedbackGiven[idx] === 'down' ? 'currentColor' : 'none'} />
                                                        </button>
                                                    </div>
                                                    
                                                    {isLastMessage && !isLoading && (
                                                        <div className="mt-6">
                                                            <div className="flex items-center gap-2 mb-3 text-gray-600">
                                                                <span className="text-[14px] font-medium">Suggestions</span>
                                                            </div>
                                                            <div className="flex flex-col gap-2 border-l-2 border-gray-100 pl-3">
                                                                {suggestedPrompts.map((p, i) => (
                                                                    <button
                                                                        key={i}
                                                                        className="flex items-start gap-3 py-2 text-left group transition-colors hover:bg-gray-50 rounded-lg px-2 -ml-2"
                                                                        onClick={() => handleSendMessage(null, p.full)}
                                                                    >
                                                                        <ArrowUpRight size={18} className="text-gray-400 group-hover:text-gray-900 shrink-0 mt-0.5" strokeWidth={2} />
                                                                        <span className="text-[14.5px] text-gray-700 group-hover:text-gray-900">{p.short}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="bg-gray-100 text-gray-900 px-5 py-3 rounded-2xl rounded-tr-sm max-w-[85%] text-[15px] leading-relaxed">
                                                    {msg.content}
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                                
                                {isLoading && (
                                    <div className="flex flex-col items-start w-full">
                                        <div className="flex items-center gap-2 mb-3">
                                            <MessageCircle size={18} className="text-[#8A63D2]" />
                                            <span className="font-bold text-[15px] text-gray-900">Vista</span>
                                        </div>
                                        <div className="flex flex-col gap-2 ml-1 border-l-2 border-gray-100 pl-4">
                                            {loadingSteps.slice(0, loadingStep + 1).map((step, idx) => {
                                                const isCurrent = idx === loadingStep;
                                                return (
                                                    <div key={idx} className={`flex items-center gap-2 ${isCurrent ? 'text-[#8A63D2]' : 'text-gray-400'}`}>
                                                        {isCurrent ? (
                                                            <Loader2 size={16} className="animate-spin" />
                                                        ) : (
                                                            <Check size={16} className="text-black" strokeWidth={3} />
                                                        )}
                                                        <span className={`text-[14px] ${isCurrent ? 'font-medium animate-pulse' : ''}`}>{step}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} className="h-1 shrink-0" />
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="px-5 pb-5 pt-2 bg-white mt-auto z-10 relative">
                        {/* Active Flow Indicator */}
                        {activeFlow && (
                            <div className="flex items-center justify-between bg-purple-50 border border-purple-100 rounded-xl px-4 py-2.5 mb-2">
                                <span className="text-[13px] font-medium text-purple-700">
                                    {(() => { const f = getFlowDefinition(activeFlow.flowId); return f ? `${f.emoji} ${f.name}` : 'Action'; })()} in progress...
                                </span>
                                <button
                                    onClick={cancelFlow}
                                    className="text-[12px] font-medium text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                        <div className="relative border border-gray-200 rounded-3xl overflow-hidden flex flex-col transition-colors focus-within:border-gray-400 hover:border-gray-300">
                            <textarea
                                value={hoveredPrompt ? hoveredPrompt.full : input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask Vista anything..."
                                className="w-full p-4 pb-14 resize-none outline-none text-[15px] placeholder:text-gray-500 bg-transparent min-h-[120px]"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage(e);
                                    }
                                }}
                            />
                            <div className="absolute bottom-3 right-3">
                                {isLoading ? (
                                    <div className="p-2.5 rounded-full bg-gray-50 text-gray-400">
                                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-[#8A63D2] animate-spin" />
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={(!input.trim() && !hoveredPrompt) || isLoading}
                                        className="p-2.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ArrowUp size={20} strokeWidth={2} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <p className="text-center text-[12.5px] text-gray-500 mt-3 font-medium">
                            Vista can make mistakes. Double-check replies.
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
}
