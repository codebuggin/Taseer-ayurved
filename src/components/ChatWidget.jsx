import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import OpenAI from 'openai';
import { supabase } from '../lib/supabase';
import { Sparkles, X, Send, RefreshCw, Mic, MicOff, Loader2, Radio, PhoneOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Language rules appended to both prompts ─────────────────────────────────
const LANGUAGE_RULES = `
CRITICAL LANGUAGE RULE:
You MUST detect what language the user is speaking and ALWAYS reply in that SAME language.
Supported languages: Hindi, English, Telugu, Gujarati, Tamil, Kannada, Marathi, Urdu, Bengali, Malayalam, Punjabi.
NEVER reply in a different language than what the user spoke.
If user speaks Telugu, reply ONLY in Telugu. If Gujarati, reply ONLY in Gujarati. This is mandatory.`;

// ─── Base system prompt (products injected dynamically) ───────────────────────
const BASE_PROMPT = `You are Hakeem, the official AI assistant for Taseer Ayurved — an Ayurvedic medicine brand founded by Vaid Ali Shaikh, based in Ahmedabad, Gujarat with 20+ years of experience and 12,000+ patients treated.

PERSONALITY:
- Sound like a warm, knowledgeable friend — NOT robotic, NOT formal
- Use natural conversational Hindi or English based on what the user speaks
- Add warmth: "Bilkul!", "Zaroor!", "Acha!", "Haan ji!"
- Be empathetic about health concerns
- Keep responses short — max 3-4 lines

BUSINESS INFO:
- Brand: Taseer Ayurved | Founder: Vaid Ali Shaikh
- Address: 68/30, Nagpur Vora Ki Chawl, Opp. Jhulta Minara, Gomtipur, Ahmedabad - 380021
- Phone: +91 7405410856 | All India courier, discreet packaging

CORRECT WEBSITE PAGES:
- Home page → main landing page
- Formulations → /shop — where ALL products are listed
- About → about Vaid Ali Shaikh
- Testimonials → patient success stories
- Contact → contact form
- Cart icon → top right in navbar
- Checkout → after adding to cart
- My Orders → /my-orders — track your orders
- Book Consultation button → gold button in the navbar

FLOWS:

1. SYMPTOMS → PRODUCT:
   Ask symptoms → recommend product → then say:
   "Aap hamare Formulations page /shop par ja kar yeh product dekh sakte hain aur seedha cart mein add kar sakte hain! Bahut aasaan hai."
   Guide: Home → /shop → Add to Cart → Checkout → COD → Order!

2. PRODUCT QUESTION:
   Answer the question then say:
   "Isko Formulations page /shop par dekh sakte hain, wahan poori details aur image bhi hai!"

3. BOOK CONSULTATION:
   Say: "Bilkul! Navbar mein upar 'Book Consultation' ka gold button hai — wahan click karein! Ek simple form fill karein aur hamare hakeem aapko call karenge."
   Also ask for name + phone as backup.

4. PLACE ORDER:
   Guide step by step:
   "Zaroor! Order karna bilkul aasaan hai:
   1️⃣ Formulations page /shop par jaiye
   2️⃣ Apna product dhundhiye
   3️⃣ 'Add to Cart' dabaye
   4️⃣ Cart icon par click karein (upar right mein)
   5️⃣ Checkout karein
   6️⃣ Cash on Delivery chuniye
   7️⃣ Order place karein!
   Delivery poore India mein hoti hai aur packaging bilkul discreet hoti hai."

5. ORDER TRACKING:
   "Apne orders track karne ke liye 'My Orders' page /my-orders par jaiye — login karke sab orders dikhe ge!"

6. CONTACT:
   "Seedha baat karni ho toh: 📞 +91 7405410856 par call/WhatsApp karein, ya Contact page par form fill karein!"

ALWAYS end with: "Kuch aur madad chahiye? Main hamesha yahan hoon! 😊"
- Always recommend consulting Vaid Ali Shaikh for serious conditions
- Never make false medical claims`;

// Builds the full system prompt with live product list from Supabase
function buildSystemPrompt(products) {
  const productList = products.length > 0
    ? products.map(p => `- ${p.name} (${p.category}) → ₹${p.price} → ${p.benefit}`).join('\n')
    : '(Products loading — advise user to check /shop for full catalog)';

  return `${BASE_PROMPT}

CURRENT PRODUCTS AVAILABLE:
${productList}

Always use these exact product names and current prices.
If asked about a product not in this list, say it is not currently available.
${LANGUAGE_RULES}`;
}

// ─── Condensed instructions for Realtime API voice session ───────────────────
const REALTIME_INSTRUCTIONS = `You are Hakeem, a warm and friendly AI assistant for Taseer Ayurved. Speak naturally like a real person — NOT robotic. Be warm, caring, helpful. Sound like a knowledgeable friend, not a machine.

Business: Taseer Ayurved by Vaid Ali Shaikh | Phone: +91 7405410856 | All products: ₹3600

Website pages:
- Formulations page → all products (go to /shop)
- Book Consultation → gold button in navbar
- Cart → cart icon top right
- My Orders → /my-orders to track orders

Guide users to Formulations page to browse, Book Consultation to consult, Cart → Checkout to place order.
Be warm, use "Bilkul!", "Zaroor!", "Acha!". Always end with "Kuch aur madad chahiye? 😊"
${LANGUAGE_RULES}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const INITIAL_QUICK_REPLIES = [
  "🌿 I have a health problem",
  "💊 Tell me about a product",
  "📞 I want to consult Hakeem",
  "🛒 I want to place an order"
];

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: 'Assalamu alaikum! Welcome to Taseer Ayurved. I am Hakeem AI. How may I help you today? 😊'
};

function MessageContent({ content, onClose }) {
  const parts = content.split(/(\/(?:shop|my-orders|about|contact|checkout)(?:\/[^\s,!?]*)?)/g);
  return (
    <p className="whitespace-pre-wrap leading-relaxed">
      {parts.map((part, i) =>
        /^\/(shop|my-orders|about|contact|checkout)/.test(part) ? (
          <Link key={i} to={part} onClick={onClose}
            className="underline font-semibold text-emerald-700 hover:text-emerald-900">
            {part}
          </Link>
        ) : part
      )}
    </p>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Voice mode state
  const [products, setProducts] = useState([]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isVoiceConnecting, setIsVoiceConnecting] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('idle'); // 'idle' | 'listening' | 'thinking' | 'speaking'

  const [hasVisited] = useState(() => localStorage.getItem('hakeem_chat_visited') === 'true');
  const [unreadBadge, setUnreadBadge] = useState(!localStorage.getItem('hakeem_chat_visited'));
  const [showTooltip, setShowTooltip] = useState(false);

  const messagesEndRef = useRef(null);
  const productsRef = useRef([]); // ref so async voice session always gets current list
  const mediaRecorderRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const audioElementRef = useRef(null);
  const currentResponseIdRef = useRef(null);

  const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (hasVisited || isOpen) return;
    const t1 = setTimeout(() => setShowTooltip(true), 3000);
    const t2 = setTimeout(() => setShowTooltip(false), 8000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [hasVisited, isOpen]);

  // Fetch products from Supabase each time chat opens
  useEffect(() => {
    if (!isOpen) return;
    supabase
      .from('products')
      .select('name, category, price, benefit, description')
      .order('name')
      .then(({ data }) => {
        if (data) {
          setProducts(data);
          productsRef.current = data; // keep ref in sync for async voice session
        }
      });
  }, [isOpen]);

  // Clean up voice session when chat closes
  useEffect(() => {
    if (!isOpen && isVoiceActive) stopVoiceMode();
  }, [isOpen]);

  const toggleChat = () => {
    if (!isOpen) {
      setUnreadBadge(false);
      setShowTooltip(false);
      if (!hasVisited) localStorage.setItem('hakeem_chat_visited', 'true');
    }
    setIsOpen(prev => !prev);
  };

  // ─── Voice mode (OpenAI Realtime API via WebRTC) ───────────────────────────

  const updateLastAIMessage = (delta, responseId) => {
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (currentResponseIdRef.current === responseId && last?.role === 'assistant') {
        return [...prev.slice(0, -1), { ...last, content: last.content + delta }];
      }
      currentResponseIdRef.current = responseId;
      return [...prev, { role: 'assistant', content: delta }];
    });
  };

  const addUserVoiceMessage = (transcript) => {
    if (!transcript?.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: transcript }]);
  };

  const startVoiceMode = async () => {
    if (!window.RTCPeerConnection) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Voice mode needs Chrome or Edge browser. Please use text chat instead.'
      }]);
      return;
    }

    setIsVoiceConnecting(true);

    try {
      // 1. Get ephemeral key from OpenAI
      const sessionResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-realtime-preview-2024-12-17',
          voice: 'shimmer'
        })
      });
      const sessionData = await sessionResponse.json();
      const ephemeralKey = sessionData.client_secret?.value;

      if (!ephemeralKey) throw new Error('Failed to get ephemeral key');

      // 2. Setup WebRTC
      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;

      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      document.body.appendChild(audioEl);
      audioElementRef.current = audioEl;

      pc.ontrack = (e) => { audioEl.srcObject = e.streams[0]; };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      pc.addTrack(stream.getTracks()[0]);

      const dc = pc.createDataChannel('oai-events');
      dataChannelRef.current = dc;

      dc.onopen = () => {
        setIsVoiceConnecting(false);
        setIsVoiceActive(true);
        setVoiceStatus('idle');

        const productContext = productsRef.current.length > 0
          ? productsRef.current.map(p =>
              `• ${p.name} | Category: ${p.category} | Price: ₹${p.price} | ${p.benefit}`
            ).join('\n')
          : '(Check /shop for full product catalog)';

        dc.send(JSON.stringify({
          type: 'session.update',
          session: {
            instructions: `${REALTIME_INSTRUCTIONS}

CURRENT PRODUCTS (live from database):
${productContext}

Always use these exact product names and prices. If a product is not in this list, say it is not currently available. New products are added regularly so always refer to this list.`,
            voice: 'shimmer',
            input_audio_transcription: { model: 'whisper-1' },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              silence_duration_ms: 700
            }
          }
        }));
      };

      dc.onmessage = (e) => {
        const event = JSON.parse(e.data);

        if (event.type === 'input_audio_buffer.speech_started') {
          setVoiceStatus('listening');
        }
        if (event.type === 'input_audio_buffer.speech_stopped') {
          setVoiceStatus('thinking');
        }
        if (event.type === 'response.audio.delta') {
          setVoiceStatus('speaking');
        }
        if (event.type === 'response.audio_transcript.delta') {
          updateLastAIMessage(event.delta, event.response_id);
        }
        if (event.type === 'conversation.item.input_audio_transcription.completed') {
          addUserVoiceMessage(event.transcript);
        }
        if (event.type === 'response.done') {
          setVoiceStatus('idle');
          currentResponseIdRef.current = null;
        }
      };

      dc.onerror = (err) => { console.error('DataChannel error:', err); };

      // 3. SDP handshake
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpRes = await fetch(
        'https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ephemeralKey}`,
            'Content-Type': 'application/sdp'
          },
          body: offer.sdp
        }
      );

      const answer = { type: 'answer', sdp: await sdpRes.text() };
      await pc.setRemoteDescription(answer);

    } catch (err) {
      console.error('Voice mode error:', err);
      setIsVoiceConnecting(false);
      if (err.name === 'NotAllowedError') {
        alert('Microphone access denied. Please allow microphone permission in your browser settings.');
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Could not start voice mode. Please check your microphone and try again.'
        }]);
      }
    }
  };

  const stopVoiceMode = () => {
    peerConnectionRef.current?.close();
    audioElementRef.current?.remove();
    peerConnectionRef.current = null;
    dataChannelRef.current = null;
    audioElementRef.current = null;
    currentResponseIdRef.current = null;
    setIsVoiceActive(false);
    setIsVoiceConnecting(false);
    setVoiceStatus('idle');
  };

  // ─── Whisper mic (text mode voice input) ──────────────────────────────────

  const transcribeAudio = async (audioBlob) => {
    setIsTranscribing(true);
    setIsRecording(false);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}` },
        body: formData
      });
      const data = await res.json();
      if (data.text) await sendMessage(data.text);
    } catch (err) {
      console.error('Whisper error:', err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        await transcribeAudio(new Blob(chunks, { type: 'audio/webm' }));
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setTimeout(() => { if (recorder.state === 'recording') recorder.stop(); }, 10000);
      setIsRecording(true);
      mediaRecorderRef.current = recorder;
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        alert('Microphone access denied. Please allow microphone permission in your browser settings and try again.');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
  };

  // ─── Text chat ─────────────────────────────────────────────────────────────

  const handleSendSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');
    sendMessage(text);
  };

  const resetChat = () => {
    if (isVoiceActive) stopVoiceMode();
    setMessages([INITIAL_MESSAGE]);
    setInput('');
    setIsTyping(false);
  };

  const sendMessage = async (text) => {
    if (!text || isTyping) return;

    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      if (!import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY === 'your_key_here') {
        throw new Error('API key not configured');
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: buildSystemPrompt(products) },
          ...messages,
          userMessage
        ],
        temperature: 0.7,
        max_tokens: 150,
      });

      const content = response.choices[0].message.content.trim();
      setMessages(prev => [...prev, { role: 'assistant', content }]);

    } catch (error) {
      console.error('Chat API Error:', error);
      const errorMsg = error.message === 'API key not configured'
        ? 'System configuration pending: Please add your OpenAI API key to the .env file.'
        : 'Sorry, I am facing a connection issue right now. Please call us directly at +91 7405410856.';
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
    } finally {
      setIsTyping(false);
    }
  };

  // ─── Voice status label ────────────────────────────────────────────────────
  const voiceStatusLabel = {
    idle: 'Ready — start speaking',
    listening: 'Listening...',
    thinking: 'Thinking...',
    speaking: 'Speaking...'
  }[voiceStatus];

  const voiceStatusColor = {
    idle: 'bg-emerald-400',
    listening: 'bg-emerald-400 animate-pulse',
    thinking: 'bg-yellow-400 animate-pulse',
    speaking: 'bg-blue-400 animate-pulse'
  }[voiceStatus];

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white w-[380px] h-[560px] max-h-[85vh] mb-4 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-theme/20"
            style={{ maxWidth: 'calc(100vw - 32px)' }}
          >
            {/* ── Header ── */}
            <div className="bg-[#0d5c3a] text-white p-4 flex justify-between items-center relative overflow-hidden shrink-0">
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] mix-blend-overlay" />

              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border border-white/30 backdrop-blur-sm">
                  <Sparkles size={20} className="text-yellow-300" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-[18px] leading-none mb-1">Hakeem AI</h3>
                  <p className="font-body text-[11px] text-emerald-100 uppercase tracking-widest font-semibold">Taseer Ayurved</p>
                </div>
              </div>

              <div className="relative z-10 flex items-center gap-2">
                {/* Voice Mode toggle */}
                {isVoiceActive ? (
                  <button
                    onClick={stopVoiceMode}
                    title="End Voice Mode"
                    className="flex items-center gap-1.5 px-3 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white text-[12px] font-semibold transition-colors"
                  >
                    <PhoneOff size={13} />
                    End Voice
                  </button>
                ) : (
                  <button
                    onClick={startVoiceMode}
                    disabled={isVoiceConnecting}
                    title="Start Voice Mode"
                    className="flex items-center gap-1.5 px-3 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white text-[12px] font-semibold transition-colors disabled:opacity-60"
                  >
                    {isVoiceConnecting
                      ? <Loader2 size={13} className="animate-spin" />
                      : <Radio size={13} />}
                    {isVoiceConnecting ? 'Connecting...' : '🎤 Voice Mode'}
                  </button>
                )}

                <button onClick={resetChat} title="Reset Chat"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <RefreshCw size={16} />
                </button>
                <button onClick={() => setIsOpen(false)} title="Close"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* ── Voice Mode Banner ── */}
            {isVoiceActive && (
              <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-3 flex items-center gap-3 shrink-0">
                <div className={`w-3 h-3 rounded-full shrink-0 ${voiceStatusColor}`} />
                <p className="font-body text-[13px] text-emerald-800 font-medium">{voiceStatusLabel}</p>
                <p className="font-mono text-[10px] text-emerald-500 ml-auto">Voice · Shimmer</p>
              </div>
            )}

            {/* ── Messages Area ── */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#fcfdfc] space-y-4 font-body text-[14px]">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-[20px] px-4 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-[#0d5c3a] text-white rounded-br-[4px]'
                      : 'bg-white border border-[#e5f0ec] text-gray-800 shadow-sm rounded-bl-[4px]'
                  }`}>
                    {msg.role === 'assistant'
                      ? <MessageContent content={msg.content} onClose={() => setIsOpen(false)} />
                      : <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    }
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-[#e5f0ec] shadow-sm rounded-[20px] rounded-bl-[4px] px-4 py-3 flex gap-1 items-center h-[42px]">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              {messages.length === 1 && !isTyping && !isVoiceActive && (
                <div className="flex flex-col gap-2 mt-4 max-w-[85%]">
                  {INITIAL_QUICK_REPLIES.map((reply, i) => (
                    <button key={i} onClick={() => sendMessage(reply)}
                      className="text-left px-4 py-2.5 border border-[#0d5c3a] text-[#0d5c3a] hover:bg-[#0d5c3a] hover:text-white rounded-2xl rounded-bl-[4px] text-[13px] font-medium transition-all shadow-sm bg-emerald-50/30">
                      {reply}
                    </button>
                  ))}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Input Box ── */}
            <div className="p-4 bg-white border-t border-theme/10 shrink-0">
              <form onSubmit={handleSendSubmit} className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    isVoiceActive ? 'Voice mode active — or type here...' :
                    isRecording ? 'Listening...' :
                    isTranscribing ? 'Transcribing...' :
                    'Type or speak a message...'
                  }
                  disabled={isRecording || isTranscribing}
                  className="w-full bg-[#f4f7f5] border border-[#e2ebe7] focus:border-[#0d5c3a] focus:bg-white rounded-full py-3 pl-4 pr-[88px] outline-none font-body text-[14px] text-gray-800 transition-all shadow-inner shadow-black/5 disabled:opacity-60"
                />

                {/* Whisper mic button (text mode only) */}
                {!isVoiceActive && (
                  <button
                    type="button"
                    title={isRecording ? 'Stop recording' : 'Voice input'}
                    disabled={isTranscribing || isTyping}
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`absolute right-11 w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                      isRecording
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-emerald-100 text-[#0d5c3a] hover:bg-emerald-200'
                    }`}
                  >
                    {isTranscribing ? <Loader2 size={14} className="animate-spin" /> :
                     isRecording ? <MicOff size={14} /> : <Mic size={14} />}
                  </button>
                )}

                {/* Send button */}
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping || isRecording || isTranscribing}
                  className="absolute right-2 w-8 h-8 rounded-full bg-[#0d5c3a] text-white flex items-center justify-center hover:bg-[#0a482e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={14} className="ml-0.5" />
                </button>
              </form>

              {isRecording && (
                <p className="text-center text-[11px] text-red-500 font-mono mt-2 animate-pulse">
                  🔴 Recording... tap mic to stop (max 10s)
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Toggle Button ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div className="relative" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
            <div className="absolute -top-10 right-0 whitespace-nowrap bg-[#0d5c3a] text-white px-3 py-1 rounded-full text-[12px] font-bold shadow-md">
              Hakeem AI
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={toggleChat}
              className="w-16 h-16 bg-[#25D366] text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex items-center justify-center relative"
              aria-label="Open chat"
            >
              <Sparkles size={32} fill="white" className="text-white" />
              <div className="absolute inset-0 rounded-full bg-[#25D366] opacity-30 animate-ping" style={{ animationDuration: '2s' }} />
              {unreadBadge && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white" />
                </span>
              )}
              <AnimatePresence>
                {showTooltip && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                    className="absolute right-[80px] top-1/2 -translate-y-1/2 bg-white text-gray-800 px-4 py-2.5 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] whitespace-nowrap font-medium text-[13px] border border-theme/10 before:content-[''] before:absolute before:right-[-6px] before:top-1/2 before:-translate-y-1/2 before:w-3 before:h-3 before:bg-white before:rotate-45 before:border-r before:border-t before:border-theme/10"
                  >
                    💬 Ask Hakeem AI anything!
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
