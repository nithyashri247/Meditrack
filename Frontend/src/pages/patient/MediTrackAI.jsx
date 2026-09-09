import { useEffect, useRef, useState } from "react";
import { ArrowRight, BrainCircuit, CalendarDays, CheckCircle2, CircleAlert, Pill, Send, ShieldCheck, Sparkles, Stethoscope, Trash2, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const STORAGE_KEY = "meditrack_ai_chat";
const SETTINGS_KEY = "meditrack_settings";
const quickPrompts = [
  "I have cold, cough and throat pain. What should I do?",
  "I have acidity after food. What can I do?",
  "My heart is beating very fast. Which doctor should I see?",
  "I have a severe headache. What should I do?",
];
const riskMeta = {
  green: { label: "Low concern", meaning: "Symptoms sound mild from the information provided. Home care and monitoring may be reasonable if you otherwise feel well." },
  yellow: { label: "Consultation needed", meaning: "A doctor should review this, especially if symptoms persist, return, or affect daily activities." },
  orange: { label: "Urgent", meaning: "Arrange prompt medical assessment. Do not wait if symptoms are getting worse." },
  red: { label: "Emergency", meaning: "Seek immediate medical care or contact your local emergency service. Do not rely on chat for an emergency." },
};
const initialMessage = {
  id: "welcome", role: "assistant",
  text: "Hi! I’m MediTrack AI. Tell me what you are experiencing or ask any health question. I’ll start with practical next steps, then explain medicine information when appropriate, give a colour-coded concern level, and suggest the right doctor if a consultation is useful.",
  riskLevel: "green", riskMeta: riskMeta.green, specialties: [], doctors: [], medicineSuggestions: [], carePlan: [], emergency: false,
};

function DoctorCard({ doctor, onBook }) {
  const fee = Number(doctor.consultationFee || 0);
  return <article className="ai-doctor-card">
    <div className="ai-doctor-avatar"><UserRound size={17} /></div>
    <div className="ai-doctor-info"><strong>{doctor.name}</strong><span>{doctor.specialty}</span><small>{doctor.hospital || "MediTrack"}</small><div className="ai-doctor-meta"><span>{doctor.experience || 0}+ yrs</span><span>{doctor.rating ? `${Number(doctor.rating).toFixed(1)} ★` : "Verified"}</span><span>{fee ? `₹${fee}` : "Fee not listed"}</span></div></div>
    <button type="button" className="ai-doctor-book" onClick={() => onBook(doctor)}>Book <ArrowRight size={13} /></button>
  </article>;
}

function MessageExtras({ message, onBook, onFindDoctors }) {
  if (message.role !== "assistant" || message.id === "welcome" || message.conversational) return null;
  const risk = riskMeta[message.riskLevel] || riskMeta.green;
  return <div className="ai-message-extras">
    <div className={`ai-risk-card ${risk.className}`}><span className="ai-risk-dot" /><div><strong>{risk.label}</strong><p>{message.riskMeta?.meaning || risk.meaning}</p></div></div>
    {!!message.carePlan?.length && <div className="ai-care-box"><div className="ai-recommend-heading"><CheckCircle2 size={16} /><strong>What to do now</strong></div><ul>{message.carePlan.map((item, i) => <li key={i}>{item}</li>)}</ul></div>}
    {!!message.medicineSuggestions?.length && message.riskLevel !== "red" && <div className="ai-medicine-box"><div className="ai-recommend-heading"><Pill size={16} /><strong>Medicine information</strong></div>{message.medicineSuggestions.map((item, i) => <p key={i}>{item}</p>)}<small>Medicine information is general. Follow the product label and check with a pharmacist or doctor if you are pregnant, have allergies/other conditions, or take other medicines.</small></div>}
    {!!message.specialties?.length && <div className="ai-recommend-box"><div className="ai-recommend-heading"><Stethoscope size={16} /><strong>Who you may need to see</strong></div><div className="ai-specialty-list">{message.specialties.map(s => <span key={s}>{s}</span>)}</div></div>}
    {!!message.doctors?.length && message.riskLevel !== "red" && <div className="ai-doctors-box"><div className="ai-recommend-heading"><ShieldCheck size={16} /><strong>Verified doctors in MediTrack</strong></div><div className="ai-doctor-list">{message.doctors.map(d => <DoctorCard key={String(d.id)} doctor={d} onBook={onBook} />)}</div></div>}
    {!message.doctors?.length && !!message.specialties?.length && message.riskLevel !== "red" && <button type="button" className="ai-find-doctors" onClick={onFindDoctors}>Find doctors in Appointments <ArrowRight size={14} /></button>}
  </div>;
}

export default function MediTrackAI() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState(() => { try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); return Array.isArray(saved) && saved.length ? saved : [initialMessage]; } catch { return [initialMessage]; } });
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    let save = true;
    try { save = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}").saveAiChat !== false; } catch { /* defaults */ }
    if (save) localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  function clearConversation() { setMessages([initialMessage]); setInput(""); setError(""); localStorage.removeItem(STORAGE_KEY); }
  function usePrompt(prompt) { setInput(prompt); requestAnimationFrame(() => textareaRef.current?.focus()); }
  async function sendMessage(event) {
    event?.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    const userMessage = { id: `user-${Date.now()}`, role: "user", text };
    setMessages(c => [...c, userMessage]); setInput(""); setError(""); setSending(true);
    try {
      const response = await api.post("/ai/chat", { message: text });
      const data = response.data?.data;
      if (!data?.reply) throw new Error("No AI response was returned.");
      setMessages(c => [...c, { id: `assistant-${Date.now()}`, role: "assistant", text: data.reply, specialties: data.specialties || [], doctors: data.doctors || [], medicineSuggestions: data.medicineSuggestions || [], carePlan: data.carePlan || [], riskLevel: data.riskLevel || "green", riskMeta: data.riskMeta || riskMeta.green, emergency: Boolean(data.emergency), conversational: Boolean(data.conversational) }]);
    } catch (e) {
      setError(e.response?.data?.message || "MediTrack AI is temporarily unavailable. Please try again.");
      setMessages(c => c.filter(m => m.id !== userMessage.id)); setInput(text);
    } finally { setSending(false); }
  }
  function handleKeyDown(e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }
  function bookDoctor(doctor) { navigate("/patient/appointments", { state: { recommendedDoctorId: doctor.id, recommendedDoctorName: doctor.name } }); }

  return <div className="ai-chat-page">
    <div className="ai-chat-header"><div className="ai-chat-title-wrap"><div className="ai-chat-logo"><BrainCircuit size={22} /></div><div><div className="ai-chat-eyebrow"><Sparkles size={12} /> PERSONAL HEALTH ASSISTANT</div><h1>MediTrack AI</h1><p>Ask your health questions and get practical guidance, medicine information and the right doctor when needed.</p></div></div><button type="button" className="ai-clear-button" onClick={clearConversation}><Trash2 size={15} /> Clear chat</button></div>

    <div className="ai-chat-shell"><div className="ai-chat-topnote"><ShieldCheck size={15} /><span><strong>Private patient chat</strong> · Your messages are processed through your authenticated MediTrack account.</span></div>
      <div className="ai-conversation" aria-live="polite">
        {messages.map(message => <div className={`ai-chat-row ${message.role}`} key={message.id}>
          {message.role === "assistant" && <div className="ai-message-avatar"><BrainCircuit size={16} /></div>}
          <div className="ai-message-column"><div className="ai-message-name">{message.role === "assistant" ? "MediTrack AI" : "You"}</div><div className={`ai-message-bubble ${message.role === "assistant" ? "assistant" : "user"}`}>{message.text.split("\n").map((line, i) => <p key={i}>{line || <>&nbsp;</>}</p>)}</div><MessageExtras message={message} onBook={bookDoctor} onFindDoctors={() => navigate("/patient/appointments")} /></div>
          {message.role === "user" && <div className="ai-user-avatar"><UserRound size={15} /></div>}
        </div>)}
        {sending && <div className="ai-chat-row assistant"><div className="ai-message-avatar"><BrainCircuit size={16} /></div><div className="ai-message-column"><div className="ai-message-name">MediTrack AI</div><div className="ai-typing"><span /><span /><span /><em>Thinking…</em></div></div></div>}
        <div ref={endRef} />
      </div>
      {error && <div className="ai-chat-error"><CircleAlert size={15} /> {error}</div>}
      <div className="ai-quick-prompts"><span>Try asking</span>{quickPrompts.map(p => <button key={p} type="button" onClick={() => usePrompt(p)} disabled={sending}>{p}</button>)}</div>
      <form className="ai-composer" onSubmit={sendMessage}><textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value.slice(0, 1000))} onKeyDown={handleKeyDown} placeholder="Type your symptoms or health question…" rows={1} disabled={sending} /><button type="submit" disabled={!input.trim() || sending} aria-label="Send message"><Send size={17} /></button></form>
      <div className="ai-chat-footer"><span><ShieldCheck size={12} /> Informational decision support — not a diagnosis or prescription.</span><span>Green · Yellow · Orange · Red</span></div>
    </div>

    <div className="ai-capability-strip"><div><Stethoscope size={17} /><strong>Practical first</strong><span>Clear next steps before medicine information.</span></div><div><Pill size={17} /><strong>Medicine guidance</strong><span>General, safety-focused information when appropriate.</span></div><div><CircleAlert size={17} /><strong>Colour signal</strong><span>The response explains what the concern level means.</span></div><div><CalendarDays size={17} /><strong>Doctor match</strong><span>See suitable specialties and verified doctors.</span></div></div>
  </div>;
}
