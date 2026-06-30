import { useState, useRef, useEffect, useCallback } from "react";

const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;

const GROQ_CONFIG = {
  baseUrl: "https://api.groq.com/openai/v1/chat/completions",
  model: "llama-3.3-70b-versatile",  // Best quality on free tier

  maxTokens: 800,
};

const INDUSTRIES = {
  telecom: {
    id: "telecom",
    name: "Telecom Support",
    icon: "📡",
    color: "#0ea5e9",
    bg: "#f0f9ff",
    systemPrompt: `You are a professional telecom support assistant for an Indian telecom company.
Help users with: mobile balance, recharge plans, network issues/outages, SIM activation/swap,
international roaming, data packs, bill queries, and plan upgrades.
Be concise (2-4 sentences max), empathetic, and professional.
Always address the user's specific concern.
If the user seems angry or frustrated, acknowledge their frustration first before solving.
Format responses clearly. For plans/prices use the rupee symbol.`,
    welcomeMessage:
      "Hello! I'm your Telecom Support Assistant. How can I help you today? You can ask about your balance, recharge plans, network issues, or SIM services.",
    suggestions: [
      "Check my balance",
      "Network is not working",
      "Show me recharge plans",
      "Activate my SIM",
    ],
  },
  banking: {
    id: "banking",
    name: "Banking Assistant",
    icon: "🏦",
    color: "#10b981",
    bg: "#f0fdf4",
    systemPrompt: `You are a professional banking assistant for a digital bank.
Help users with: account balance, fund transfers, loan inquiries, credit card queries,
FD/RD, blocking cards, branch/ATM locator, and transaction disputes.
Be concise (2-4 sentences), secure-minded, and professional.
Never ask for sensitive info like full card numbers or passwords.
Always remind users to protect their OTP and PIN.`,
    welcomeMessage:
      "Welcome to Banking Support! I can help you with account queries, transfers, loans, credit cards, and more. How may I assist you?",
    suggestions: [
      "Check account balance",
      "Block my credit card",
      "Apply for personal loan",
      "Recent transactions",
    ],
  },
  realestate: {
    id: "realestate",
    name: "Real Estate",
    icon: "🏠",
    color: "#f59e0b",
    bg: "#fffbeb",
    systemPrompt: `You are a knowledgeable real estate assistant in India.
Help users with: property search, buying/selling/renting guidance, home loan eligibility,
property registration, legal documentation, EMI calculations, and market insights.
Be concise (2-4 sentences), helpful, and informative.
Use rupees per sq.ft or rupees in Lakh/Crore for pricing.
Provide practical advice and suggest next steps clearly.`,
    welcomeMessage:
      "Welcome to Real Estate Assistance! I can help you find properties, understand home loans, calculate EMI, or guide you through buying/renting. What are you looking for?",
    suggestions: [
      "Find 2BHK in Delhi",
      "Calculate home loan EMI",
      "Documents needed to buy property",
      "Current property rates",
    ],
  },
  healthcare: {
    id: "healthcare",
    name: "Healthcare",
    icon: "🏥",
    color: "#ef4444",
    bg: "#fff1f2",
    systemPrompt: `You are a helpful healthcare information assistant.
Help users with: appointment booking guidance, general health information,
medicine queries (non-prescriptive), symptom information, insurance claims,
hospital directions, and wellness tips.
Be concise (2-4 sentences), caring, and always recommend consulting a doctor.
Never diagnose or prescribe.
Always end health concern responses with: Please consult a qualified doctor.`,
    welcomeMessage:
      "Hello! I'm your Healthcare Assistant. I can help with appointment guidance, health information, insurance queries, and wellness tips. How can I help you today?",
    suggestions: [
      "Book a doctor appointment",
      "Nearest hospital",
      "Health insurance claim",
      "COVID symptoms info",
    ],
  },
};

function analyzeSentiment(text) {
  const t = text.toLowerCase();
  const veryNegative = [
    "hate", "terrible", "worst", "disgusting", "useless",
    "pathetic", "garbage", "scam", "fraud", "cheating",
    "idiots", "stupid service",
  ];
  const negative = [
    "bad", "angry", "upset", "frustrated", "disappointed",
    "problem", "issue", "not working", "failed", "wrong",
    "error", "can't", "cannot", "doesn't work", "broken",
    "annoying", "irritated", "unacceptable", "ridiculous",
  ];
  const positive = [
    "thanks", "thank you", "great", "good", "nice",
    "excellent", "perfect", "helpful", "amazing", "wonderful",
    "awesome", "love", "happy", "satisfied", "works",
  ];
  const veryPositive = [
    "fantastic", "outstanding", "brilliant", "superb",
    "incredible", "exceptional", "best", "flawless",
  ];

  let score = 0;
  veryNegative.forEach((w) => { if (t.includes(w)) score -= 2; });
  negative.forEach((w)     => { if (t.includes(w)) score -= 1; });
  positive.forEach((w)     => { if (t.includes(w)) score += 1; });
  veryPositive.forEach((w) => { if (t.includes(w)) score += 2; });

  if (score <= -3) return { label: "Very Negative", emoji: "😡", color: "#dc2626", score: 1, tone: "Escalation mode — empathy first" };
  if (score <= -1) return { label: "Negative",      emoji: "😕", color: "#f97316", score: 2, tone: "Acknowledged frustration"       };
  if (score === 0) return { label: "Neutral",        emoji: "😐", color: "#6b7280", score: 3, tone: "Standard response"              };
  if (score <= 2)  return { label: "Positive",       emoji: "🙂", color: "#22c55e", score: 4, tone: "Friendly & helpful"             };
  return                  { label: "Very Positive",  emoji: "😄", color: "#10b981", score: 5, tone: "Warm & appreciative"            };
}

async function callGroqAPI(messages, systemPrompt) {
  if (GROQ_API_KEY === "YOUR_GROQ_API_KEY_HERE") {
    throw new Error(
      "Please set your Groq API key. Get one free at https://console.groq.com/keys and paste it into App.jsx where it says GROQ_API_KEY."
    );
  }

  // Groq uses OpenAI-compatible format — system prompt goes in messages array
  const groqMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const response = await fetch(GROQ_CONFIG.baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_CONFIG.model,
      max_tokens: GROQ_CONFIG.maxTokens,
      messages: groqMessages,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 429) {
      throw new Error("Rate limit reached. Free tier: 1,000 requests/day, 30/minute. Wait a moment and try again.");
    }
    throw new Error(`Groq API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "10px 14px" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 8, height: 8, borderRadius: "50%", background: "#94a3b8",
            animation: "bounce 1.2s infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

function SentimentPill({ sentiment }) {
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 11, padding: "2px 8px", borderRadius: 99,
        background: sentiment.color + "18",
        color: sentiment.color,
        border: `1px solid ${sentiment.color}33`,
        fontWeight: 500,
      }}
    >
      {sentiment.emoji} {sentiment.label}
    </span>
  );
}

function SentimentContextBar({ userSentiment, channel, escalated }) {
  if (!userSentiment) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4, marginLeft: 2 }}>
      <span style={{ fontSize: 11, color: "#94a3b8" }}>Detected:</span>
      <span style={{
        fontSize: 11, padding: "2px 8px", borderRadius: 99,
        background: userSentiment.color + "18", color: userSentiment.color,
        border: `1px solid ${userSentiment.color}33`, fontWeight: 500,
      }}>
        {userSentiment.emoji} {userSentiment.label}
      </span>
      <span style={{ fontSize: 11, color: "#94a3b8" }}>→</span>
      <span style={{
        fontSize: 11, padding: "2px 8px", borderRadius: 99,
        background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0",
      }}>
        🤖 {userSentiment.tone}
      </span>
      {escalated && (
        <span style={{
          fontSize: 11, padding: "2px 8px", borderRadius: 99,
          background: "#fef3c7", color: "#d97706",
          border: "1px solid #fcd34d", fontWeight: 600,
        }}>
          ⚠️ Escalated to agent
        </span>
      )}
      {channel && channel !== "chat" && (
        <span style={{
          fontSize: 11, padding: "2px 8px", borderRadius: 99,
          background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0",
        }}>
          {channel === "voice" ? "🎙️ Voice" : "💬 SMS"}
        </span>
      )}
    </div>
  );
}

function MessageBubble({ msg, industry, prevUserMsg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: isUser ? "flex-end" : "flex-start",
      marginBottom: 16,
    }}>
      {!isUser && (
        <div style={{ marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: prevUserMsg ? 4 : 0 }}>
            <span style={{ fontSize: 15 }}>{industry.icon}</span>
            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{industry.name}</span>
          </div>
          {prevUserMsg && (
            <SentimentContextBar
              userSentiment={prevUserMsg.sentiment}
              channel={prevUserMsg.channel}
              escalated={prevUserMsg.escalated}
            />
          )}
        </div>
      )}

      <div style={{
        maxWidth: "80%",
        background: isUser ? industry.color : "white",
        color: isUser ? "white" : "#1e293b",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        padding: "10px 14px", fontSize: 14, lineHeight: 1.6,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        border: isUser ? "none" : "1px solid #f1f5f9",
        whiteSpace: "pre-wrap",
      }}>
        {msg.content}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
        <span style={{ fontSize: 11, color: "#94a3b8" }}>
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
        {isUser && msg.sentiment && <SentimentPill sentiment={msg.sentiment} />}
        {isUser && msg.channel && msg.channel !== "chat" && (
          <span style={{ fontSize: 11, color: "#94a3b8" }}>
            {msg.channel === "voice" ? "🎙️ via Voice" : "💬 via SMS"}
          </span>
        )}
      </div>
    </div>
  );
}

function VoiceModal({ onClose, onSend, industry }) {
  const [phase, setPhase] = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);

  const start = () => {
    setPhase("listening");
    setSeconds(0);
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  };
  const stop = () => {
    clearInterval(timerRef.current);
    setPhase("processing");
    setTimeout(() => setPhase("done"), 1200);
  };
  const send = () => {
    if (transcript.trim()) { onSend(transcript, "voice"); onClose(); }
  };
  useEffect(() => () => clearInterval(timerRef.current), []);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }}>
      <div style={{
        background: "white", borderRadius: 20, padding: 32, width: 340,
        textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", marginBottom: 6 }}>
          🎙️ Voice Call — {industry.name}
        </div>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 24 }}>
          Speak your query, then click Stop
        </div>
        <div style={{
          width: 80, height: 80, borderRadius: "50%", margin: "0 auto 20px",
          background: phase === "listening" ? "#fef2f2" : industry.bg,
          border: `3px solid ${phase === "listening" ? "#ef4444" : industry.color}`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32,
          animation: phase === "listening" ? "pulse 1s infinite" : "none",
        }}>
          {phase === "idle" ? "🎙️" : phase === "listening" ? "🔴" : phase === "processing" ? "⏳" : "✅"}
        </div>
        {phase === "listening" && (
          <div style={{ fontSize: 13, color: "#ef4444", marginBottom: 12 }}>
            Listening... {seconds}s
          </div>
        )}
        {phase === "done" && (
          <textarea
            placeholder="Voice transcribed here — edit if needed before sending"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            style={{
              width: "100%", minHeight: 80, borderRadius: 10,
              border: "1px solid #e2e8f0", padding: 10, fontSize: 13,
              resize: "vertical", marginBottom: 12, boxSizing: "border-box",
            }}
          />
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {phase === "idle" && (
            <button onClick={start} style={{ background: "#ef4444", color: "white", border: "none", borderRadius: 99, padding: "10px 24px", cursor: "pointer", fontWeight: 600 }}>
              Start Recording
            </button>
          )}
          {phase === "listening" && (
            <button onClick={stop} style={{ background: "#1e293b", color: "white", border: "none", borderRadius: 99, padding: "10px 24px", cursor: "pointer", fontWeight: 600 }}>
              Stop
            </button>
          )}
          {phase === "done" && (
            <button onClick={send} style={{ background: industry.color, color: "white", border: "none", borderRadius: 99, padding: "10px 24px", cursor: "pointer", fontWeight: 600 }}>
              Send via Voice
            </button>
          )}
          <button onClick={onClose} style={{ background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: 99, padding: "10px 18px", cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function SmsModal({ onClose, onSend, industry }) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const send = () => {
    if (message.trim()) {
      setSent(true);
      setTimeout(() => { onSend(message, "sms"); onClose(); }, 1500);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }}>
      <div style={{
        background: "white", borderRadius: 20, padding: 32, width: 340,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", marginBottom: 4 }}>
          💬 Send via SMS
        </div>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>
          Query will be sent as SMS to {industry.name}
        </div>
        <input
          placeholder="Your phone number (e.g. +91xxxxxxxxxx)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 10,
            border: "1px solid #e2e8f0", fontSize: 13,
            marginBottom: 12, boxSizing: "border-box", outline: "none",
          }}
        />
        <textarea
          placeholder="Type your SMS message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{
            width: "100%", minHeight: 90, padding: "10px 12px", borderRadius: 10,
            border: "1px solid #e2e8f0", fontSize: 13, resize: "vertical",
            marginBottom: 16, boxSizing: "border-box", outline: "none",
          }}
        />
        {sent ? (
          <div style={{
            textAlign: "center", padding: 12, background: "#f0fdf4",
            borderRadius: 10, color: "#16a34a", fontWeight: 600, fontSize: 14,
          }}>
            ✅ SMS Sent! Processing your query...
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={send} style={{ flex: 1, background: industry.color, color: "white", border: "none", borderRadius: 99, padding: "10px 0", cursor: "pointer", fontWeight: 600 }}>
              Send SMS
            </button>
            <button onClick={onClose} style={{ background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: 99, padding: "10px 18px", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [selectedIndustry, setSelectedIndustry] = useState("telecom");
  const [conversations, setConversations]         = useState({});
  const [input, setInput]                         = useState("");
  const [loading, setLoading]                     = useState(false);
  const [showVoice, setShowVoice]                 = useState(false);
  const [showSms, setShowSms]                     = useState(false);
  const [error, setError]                         = useState(null);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const industry = INDUSTRIES[selectedIndustry];
  const messages = conversations[selectedIndustry] || [];

  // Initialise welcome message when switching industry for first time
  useEffect(() => {
    if (!conversations[selectedIndustry]) {
      setConversations((prev) => ({
        ...prev,
        [selectedIndustry]: [{
          role: "assistant",
          content: industry.welcomeMessage,
          timestamp: Date.now(),
          channel: "chat",
        }],
      }));
    }
  }, [selectedIndustry]);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── CORE SEND MESSAGE FUNCTION ──
  // 1. Run sentiment analysis on user input
  // 2. Add user message to conversation state
  // 3. Build system prompt (industry + sentiment + channel adjustments)
  // 4. Call Groq API (or Spring Boot backend in production)
  // 5. Add bot reply to state
  const sendMessage = useCallback(
    async (text, channel = "chat") => {
      if (!text.trim()) return;
      setError(null);

      const sentiment = analyzeSentiment(text);
      const escalated = sentiment.score <= 2;

      const userMsg = {
        role: "user", content: text,
        timestamp: Date.now(), sentiment, escalated, channel,
      };

      const currentMessages = conversations[selectedIndustry] || [];
      const updated = [...currentMessages, userMsg];
      setConversations((prev) => ({ ...prev, [selectedIndustry]: updated }));
      setInput("");
      setLoading(true);

      try {
        const apiMessages = updated
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role, content: m.content }));

        let systemPrompt = industry.systemPrompt;
        if (escalated)
          systemPrompt +=
            "\n\nIMPORTANT: User is frustrated/upset. Start by empathetically acknowledging " +
            "their frustration first, then provide a solution. Offer to escalate to a human agent.";
        if (channel === "voice")
          systemPrompt += "\n\nThis message came via a voice call. Keep response conversational and brief.";
        if (channel === "sms")
          systemPrompt += "\n\nThis message came via SMS. Keep reply under 160 characters if possible.";

        const reply = await callGroqAPI(apiMessages, systemPrompt);

        const botMsg = {
          role: "assistant", content: reply,
          timestamp: Date.now(), channel,
        };
        setConversations((prev) => ({
          ...prev,
          [selectedIndustry]: [...updated, botMsg],
        }));
      } catch (err) {
        setError(err.message || "Failed to get response. Please check your Groq API key and try again.");
        setConversations((prev) => ({ ...prev, [selectedIndustry]: updated }));
      } finally {
        setLoading(false);
      }
    },
    [selectedIndustry, conversations, industry]
  );

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setConversations((prev) => ({
      ...prev,
      [selectedIndustry]: [{
        role: "assistant",
        content: industry.welcomeMessage,
        timestamp: Date.now(),
        channel: "chat",
      }],
    }));
  };

  const getPreUserMsg = (index) => {
    for (let i = index - 1; i >= 0; i--) {
      if (messages[i].role === "user") return messages[i];
    }
    return null;
  };

  const totalMsgs      = Object.values(conversations).flat().filter((m) => m.role === "user").length;
  const totalEscalated = Object.values(conversations).flat().filter((m) => m.escalated).length;

  return (
    <div style={{
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      height: "100vh", display: "flex", flexDirection: "column",
      background: "#f8fafc", maxWidth: "100%", margin: 0,
    }}>
      {/* ── Global CSS ── */}
      <style>{`
        @keyframes bounce  { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        @keyframes pulse   { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)} 50%{box-shadow:0 0 0 12px rgba(239,68,68,0)} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar       { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }
        textarea:focus, input:focus { outline: none; border-color: #94a3b8 !important; }
        button { transition: opacity 0.15s; }
        button:hover { opacity: 0.85; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{
        background: "white", borderBottom: "1px solid #f1f5f9",
        padding: "12px 20px", display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: industry.bg, display: "flex",
          alignItems: "center", justifyContent: "center",
          fontSize: 20, flexShrink: 0,
        }}>
          {industry.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#1e293b" }}>Universal AI Chatbot</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            <span style={{ color: "#22c55e" }}>●</span> {industry.name} · Powered by Groq (Free) · {totalMsgs} messages
            {totalEscalated > 0 && (
              <span style={{ color: "#d97706" }}> · ⚠️ {totalEscalated} escalated</span>
            )}
          </div>
        </div>
        <div style={{
          fontSize: 10, padding: "3px 8px", borderRadius: 99,
          background: "#f0fdf4", color: "#16a34a",
          border: "1px solid #86efac", fontWeight: 600,
        }}>
          🆓 FREE API
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── SIDEBAR ── */}
        <div style={{
          width: 260, background: "white", borderRight: "1px solid #f1f5f9",
          padding: "16px 12px", display: "flex", flexDirection: "column",
          gap: 6, overflowY: "auto", flexShrink: 0,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.08em", marginBottom: 4, paddingLeft: 4 }}>
            INDUSTRIES
          </div>

          {Object.values(INDUSTRIES).map((ind) => {
            const msgCount = (conversations[ind.id] || []).filter((m) => m.role === "user").length;
            const isActive = selectedIndustry === ind.id;
            return (
              <button
                key={ind.id}
                onClick={() => setSelectedIndustry(ind.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 10, border: "1px solid",
                  borderColor: isActive ? ind.color + "44" : "transparent",
                  background: isActive ? ind.bg : "transparent",
                  cursor: "pointer", textAlign: "left", width: "100%",
                }}
              >
                <span style={{ fontSize: 18 }}>{ind.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12, lineHeight: 1.3,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "#1e293b" : "#475569",
                  }}>
                    {ind.name}
                  </div>
                  {msgCount > 0 && (
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>{msgCount} msgs</div>
                  )}
                </div>
              </button>
            );
          })}

          {/* Channel buttons */}
          <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.08em", marginBottom: 8, paddingLeft: 4 }}>
              CHANNELS
            </div>
            <button
              onClick={() => setShowVoice(true)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0",
                background: "white", cursor: "pointer", width: "100%",
                fontSize: 12, color: "#475569", marginBottom: 6,
              }}
            >
              🎙️ Voice Call
            </button>
            <button
              onClick={() => setShowSms(true)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0",
                background: "white", cursor: "pointer", width: "100%",
                fontSize: 12, color: "#475569",
              }}
            >
              💬 Send SMS
            </button>
          </div>
        </div>

        {/* ── MAIN CHAT AREA ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Sub-header */}
          <div style={{
            padding: "10px 20px",
            background: industry.bg,
            borderBottom: "1px solid " + industry.color + "33",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div style={{ fontSize: 13, color: "#475569" }}>
              {industry.icon} Chatting with <strong>{industry.name}</strong>
            </div>
            <button
              onClick={clearChat}
              style={{ fontSize: 12, color: "#94a3b8", background: "none", border: "none", cursor: "pointer", padding: "4px 8px" }}
            >
              🗑️ Clear
            </button>
          </div>

          {/* Message list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "28px 48px" }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ animation: "fadeIn 0.2s ease" }}>
                <MessageBubble
                  msg={msg}
                  industry={industry}
                  prevUserMsg={msg.role === "assistant" ? getPreUserMsg(i) : null}
                />
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ fontSize: 18 }}>{industry.icon}</span>
                <div style={{
                  background: "white", borderRadius: "18px 18px 18px 4px",
                  border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}>
                  <TypingIndicator />
                </div>
              </div>
            )}

            {error && (
              <div style={{
                background: "#fef2f2", border: "1px solid #fecaca",
                borderRadius: 10, padding: "10px 14px",
                fontSize: 13, color: "#dc2626", margin: "8px 0",
              }}>
                ⚠️ {error}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestion chips */}
          {messages.length <= 1 && (
            <div style={{ padding: "8px 48px 0", display: "flex", gap: 8, flexWrap: "wrap" }}>
              {industry.suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  style={{
                    padding: "7px 14px", borderRadius: 99,
                    border: `1px solid ${industry.color}44`,
                    background: industry.bg, color: industry.color,
                    fontSize: 12, cursor: "pointer", fontWeight: 500,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <div style={{
            padding: "12px 48px", background: "white",
            borderTop: "1px solid #f1f5f9",
            display: "flex", gap: 10, alignItems: "flex-end",
          }}>
            <button
              onClick={() => setShowVoice(true)}
              title="Voice Call"
              style={{
                width: 40, height: 40, borderRadius: 10,
                border: "1px solid #e2e8f0", background: "white",
                cursor: "pointer", fontSize: 16, flexShrink: 0,
              }}
            >
              🎙️
            </button>
            <button
              onClick={() => setShowSms(true)}
              title="Send SMS"
              style={{
                width: 40, height: 40, borderRadius: 10,
                border: "1px solid #e2e8f0", background: "white",
                cursor: "pointer", fontSize: 16, flexShrink: 0,
              }}
            >
              💬
            </button>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${industry.name}... (Enter to send)`}
              rows={1}
              style={{
                flex: 1, padding: "10px 14px", borderRadius: 12,
                border: "1px solid #e2e8f0", fontSize: 14,
                resize: "none", fontFamily: "inherit",
                lineHeight: 1.5, maxHeight: 100, overflow: "auto",
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              style={{
                width: 40, height: 40, borderRadius: 10, border: "none",
                background: input.trim() && !loading ? industry.color : "#e2e8f0",
                color: "white",
                cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                fontSize: 18, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              ↑
            </button>
          </div>
        </div>
      </div>

      {/* ── MODALS ── */}
      {showVoice && (
        <VoiceModal
          onClose={() => setShowVoice(false)}
          onSend={sendMessage}
          industry={industry}
        />
      )}
      {showSms && (
        <SmsModal
          onClose={() => setShowSms(false)}
          onSend={sendMessage}
          industry={industry}
        />
      )}
    </div>
  );
}
