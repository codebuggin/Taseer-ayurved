import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import OpenAI from 'openai';
import { Sparkles, X, Send, RefreshCw, Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SYSTEM_PROMPT = `You are Hakeem, the official AI assistant for Taseer Ayurved — an Ayurvedic medicine brand founded by Vaid Ali Shaikh, based in Ahmedabad, Gujarat with 20+ years of experience and 12,000+ patients treated.

PERSONALITY:
- Warm, trustworthy, knowledgeable
- Speak in simple English or Hindi based on what the customer uses
- Never sound robotic — be like a helpful hakeem
- Keep responses short — max 3-4 lines

BUSINESS INFO:
- Brand: Taseer Ayurved
- Founder: Vaid Ali Shaikh
- Address: 68/30, Nagpur Vora Ki Chawl, Opp. Jhulta Minara, Gomtipur, Ahmedabad - 380021
- Phone: +91 7405410856
- Price: ₹3600 per product
- All India courier, discreet packaging

PRODUCTS & CONDITIONS:
- Liver Failure Care → liver disease, jaundice
- Fatty-L Liver Care → fatty liver
- Million Liver Care & Detox → liver detox
- Piliya Ki Dekhbhal → jaundice, yellow eyes
- Kidney Failure Medicine → kidney failure, creatinine high
- Kidney-Liver Cure → kidney and liver issues
- Go Stone → kidney stones, urine infection
- Gallbladder Stones Cleaner → gallbladder stones
- Kodney Sukad Jana → kidney atrophy
- Hernia Treatment → hernia, abdominal pain
- Prostate Level → prostate, frequent urination
- Pil-es Hemorrhoids Treatment → piles, bawaseer
- Sabkuch Hazam → indigestion, gas, bloating
- Stomach Cure → stomach problems
- Worms Cure → intestinal worms
- BP Control Majun → high blood pressure
- Best for Cholesterol → high cholesterol
- Heart Cure Special → heart weakness
- All Pain for Arthritis → arthritis, joint pain
- Body Pain Relief → body pain, muscle pain
- Kamar Dard Nivarak Capsule → back pain
- Sciatica Relief → sciatica, nerve pain
- Tila-E-Rider → joint massage oil
- Uric Acid Care → uric acid, gout
- Alopecia Oil → baldness, hair regrowth
- Hair Fall Oil → hair fall, thinning
- Ayurvedic Black Oil → grey hair, hair nourishment
- Deep Sleep → insomnia, poor sleep
- Insomnia Cure → severe insomnia
- Chinta Mukti → anxiety, stress, tension
- Depression Care → depression, low mood
- Migraine Ka Ilaj → migraine, severe headache
- Majun For Paralysis → paralysis, stroke recovery
- Height Powder → short height, ages 10-25
- Weight Gain Powder → underweight, weak physique
- Belly Fat Burner Detox → obesity, weight loss
- Honey Moon Special → men's stamina, sexual wellness
- Swarn Bhasma 500mg → immunity, premium wellness
- Talbina Mango → nutrition, energy
- General Wellness → overall health
- Sinus Cure → sinusitis, blocked nose
- Asthma Care → asthma, breathing difficulty
- Lungs Cure → lung weakness, chronic cough
- Vericose Veins Cure → varicose veins, leg swelling
- Motiya Bina Operation → cataract, blurry vision
- Drishti Sudhar Hetu Powder → weak eyesight
- Uterine Fibroid → uterine fibroids
- Leucorrhea Capsule → white discharge
- Periods Free Capsule → irregular periods, PCOD
- Daad Aur Khujli → skin rash, itching, eczema
- Khoobsurat Aur Gore Rang → skin whitening, glow
- Sharab Chudane Ki Aushadhi → alcohol de-addiction

FLOWS:

1. FIND PRODUCT FOR SYMPTOMS:
   - Ask user their symptoms
   - Recommend best matching product
   - Say the price ₹3600
   - Then say: "Aap seedha hamare shop page par ja kar order kar sakte hain!"
   - Show clickable link to: /shop
   - Or say "Add to Cart karein aur checkout karein — bahut aasaan hai!"

2. PRODUCT QUESTION:
   - Answer what it treats and price
   - Guide them: "Is product ko dekhne ke liye yahan click karein:" + link to /shop
   - Say they can directly add to cart from there

3. BOOK CONSULTATION:
   - Tell them they can book directly on website
   - Say: "Hamare website par 'Book Consultation' button hai — wahan click karein!"
   - Guide them to click the Book Consultation button in the navbar
   - Also collect name + phone as backup and say team will also call them

4. PLACE ORDER:
   - Guide them to website:
     "Aap directly hamare shop page par ja kar order kar sakte hain!"
   - Step by step guide:
     1. "Shop page par jaiye" → link /shop
     2. "Product chuniye"
     3. "Add to Cart karein"
     4. "Checkout karein"
     5. "Cash on Delivery select karein"
     6. "Order place karein!"
   - Also collect their details as backup

IMPORTANT RULES:
- Always provide clickable navigation hints
- When mentioning a page, provide the route:
  Shop: /shop
  Consultation: use Book Consultation button in navbar
  Cart: click cart icon in navbar
  My Orders: /my-orders
- Make it feel like a guided tour of the website
- Never just say "our team will contact you" without also guiding them to self-serve on site
- If user seems confused, offer to guide them step by step
- Always recommend consulting Vaid Ali Shaikh for serious conditions
- Never make false medical claims
- If unsure, ask follow up questions
- If customer writes Hindi, reply in Hindi
- If customer writes English, reply in English`;

const INITIAL_QUICK_REPLIES = [
  "🌿 I have a health problem",
  "💊 Tell me about a product",
  "📞 I want to consult Hakeem",
  "🛒 I want to place an order"
];

const INITIAL_MESSAGE = { role: 'assistant', content: 'Assalamu alaikum! Welcome to Taseer Ayurved. I am Hakeem AI. How may I help you today?' };

// Renders message text and converts known routes like /shop into clickable links
function MessageContent({ content, onClose }) {
  const parts = content.split(/(\/(?:shop|my-orders|about|contact|checkout)(?:\/[^\s,!?]*)?)/g);
  return (
    <p className="whitespace-pre-wrap leading-relaxed">
      {parts.map((part, i) =>
        /^\/(shop|my-orders|about|contact|checkout)/.test(part) ? (
          <Link
            key={i}
            to={part}
            onClick={onClose}
            className="underline font-semibold text-emerald-700 hover:text-emerald-900"
          >
            {part}
          </Link>
        ) : part
      )}
    </p>
  );
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const [hasVisited, setHasVisited] = useState(() => localStorage.getItem('hakeem_chat_visited') === 'true');
  const [unreadBadge, setUnreadBadge] = useState(!localStorage.getItem('hakeem_chat_visited'));
  const [showTooltip, setShowTooltip] = useState(false);

  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const isMutedRef = useRef(false); // ref so async closures always get current value

  const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
  });

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

  useEffect(() => {
    let t1, t2;
    if (!hasVisited && !isOpen) {
      t1 = setTimeout(() => setShowTooltip(true), 3000);
      t2 = setTimeout(() => setShowTooltip(false), 8000);
    }
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [hasVisited, isOpen]);

  // Stop any speech when chat closes
  useEffect(() => {
    if (!isOpen) window.speechSynthesis?.cancel();
  }, [isOpen]);

  const toggleChat = () => {
    if (!isOpen) {
      setUnreadBadge(false);
      setShowTooltip(false);
      if (!hasVisited) {
        localStorage.setItem('hakeem_chat_visited', 'true');
        setHasVisited(true);
      }
    }
    setIsOpen(!isOpen);
  };

  const toggleMute = () => {
    const next = !isMutedRef.current;
    isMutedRef.current = next;
    setIsMuted(next);
    if (next) window.speechSynthesis?.cancel();
  };

  const speakResponse = (text) => {
    if (isMutedRef.current || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const isHindi = /[ऀ-ॿ]/.test(text);
    utterance.lang = isHindi ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const transcribeAudio = async (audioBlob) => {
    setIsTranscribing(true);
    setIsRecording(false);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}` },
        body: formData
      });
      const data = await response.json();
      if (data.text) await sendMessage(data.text);
    } catch (err) {
      console.error('Whisper transcription error:', err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorder.ondataavailable = (e) => { audioChunks.push(e.data); };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') mediaRecorder.stop();
      }, 10000);

      setIsRecording(true);
      mediaRecorderRef.current = mediaRecorder;
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        alert('Microphone access denied. Please allow microphone permission in your browser settings and try again.');
      } else {
        console.error('Microphone error:', err);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleSendSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const textToSend = input.trim();
    setInput('');
    sendMessage(textToSend);
  };

  const resetChat = () => {
    setMessages([INITIAL_MESSAGE]);
    setInput('');
    setIsTyping(false);
    window.speechSynthesis?.cancel();
  };

  const sendMessage = async (text) => {
    if (!text || isTyping) return;

    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    const conversationHistory = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
      userMessage
    ];

    try {
      if (!import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY === 'your_key_here') {
        throw new Error("API key not configured");
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: conversationHistory,
        temperature: 0.7,
        max_tokens: 150,
      });

      const rawContent = response.choices[0].message.content.trim();
      setMessages(prev => [...prev, { role: 'assistant', content: rawContent }]);
      speakResponse(rawContent);

    } catch (error) {
      console.error('Chat API Error:', error);
      let errorMsg = "Sorry, I am facing a connection issue right now. Please call us directly at +91 7405410856.";
      if (error.message === "API key not configured") {
        errorMsg = "System configuration pending: Please add your OpenAI API key to the .env file.";
      }
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white w-[380px] h-[550px] max-h-[80vh] mb-4 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-theme/20"
            style={{ maxWidth: 'calc(100vw - 32px)' }}
          >
            {/* Header */}
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
                {/* Mute / Unmute toggle */}
                <button
                  onClick={toggleMute}
                  title={isMuted ? 'Unmute voice' : 'Mute voice'}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <button
                  onClick={resetChat}
                  title="Reset Chat"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <RefreshCw size={16} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#fcfdfc] space-y-4 font-body text-[14px]">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-[20px] px-4 py-2.5 ${
                      msg.role === 'user'
                        ? 'bg-[#0d5c3a] text-white rounded-br-[4px]'
                        : 'bg-white border border-[#e5f0ec] text-gray-800 shadow-sm rounded-bl-[4px]'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div>
                        <MessageContent content={msg.content} onClose={() => setIsOpen(false)} />
                        {/* Speaker icon to replay this message */}
                        <button
                          onClick={() => speakResponse(msg.content)}
                          title="Read aloud"
                          className="mt-1 text-emerald-400 hover:text-emerald-600 transition-colors"
                        >
                          <Volume2 size={12} />
                        </button>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-[#e5f0ec] text-gray-800 shadow-sm rounded-[20px] rounded-bl-[4px] px-4 py-3 flex gap-1 items-center h-[42px]">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              {messages.length === 1 && !isTyping && (
                <div className="flex flex-col gap-2 mt-4 max-w-[85%]">
                  {INITIAL_QUICK_REPLIES.map((reply, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(reply)}
                      className="text-left px-4 py-2.5 border border-[#0d5c3a] text-[#0d5c3a] hover:bg-[#0d5c3a] hover:text-white rounded-2xl rounded-bl-[4px] text-[13px] font-medium transition-all shadow-sm bg-emerald-50/30"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Box */}
            <div className="p-4 bg-white border-t border-theme/10 shrink-0">
              <form onSubmit={handleSendSubmit} className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isRecording ? 'Listening...' : isTranscribing ? 'Transcribing...' : 'Type or speak a message...'}
                  disabled={isRecording || isTranscribing}
                  className="w-full bg-[#f4f7f5] border border-[#e2ebe7] focus:border-[#0d5c3a] focus:bg-white rounded-full py-3 pl-4 pr-[88px] outline-none font-body text-[14px] text-gray-800 transition-all shadow-inner shadow-black/5 disabled:opacity-60"
                />

                {/* Mic button */}
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
                  {isTranscribing ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : isRecording ? (
                    <MicOff size={14} />
                  ) : (
                    <Mic size={14} />
                  )}
                </button>

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

      {/* Floating Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div className="relative" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
            <div className="absolute -top-10 right-0 whitespace-nowrap bg-[#0d5c3a] text-white px-3 py-1 rounded-full text-[12px] font-bold shadow-md flex items-center gap-1">
              Hakeem AI
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleChat}
              className="w-16 h-16 bg-[#25D366] text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex items-center justify-center relative group"
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
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
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
