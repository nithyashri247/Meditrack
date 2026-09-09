import { useEffect, useState } from "react";
import { Bell, BrainCircuit, CheckCircle2, RotateCcw, Save, ShieldCheck, Trash2 } from "lucide-react";

const KEY = "meditrack_settings";
const defaults = { browserNotifications: true, appointmentNotifications: true, medicineReminders: true, saveAiChat: true };

export default function Settings() {
  const [settings, setSettings] = useState(defaults);
  const [saved, setSaved] = useState(false);
  const [permission, setPermission] = useState(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
  useEffect(() => { try { setSettings({ ...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}") }); } catch { /* defaults */ } }, []);
  function update(key, value) { setSettings(s => ({ ...s, [key]: value })); setSaved(false); }
  async function enableBrowserNotifications() { if (typeof Notification === "undefined") return; if (Notification.permission === "default") { const p = await Notification.requestPermission(); setPermission(p); } }
  function save() { localStorage.setItem(KEY, JSON.stringify(settings)); setSaved(true); setTimeout(() => setSaved(false), 2500); }
  function reset() { localStorage.setItem(KEY, JSON.stringify(defaults)); setSettings(defaults); setSaved(true); setTimeout(() => setSaved(false), 2500); }
  function clearChat() { localStorage.removeItem("meditrack_ai_chat"); setSaved(true); setTimeout(() => setSaved(false), 1800); }
  return <div className="settings-page"><div className="settings-header"><div><div className="assessment-eyebrow"><ShieldCheck size={13} /> ACCOUNT SETTINGS</div><h1>Settings</h1><p>Control how MediTrack communicates with you and how your AI chat is stored on this browser.</p></div></div>
    <div className="settings-grid">
      <section className="settings-card"><div className="settings-card-title"><Bell size={17} /><div><h2>Notifications</h2><p>Choose which patient updates you want to receive.</p></div></div>
        <SettingRow icon={<Bell size={16} />} title="Browser notifications" text="Allow MediTrack to show desktop notifications when supported." checked={settings.browserNotifications} onChange={async v => { update("browserNotifications", v); if (v) await enableBrowserNotifications(); }} />
        <SettingRow icon={<CheckCircle2 size={16} />} title="Appointment updates" text="Notify me when a doctor approves or updates an appointment." checked={settings.appointmentNotifications} onChange={v => update("appointmentNotifications", v)} />
        <SettingRow icon={<Bell size={16} />} title="Medicine reminders" text="Show reminders when a scheduled medicine dose is due." checked={settings.medicineReminders} onChange={v => update("medicineReminders", v)} />
        <div className="settings-permission"><span>Browser permission</span><strong>{permission === "granted" ? "Allowed" : permission === "denied" ? "Blocked in browser" : permission === "unsupported" ? "Not supported" : "Not requested"}</strong>{settings.browserNotifications && permission !== "granted" && permission !== "unsupported" && <button type="button" onClick={enableBrowserNotifications}>Enable</button>}</div>
      </section>
      <section className="settings-card"><div className="settings-card-title"><BrainCircuit size={17} /><div><h2>MediTrack AI</h2><p>Manage your AI conversation history on this browser.</p></div></div><SettingRow icon={<BrainCircuit size={16} />} title="Save AI chat history" text="Keep recent AI conversations available when you return to the MediTrack AI page." checked={settings.saveAiChat} onChange={v => update("saveAiChat", v)} /><button type="button" className="settings-danger" onClick={clearChat}><Trash2 size={15} /> Clear saved AI chat</button></section>
      <section className="settings-card"><div className="settings-card-title"><ShieldCheck size={17} /><div><h2>Privacy & security</h2><p>Simple controls for your patient portal.</p></div></div><div className="settings-info"><strong>Patient controlled</strong><span>Your notification and AI-history preferences are stored locally in this browser. Medical records and appointments remain protected by your authenticated MediTrack account.</span></div><div className="settings-info"><strong>Safety reminder</strong><span>MediTrack AI provides decision support and does not replace a clinician. Emergency symptoms should always be handled by emergency medical services.</span></div></section>
    </div>
    <div className="settings-actions"><button type="button" className="secondary-button" onClick={reset}><RotateCcw size={14} /> Reset defaults</button><button type="button" className="primary-button" onClick={save}><Save size={15} /> Save settings</button>{saved && <span className="settings-saved">✓ Saved</span>}</div>
  </div>;
}
function SettingRow({ icon, title, text, checked, onChange }) { return <div className="settings-row"><span className="settings-row-icon">{icon}</span><div><strong>{title}</strong><p>{text}</p></div><button type="button" className={`settings-toggle ${checked ? "on" : ""}`} aria-pressed={checked} onClick={() => onChange(!checked)}><span /></button></div>; }
