import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  Bot,
  User as UserIcon,
  HelpCircle,
  AlertCircle,
  History,
  Plus,
  Trash2,
  Globe,
  ChevronLeft,
  Download,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  PlusCircle,
  Search,
  Truck,
  Calendar,
  Package,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { aiApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { CitationList } from './CitationList';

const WELCOME_MESSAGES = {
  en: "Hello! I'm **Annadhara AI**, your intelligent platform assistant. I can help you understand food donation processes, find relevant food safety information, discover surplus meals, and automate platform workflows.",
  kn: "ನಮಸ್ಕಾರ! ನಾನು **ಅನ್ನಧಾರ AI**, ನಿಮ್ಮ ಬುದ್ಧಿವಂತ ವೇದಿಕೆ ಸಹಾಯಕ. ಆಹಾರ ದಾನ ಪ್ರಕ್ರಿಯೆಗಳು, ಆಹಾರ ಸುರಕ್ಷತೆ ಮಾರ್ಗಸೂಚಿಗಳು ಮತ್ತು ನಿಮ್ಮ ಖಾತೆಗೆ ಲಭ್ಯವಿರುವ ಮಾಹಿತಿಯನ್ನು ಪಡೆಯಲು ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
  hi: "नमस्ते! मैं **अन्नधारा AI** हूँ, आपका बुद्धिमान प्लेटफ़ॉर्म सहायक। मैं भोजन दान प्रक्रियाओं, खाद्य सुरक्षा दिशानिर्देशों और आपके अन्नधारा खाते की जानकारी प्राप्त करने में आपकी सहायता कर सकता हूँ। आज मैं आपकी क्या मदद करूँ?",
};

const SUGGESTIONS = {
  en: {
    donor: [
      'How can I publish a food donation?',
      'What information should I include in a food listing?',
      'What happens when an NGO reserves my donation?',
      'What are proper hot-holding food temperatures?',
    ],
    recipient: [
      'How do I find available food donations?',
      'How does the 6-character Handover Code work?',
      'Why does an NGO need platform verification?',
      'How to request volunteer transport for a donation?',
    ],
    volunteer: [
      'What should I check before transporting cooked food?',
      'How do I verify a food handover with OTP or QR?',
      'What should I do if a donor pickup fails?',
      'How does the Annadhara pickup workflow operate?',
    ],
    admin: [
      'What are platform food safety compliance standards?',
      'How does the NGO verification review process work?',
      'What are the zero-waste inventory mathematical invariants?',
      'How are handover dispute logs monitored?',
    ],
    member: [
      'What is Annadhara and how does it work?',
      'What are safe food handling guidelines?',
      'How do organizations coordinate surplus food rescue?',
    ],
  },
  kn: {
    donor: [
      'ಆಹಾರ ದಾನವನ್ನು ಹೇಗೆ ಪ್ರಕಟಿಸುವುದು?',
      'ಆಹಾರ ಪಟ್ಟಿಯಲ್ಲಿ ಯಾವ ವಿವರಗಳನ್ನು ಸೇರಿಸಬೇಕು?',
      'ಎನ್‌ಜಿಒ ನನ್ನ ದಾನವನ್ನು ಕಾಯ್ದಿರಿಸಿದಾಗ ಏನಾಗುತ್ತದೆ?',
      'ಬಿಸಿ ಆಹಾರ ಸುರಕ್ಷತಾ ತಾಪಮಾನಗಳು ಯಾವುವು?',
    ],
    recipient: [
      'ಲಭ್ಯವಿರುವ ಆಹಾರ ದಾನಗಳನ್ನು ಹೇಗೆ ಕಂಡುಹಿಡಿಯುವುದು?',
      '6-ಅಕ್ಷರಗಳ ಹಸ್ತಾಂತರ ಕೋಡ್ (Handover Code) ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ?',
      'ಎನ್‌ಜಿಒ ಪರಿಶೀಲನೆ ಏಕೆ ಅಗತ್ಯವಿದೆ?',
      'ಸ್ವಯಂಸೇವಕ ಸಾರಿಗೆಯನ್ನು ಹೇಗೆ ವಿನಂತಿಸುವುದು?',
    ],
    volunteer: [
      'ಬೇಯಿಸಿದ ಆಹಾರವನ್ನು ಸಾಗಿಸುವ ಮೊದಲು ನಾನು ಏನು ಪರಿಶೀಲಿಸಬೇಕು?',
      'OTP ಅಥವಾ QR ಮೂಲಕ ಆಹಾರ ಹಸ್ತಾಂತರವನ್ನು ಹೇಗೆ ದೃಢೀಕರಿಸುವುದು?',
      'ದಾನಿಗಳ ಪಿಕಪ್ ವಿಫಲವಾದರೆ ನಾನು ಏನು ಮಾಡಬೇಕು?',
      'ಅನ್ನಧಾರ ಪಿಕಪ್ ಪ್ರಕ್ರಿಯೆ ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ?',
    ],
    admin: [
      'ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಆಹಾರ ಸುರಕ್ಷತಾ ಮಾನದಂಡಗಳು ಯಾವುವು?',
      'ಎನ್‌ಜಿಒ ಪರಿಶೀಲನೆ ಪ್ರಕ್ರಿಯೆ ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ?',
      'ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಅಂಕಿಅಂಶಗಳ ವಿವರ ನೀಡಿ',
      'ಹಸ್ತಾಂತರ ವಿವಾದ ಲಾಗ್‌ಗಳನ್ನು ಹೇಗೆ ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಲಾಗುತ್ತದೆ?',
    ],
    member: [
      'ಅನ್ನಧಾರ ಎಂದರೇನು ಮತ್ತು ಅದು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ?',
      'ಸುರಕ್ಷಿತ ಆಹಾರ ನಿರ್ವಹಣಾ ಮಾರ್ಗಸೂಚಿಗಳು ಯಾವುವು?',
      'ಹೆಚ್ಚುವರಿ ಆಹಾರ ರಕ್ಷಣೆಯನ್ನು ಸಂಸ್ಥೆಗಳು ಹೇಗೆ ಸಂಘಟಿಸುತ್ತವೆ?',
    ],
  },
  hi: {
    donor: [
      'भोजन दान कैसे प्रकाशित करें?',
      'भोजन सूची में क्या जानकारी शामिल करनी चाहिए?',
      'जब कोई एनजीओ मेरे दान को आरक्षित करता है तो क्या होता है?',
      'भोजन को सुरक्षित रखने के तापमान क्या हैं?',
    ],
    recipient: [
      'उपलब्ध भोजन दान कैसे खोजें?',
      '6-अंकीय हैंडओवर कोड कैसे काम करता है?',
      'एनजीओ को प्लेटफ़ॉर्म सत्यापन की आवश्यकता क्यों है?',
      'भोजन के लिए स्वयंसेवक परिवहन का अनुरोध कैसे करें?',
    ],
    volunteer: [
      'पका हुआ भोजन ले जाने से पहले क्या जांचना चाहिए?',
      'OTP या QR से भोजन हैंडओवर कैसे सत्यापित करें?',
      'यदि डोनर पिकअप विफल हो जाए तो क्या करें?',
      'अन्नधारा पिकअप वर्कफ़्लो कैसे काम करता है?',
    ],
    admin: [
      'खाद्य सुरक्षा अनुपालन मानक क्या हैं?',
      'एनजीओ सत्यापन समीक्षा प्रक्रिया कैसे काम करती है?',
      'प्लेटफ़ॉर्म के वर्तमान आंकड़े क्या हैं?',
      'हैंडओवर विवाद लॉग की निगरानी कैसे की जाती है?',
    ],
    member: [
      'अन्नधारा क्या है और यह कैसे काम करती है?',
      'सुरक्षित खाद्य प्रबंधन के दिशानिर्देश क्या हैं?',
      'संस्थाएं अतिरिक्त भोजन बचाव का समन्वय कैसे करती हैं?',
    ],
  },
};

const FOLLOW_UP_MAP = {
  donor: {
    en: [
      'What are proper hot-holding food temperatures?',
      'How do I approve or decline a reservation?',
    ],
    kn: [
      'ಬಿಸಿ ಆಹಾರ ಸುರಕ್ಷತಾ ತಾಪಮಾನಗಳು ಯಾವುವು?',
      'ಕಾಯ್ದಿರಿಸುವಿಕೆಯನ್ನು ಹೇಗೆ ಅನುಮೋದಿಸುವುದು?',
    ],
    hi: [
      'भोजन को सुरक्षित रखने के तापमान क्या हैं?',
      'आरक्षण को कैसे स्वीकार या अस्वीकार करें?',
    ],
  },
  recipient: {
    en: [
      'How does the 6-character Handover Code work?',
      'How to request volunteer transport for a donation?',
    ],
    kn: [
      '6-ಅಕ್ಷರಗಳ ಹಸ್ತಾಂತರ ಕೋಡ್ ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ?',
      'ಸ್ವಯಂಸೇವಕ ಸಾರಿಗೆಯನ್ನು ಹೇಗೆ ವಿನಂತಿಸುವುದು?',
    ],
    hi: [
      '6-अंकीय हैंडओवर कोड कैसे काम करता है?',
      'स्वयंसेवक परिवहन का अनुरोध कैसे करें?',
    ],
  },
  volunteer: {
    en: [
      'What should I check before transporting cooked food?',
      'How do I verify a food handover with OTP or QR?',
    ],
    kn: [
      'ಬೇಯಿಸಿದ ಆಹಾರವನ್ನು ಸಾಗಿಸುವ ಮೊದಲು ಏನು ಪರಿಶೀಲಿಸಬೇಕು?',
      'OTP ಅಥವಾ QR ಮೂಲಕ ಆಹಾರ ಹಸ್ತಾಂತರ ಹೇಗೆ ದೃಢೀಕರಿಸುವುದು?',
    ],
    hi: [
      'पका हुआ भोजन ले जाने से पहले क्या जांचें?',
      'OTP या QR से भोजन हैंडओवर कैसे सत्यापित करें?',
    ],
  },
  admin: {
    en: [
      'What are platform food safety compliance standards?',
      'What are the zero-waste inventory mathematical invariants?',
    ],
    kn: [
      'ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಆಹಾರ ಸುರಕ್ಷತಾ ಮಾನದಂಡಗಳು ಯಾವುವು?',
      'ಶೂನ್ಯ ತ್ಯಾಜ್ಯ ದಾಸ್ತಾನು ಸೂತ್ರಗಳ ವಿವರಣೆ ನೀಡಿ',
    ],
    hi: [
      'खाद्य सुरक्षा अनुपालन मानक क्या हैं?',
      'शून्य अपव्यय इन्वेंट्री नियम क्या हैं?',
    ],
  },
  member: {
    en: [
      'What are safe food handling guidelines?',
      'How can I publish a food donation?',
    ],
    kn: [
      'ಸುರಕ್ಷಿತ ಆಹಾರ ನಿರ್ವಹಣಾ ಮಾರ್ಗಸೂಚಿಗಳು ಯಾವುವು?',
      'ಆಹಾರ ದಾನವನ್ನು ಹೇಗೆ ಪ್ರಕಟಿಸುವುದು?',
    ],
    hi: [
      'सुरक्षित खाद्य प्रबंधन के दिशानिर्देश क्या हैं?',
      'भोजन दान कैसे प्रकाशित करें?',
    ],
  },
};

export const ChatWindow = ({ onClose }) => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [language, setLanguage] = useState('en');
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [conversationsList, setConversationsList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [messages, setMessages] = useState(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content: WELCOME_MESSAGES.en,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  const [copiedId, setCopiedId] = useState(null);
  const [feedbackState, setFeedbackState] = useState({});
  const [feedbackToast, setFeedbackToast] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Free-tier cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const roleNormalized = (role || user?.role || 'member').toLowerCase();

  // Load user conversation list
  const loadConversationsList = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await aiApi.getConversations(roleNormalized.toUpperCase());
      if (res.data?.success && Array.isArray(res.data.data)) {
        setConversationsList(res.data.data);
      }
    } catch (err) {
      console.warn('[ChatWindow] Failed to load conversation history:', err.message);
    } finally {
      setLoadingHistory(false);
    }
  }, [roleNormalized]);

  useEffect(() => {
    if (showHistory) {
      loadConversationsList();
    }
  }, [showHistory, loadConversationsList]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!showHistory) {
      scrollToBottom();
    }
  }, [messages, loading, showHistory]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [showHistory]);

  // Language switch handler
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    // If only welcome message is present, localize it immediately
    if (messages.length === 1 && messages[0].id === 'welcome') {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: WELCOME_MESSAGES[newLang] || WELCOME_MESSAGES.en,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  // Start new conversation
  const handleStartNewChat = () => {
    setActiveConversationId(null);
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: WELCOME_MESSAGES[language] || WELCOME_MESSAGES.en,
        timestamp: new Date().toISOString(),
      },
    ]);
    setError(null);
    setShowHistory(false);
    setShowClearConfirm(false);
  };

  // Select an existing conversation
  const handleSelectConversation = async (convId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await aiApi.getConversationById(convId, roleNormalized.toUpperCase());
      if (res.data?.success && res.data?.data) {
        const conv = res.data.data;
        setActiveConversationId(conv.id);
        if (conv.language) {
          setLanguage(conv.language);
        }

        const loadedMsgs = (conv.messages || []).map((m, idx) => ({
          id: m._id || `msg_${idx}`,
          role: m.role,
          content: m.content,
          intent: m.intent,
          citations: m.citations || [],
          actions: m.actions || [],
          feedback: m.feedback?.rating || null,
          timestamp: m.timestamp || new Date().toISOString(),
        }));

        if (loadedMsgs.length === 0) {
          setMessages([
            {
              id: 'welcome',
              role: 'assistant',
              content: WELCOME_MESSAGES[conv.language || 'en'],
              timestamp: new Date().toISOString(),
            },
          ]);
        } else {
          setMessages(loadedMsgs);
        }
        setShowHistory(false);
      }
    } catch (err) {
      setError('Failed to load selected conversation.');
    } finally {
      setLoading(false);
    }
  };

  // Delete a conversation
  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    try {
      await aiApi.deleteConversation(convId, roleNormalized.toUpperCase());
      setConversationsList((prev) => prev.filter((c) => c.id !== convId));
      if (activeConversationId === convId) {
        handleStartNewChat();
      }
    } catch (err) {
      console.warn('[ChatWindow] Failed to delete conversation:', err.message);
    }
  };

  // Clear current active conversation messages
  const handleClearConversation = async () => {
    if (activeConversationId) {
      try {
        await aiApi.clearConversation(activeConversationId, roleNormalized.toUpperCase());
      } catch (err) {
        console.warn('[ChatWindow] Failed to clear messages on backend:', err.message);
      }
    }

    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: WELCOME_MESSAGES[language] || WELCOME_MESSAGES.en,
        timestamp: new Date().toISOString(),
      },
    ]);
    setShowClearConfirm(false);
  };

  // Export current conversation transcript as markdown file
  const handleExportConversation = () => {
    if (messages.length <= 1) return;

    const title = `Annadhara-AI-Transcript-${new Date().toISOString().slice(0, 10)}.md`;
    let transcript = `# Annadhara AI Assistant — Conversation Transcript\n\n`;
    transcript += `**Role:** ${roleNormalized.toUpperCase()}  \n`;
    transcript += `**Language:** ${language.toUpperCase()}  \n`;
    transcript += `**Export Date:** ${new Date().toLocaleString()}  \n\n`;
    transcript += `---\n\n`;

    messages.forEach((m) => {
      if (m.id === 'welcome' && messages.length > 1) return;
      const sender = m.role === 'user' ? '👤 User' : '🌿 Annadhara AI';
      const timeStr = new Date(m.timestamp).toLocaleTimeString();
      transcript += `### ${sender} (${timeStr})\n\n`;
      transcript += `${m.content}\n\n`;

      if (m.citations && m.citations.length > 0) {
        transcript += `**Verified Regulatory Citations:**\n`;
        m.citations.forEach((c) => {
          transcript += `- [${c.title || c.domain}](${c.url}) (${c.isOfficial ? 'Official Regulatory Source' : 'Reference'})\n`;
        });
        transcript += `\n`;
      }

      if (m.actions && m.actions.length > 0) {
        transcript += `**Recommended Next Actions:**\n`;
        m.actions.forEach((a) => {
          transcript += `- ${a.label} (${a.path})\n`;
        });
        transcript += `\n`;
      }
    });

    const blob = new Blob([transcript], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy individual message text to clipboard
  const handleCopyMessage = (msgId, content) => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Feedback handler (helpful / unhelpful)
  const handleFeedback = async (msgId, rating) => {
    setFeedbackState((prev) => ({ ...prev, [msgId]: rating }));
    setFeedbackToast(
      rating === 'helpful'
        ? '🌿 Thank you for your positive feedback!'
        : 'Feedback noted. We will work to improve future responses!'
    );
    setTimeout(() => setFeedbackToast(null), 3000);

    try {
      await aiApi.submitFeedback(
        {
          conversationId: activeConversationId,
          messageId: msgId.startsWith('msg_') || msgId.startsWith('ai_') ? null : msgId,
          rating,
        },
        roleNormalized.toUpperCase()
      );
    } catch (err) {
      console.warn('[ChatWindow] Feedback recording failed:', err.message);
    }
  };

  // Action button click handler
  const handleActionClick = (action) => {
    if (action.path) {
      navigate(action.path);
    }
  };

  const handleSend = async (messageText = null) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || loading || cooldown > 0) return;

    setError(null);
    setInput('');

    const userMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Free-tier optimization: 4 turns max history
      const history = updatedMessages
        .filter((m) => m.id !== 'welcome')
        .slice(-4)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await aiApi.chat(
        {
          message: textToSend,
          conversationId: activeConversationId,
          language,
          role: roleNormalized.toUpperCase(),
          conversationHistory: history,
        },
        roleNormalized.toUpperCase()
      );

      if (res.data?.success && res.data?.data) {
        const respData = res.data.data;
        if (respData.conversationId && !activeConversationId) {
          setActiveConversationId(respData.conversationId);
        }
        if (respData.language && respData.language !== language) {
          setLanguage(respData.language);
        }

        const aiResponse = {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: respData.message,
          model: respData.model,
          intent: respData.intent,
          citations: respData.citations || [],
          actions: respData.actions || [],
          timestamp: respData.timestamp || new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiResponse]);
      } else {
        throw new Error(res.data?.message || 'Failed to receive a response from Annadhara AI');
      }
    } catch (err) {
      console.error('[ChatWindow Error]:', err);
      const is429 = err.response?.status === 429 || err.response?.data?.isRateLimited;
      if (is429) {
        const retrySec = err.response?.data?.retryAfter || 20;
        setCooldown(retrySec);
        setError(
          err.response?.data?.message ||
          `🌿 Annadhara AI free-tier limit reached. Please wait ${retrySec} seconds before sending another message.`
        );
      } else {
        const errorMsg =
          err.response?.data?.message ||
          err.message ||
          'Unable to connect to Annadhara AI service. Please try again.';
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderActionIcon = (iconName) => {
    switch (iconName) {
      case 'PlusCircle':
        return <PlusCircle className="w-3.5 h-3.5" />;
      case 'Search':
        return <Search className="w-3.5 h-3.5" />;
      case 'Truck':
        return <Truck className="w-3.5 h-3.5" />;
      case 'Calendar':
        return <Calendar className="w-3.5 h-3.5" />;
      case 'Package':
        return <Package className="w-3.5 h-3.5" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-3.5 h-3.5" />;
      default:
        return <ExternalLink className="w-3.5 h-3.5" />;
    }
  };

  const renderFormattedContent = (content) => {
    if (!content) return null;
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
      const cleanLine = isBullet ? line.trim().substring(2) : line;

      const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
      const renderedParts = parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="font-bold text-[#26332D]">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={idx} className="flex items-start space-x-2 my-1 pl-1">
            <span className="text-[#2E7D5B] font-bold text-xs mt-1">•</span>
            <span className="flex-1 text-xs leading-relaxed text-[#26332D]">{renderedParts}</span>
          </div>
        );
      }

      return (
        <p key={idx} className="text-xs leading-relaxed text-[#26332D] my-1">
          {renderedParts}
        </p>
      );
    });
  };

  const currentSuggestions =
    SUGGESTIONS[language]?.[roleNormalized] ||
    SUGGESTIONS.en[roleNormalized] ||
    SUGGESTIONS.en.member;

  const currentFollowUps =
    FOLLOW_UP_MAP[roleNormalized]?.[language] ||
    FOLLOW_UP_MAP[roleNormalized]?.en ||
    FOLLOW_UP_MAP.member.en;

  return (
    <div className="fixed bottom-20 right-4 sm:right-6 w-[94vw] sm:w-[440px] max-h-[84vh] h-[630px] bg-white rounded-2xl shadow-2xl border border-[#E3EAE5] z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#205B43] to-[#2E7D5B] px-4 py-3 text-white flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-emerald-200" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="font-extrabold text-sm tracking-tight leading-none">Annadhara AI</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            </div>
            <p className="text-[10px] text-emerald-100 font-medium leading-none mt-1">
              Role: <span className="uppercase font-bold tracking-wider">{roleNormalized}</span>
            </p>
          </div>
        </div>

        {/* Controls: Language, History, Export, Clear, New Chat, Close */}
        <div className="flex items-center space-x-1">
          {/* Language Selector */}
          <div className="flex items-center bg-black/20 rounded-lg p-0.5 text-[10px] font-bold text-emerald-100">
            <button
              type="button"
              onClick={() => handleLanguageChange('en')}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                language === 'en' ? 'bg-white text-[#205B43]' : 'hover:text-white'
              }`}
              title="English"
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('kn')}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                language === 'kn' ? 'bg-white text-[#205B43]' : 'hover:text-white'
              }`}
              title="Kannada (ಕನ್ನಡ)"
            >
              ಕನ್ನ
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('hi')}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                language === 'hi' ? 'bg-white text-[#205B43]' : 'hover:text-white'
              }`}
              title="Hindi (हिन्दी)"
            >
              हिन्दी
            </button>
          </div>

          {/* Export Chat */}
          {messages.length > 1 && (
            <button
              type="button"
              onClick={handleExportConversation}
              title="Export Conversation"
              className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {/* Clear Chat */}
          {messages.length > 1 && (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              title="Clear Conversation"
              className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowHistory((prev) => !prev)}
            title="Conversation History"
            className={`p-1.5 rounded-lg transition-colors ${
              showHistory
                ? 'bg-white/25 text-white'
                : 'text-emerald-100 hover:text-white hover:bg-white/10'
            }`}
          >
            <History className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleStartNewChat}
            title="Start New Conversation"
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            title="Close Assistant"
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Clear Confirmation Modal Bar */}
      {showClearConfirm && (
        <div className="bg-amber-50 px-3 py-2 border-b border-amber-200 flex items-center justify-between text-xs text-amber-900 animate-in fade-in">
          <span>Clear conversation messages?</span>
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={handleClearConversation}
              className="px-2 py-0.5 rounded bg-amber-600 text-white font-bold text-[11px] hover:bg-amber-700"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setShowClearConfirm(false)}
              className="px-2 py-0.5 rounded bg-gray-200 text-gray-700 font-bold text-[11px] hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Subtle Feedback Toast Banner */}
      {feedbackToast && (
        <div className="bg-[#EAF4EE] text-[#205B43] px-3 py-1.5 text-[11px] font-bold text-center border-b border-[#2E7D5B]/20 animate-in fade-in">
          {feedbackToast}
        </div>
      )}

      {/* Main Body: Either History Drawer OR Message Flow */}
      {showHistory ? (
        <div className="flex-1 overflow-y-auto p-4 bg-[#F8FAF8] flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E3EAE5]">
              <div className="flex items-center space-x-1.5">
                <History className="w-4 h-4 text-[#2E7D5B]" />
                <h4 className="text-xs font-bold text-[#26332D]">Saved Conversations</h4>
              </div>
              <button
                type="button"
                onClick={handleStartNewChat}
                className="flex items-center space-x-1 text-[11px] font-bold text-[#2E7D5B] hover:text-[#205B43] bg-[#EAF4EE] px-2 py-1 rounded-lg transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>New Chat</span>
              </button>
            </div>

            {loadingHistory ? (
              <div className="text-center py-8 text-xs text-[#718078]">Loading conversations...</div>
            ) : conversationsList.length === 0 ? (
              <div className="text-center py-8 px-4 text-xs text-[#718078] bg-white rounded-xl border border-[#E3EAE5]">
                <p className="font-semibold text-[#26332D]">No saved conversations yet</p>
                <p className="mt-1 text-[11px]">Your chat history will be automatically saved here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversationsList.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                      activeConversationId === conv.id
                        ? 'bg-[#EAF4EE] border-[#2E7D5B] shadow-sm'
                        : 'bg-white border-[#E3EAE5] hover:border-[#2E7D5B]/40'
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-xs font-bold text-[#26332D] truncate">{conv.title}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-gray-100 text-[#718078]">
                          {conv.language || 'en'}
                        </span>
                        <span className="text-[10px] text-[#718078]">
                          {new Date(conv.updatedAt || conv.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteConversation(e, conv.id)}
                      className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowHistory(false)}
            className="w-full mt-4 py-2 px-3 rounded-xl bg-white border border-[#E3EAE5] text-xs font-bold text-[#26332D] hover:bg-gray-50 flex items-center justify-center space-x-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Active Chat</span>
          </button>
        </div>
      ) : (
        /* Messages Scroll Area */
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#F8FAF8]">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-2 ${
                  isUser ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-sm ${
                    isUser
                      ? 'bg-[#2E7D5B] text-white'
                      : 'bg-[#EAF4EE] text-[#205B43] border border-[#2E7D5B]/20'
                  }`}
                >
                  {isUser ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl p-3 shadow-xs ${
                    isUser
                      ? 'bg-[#2E7D5B] text-white rounded-tr-none'
                      : 'bg-white text-[#26332D] border border-[#E3EAE5] rounded-tl-none'
                  }`}
                >
                  {isUser ? (
                    <p className="text-xs leading-relaxed font-medium">{msg.content}</p>
                  ) : (
                    <div>
                      {renderFormattedContent(msg.content)}
                      <CitationList citations={msg.citations} />

                      {/* Interactive Suggested Actions */}
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-[#E3EAE5] flex flex-wrap gap-1.5">
                          {msg.actions.map((action, aIdx) => (
                            <button
                              key={aIdx}
                              type="button"
                              onClick={() => handleActionClick(action)}
                              className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#EAF4EE] text-[#205B43] hover:bg-[#205B43] hover:text-white transition-all shadow-xs group border border-[#2E7D5B]/30"
                              title={`Navigate to ${action.label}`}
                            >
                              {renderActionIcon(action.icon)}
                              <span>{action.label}</span>
                              <ArrowRight className="w-3 h-3 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Action Footer: Copy, Feedback & Timestamp */}
                  {!isUser && msg.id !== 'welcome' ? (
                    <div className="mt-2 pt-1.5 flex items-center justify-between text-[10px] text-[#718078] border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        {/* Copy button */}
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className="p-1 rounded-sm hover:text-[#205B43] hover:bg-gray-100 transition-colors flex items-center space-x-1"
                          title="Copy message to clipboard"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-[#2E7D5B]" />
                              <span className="text-[9px] text-[#2E7D5B] font-semibold">Copied!</span>
                            </>
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>

                        {/* Thumbs up */}
                        <button
                          type="button"
                          onClick={() => handleFeedback(msg.id, 'helpful')}
                          className={`p-1 rounded-sm transition-colors ${
                            feedbackState[msg.id] === 'helpful' || msg.feedback === 'helpful'
                              ? 'text-[#2E7D5B] font-bold bg-[#EAF4EE]'
                              : 'hover:text-[#205B43] hover:bg-gray-100'
                          }`}
                          title="Helpful response"
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </button>

                        {/* Thumbs down */}
                        <button
                          type="button"
                          onClick={() => handleFeedback(msg.id, 'unhelpful')}
                          className={`p-1 rounded-sm transition-colors ${
                            feedbackState[msg.id] === 'unhelpful' || msg.feedback === 'unhelpful'
                              ? 'text-[#D9534F] font-bold bg-red-50'
                              : 'hover:text-[#D9534F] hover:bg-gray-100'
                          }`}
                          title="Not helpful response"
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-[9px] font-semibold text-[#718078]">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`mt-1.5 text-[9px] font-semibold text-right ${
                        isUser ? 'text-emerald-100' : 'text-[#718078]'
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex items-start space-x-2">
              <div className="w-7 h-7 rounded-xl bg-[#EAF4EE] text-[#205B43] border border-[#2E7D5B]/20 flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-white border border-[#E3EAE5] rounded-2xl rounded-tl-none px-4 py-2.5 shadow-sm flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2E7D5B] animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[#2E7D5B] animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-[#2E7D5B] animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          {/* Dynamic Follow-up Prompt Chips */}
          {messages.length > 1 && !loading && (
            <div className="pt-1">
              <div className="flex items-center space-x-1.5 text-[10px] font-bold text-[#718078] mb-1.5 px-1">
                <Sparkles className="w-3 h-3 text-[#2E7D5B]" />
                <span>
                  {language === 'kn'
                    ? 'ಸಂಬಂಧಿತ ಮುಂದಿನ ಪ್ರಶ್ನೆಗಳು:'
                    : language === 'hi'
                    ? 'संबंधित अगले प्रश्न:'
                    : 'Suggested follow-up questions:'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {currentFollowUps.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(q)}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white border border-[#E3EAE5] text-[#26332D] hover:bg-[#EAF4EE] hover:text-[#205B43] hover:border-[#2E7D5B]/40 transition-colors shadow-2xs inline-flex items-center space-x-1"
                  >
                    <span>{q}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error Banner with Free-Tier Cooldown handling */}
          {error && (
            <div
              className={`p-3 rounded-xl ${
                cooldown > 0
                  ? 'bg-amber-50 border border-amber-200 text-amber-900'
                  : 'bg-red-50 border border-red-200 text-[#D9534F]'
              } text-xs flex items-start space-x-2`}
            >
              <AlertCircle
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  cooldown > 0 ? 'text-amber-600' : 'text-[#D9534F]'
                }`}
              />
              <div className="flex-1">
                <p className="font-semibold">{error}</p>
                {cooldown > 0 && (
                  <p className="text-[11px] mt-1 text-amber-700 font-medium">
                    ⏳ Free-tier cooldown active: You can send your next message in{' '}
                    <strong>{cooldown}s</strong>.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Suggested Questions Chips (shown if only welcome message) */}
          {messages.length === 1 && (
            <div className="pt-2">
              <div className="flex items-center space-x-1.5 text-[11px] font-bold text-[#718078] mb-2 px-1">
                <HelpCircle className="w-3.5 h-3.5 text-[#2E7D5B]" />
                <span>
                  {language === 'kn'
                    ? `ನಿಮ್ಮ ಪಾತ್ರಕ್ಕಾಗಿ ಸಲಹೆಗಳು (${roleNormalized}):`
                    : language === 'hi'
                    ? `आपकी भूमिका के लिए सुझाव (${roleNormalized}):`
                    : `Suggested for your role (${roleNormalized}):`}
                </span>
              </div>
              <div className="flex flex-col space-y-1.5">
                {currentSuggestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(q)}
                    className="text-left px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-[#E3EAE5] text-[#26332D] hover:bg-[#EAF4EE] hover:text-[#205B43] hover:border-[#2E7D5B]/40 transition-colors shadow-2xs"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input Bar */}
      <div className="p-3 bg-white border-t border-[#E3EAE5]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              language === 'kn'
                ? 'ಅನ್ನಧಾರ AI ಯೊಂದಿಗೆ ಸಂಭಾಷಿಸಿ...'
                : language === 'hi'
                ? 'अन्नधारा AI से कुछ भी पूछें...'
                : 'Ask Annadhara AI anything...'
            }
            disabled={loading || cooldown > 0}
            maxLength={2000}
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E3EAE5] text-xs text-[#26332D] placeholder-[#718078] focus:outline-hidden focus:border-[#2E7D5B] focus:ring-1 focus:ring-[#2E7D5B] bg-[#F8FAF8] disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={loading || cooldown > 0 || !input.trim()}
            className="w-10 h-10 rounded-xl bg-[#2E7D5B] text-white flex items-center justify-center hover:bg-[#205B43] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-colors shrink-0"
            title={cooldown > 0 ? `Wait ${cooldown}s` : 'Send message'}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] text-[#718078] text-center mt-2 leading-none">
          Annadhara AI • Multilingual & Platform Intelligence • Groq
        </p>
      </div>
    </div>
  );
};
