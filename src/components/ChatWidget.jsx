import { useState, useEffect, useRef } from 'react';
import OpenAI from 'openai';
import { Sparkles, X, Send, RefreshCw } from 'lucide-react';
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
1. SYMPTOM → recommend best matching product, mention price ₹3600, ask if they want to order
2. PRODUCT QUESTION → explain what it treats, price, delivery info
3. CONSULTATION → collect name + phone + concern, tell them team will call on +91 7405410856
4. ORDER → collect product + name + phone + address, confirm order and say team will call to confirm

RULES:
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

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const [hasVisited, setHasVisited] = useState(() => localStorage.getItem('hakeem_chat_visited') === 'true');
  const [unreadBadge, setUnreadBadge] = useState(!localStorage.getItem('hakeem_chat_visited'));
  const [showTooltip, setShowTooltip] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true // required for frontend usage
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Tooltip timing logic
  useEffect(() => {
    let t1, t2;
    if (!hasVisited && !isOpen) {
      t1 = setTimeout(() => setShowTooltip(true), 3000);
      t2 = setTimeout(() => setShowTooltip(false), 8000);
    }
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [hasVisited, isOpen]);

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
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] mix-blend-overlay"></div>
              
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
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
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
              
              {/* Vertical Quick Replies (Only when there is exactly 1 message and not typing) */}
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
                  placeholder="Type a message..."
                  className="w-full bg-[#f4f7f5] border border-[#e2ebe7] focus:border-[#0d5c3a] focus:bg-white rounded-full py-3 pl-4 pr-12 outline-none font-body text-[14px] text-gray-800 transition-all shadow-inner shadow-black/5"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="absolute right-2 w-8 h-8 rounded-full bg-[#0d5c3a] text-white flex items-center justify-center hover:bg-[#0a482e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={14} className="ml-0.5" />
                </button>
              </form>
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
              
              {/* Animated Pulse Ring */}
              <div className="absolute inset-0 rounded-full bg-[#25D366] opacity-30 animate-ping" style={{ animationDuration: '2s' }} />
              
              {/* Notification Badge */}
              {unreadBadge && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
                </span>
              )}

              {/* Tooltip Popup */}
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
