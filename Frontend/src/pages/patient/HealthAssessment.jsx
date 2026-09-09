import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck, HeartPulse, RotateCcw, ShieldAlert, Stethoscope, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const areas = [
  { id: "general", label: "General wellness", icon: "✦", specialty: "General Medicine" },
  { id: "heart", label: "Heart & circulation", icon: "♥", specialty: "Cardiology" },
  { id: "respiratory", label: "Lungs & breathing", icon: "◌", specialty: "Pulmonology" },
  { id: "digestive", label: "Stomach & digestion", icon: "◈", specialty: "Gastroenterology" },
  { id: "neuro", label: "Brain & nerves", icon: "⌁", specialty: "Neurology" },
  { id: "womens", label: "Women’s health", icon: "♀", specialty: "Gynecology" },
  { id: "mental", label: "Mental wellbeing", icon: "☼", specialty: "Psychology" },
  { id: "bones", label: "Bones & muscles", icon: "◇", specialty: "Orthopedics" },
];
const questions = {
  general: ["How do you feel overall today?", "Do you have a fever or chills?", "How is your energy level?", "Are you able to eat and drink normally?", "Are your usual daily activities comfortable?"],
  heart: ["Do you have chest pain or pressure?", "Does your heart feel unusually fast, irregular or pounding?", "Do you become breathless with very little activity?", "Have you had fainting or near-fainting?", "Do you have new severe sweating, weakness or discomfort spreading to the arm/jaw?"],
  respiratory: ["Are you having difficulty breathing at rest?", "Do you have a persistent or worsening cough?", "Are you wheezing or feeling tight in the chest?", "Do you have blue/grey lips or severe breathlessness?", "Are you coughing blood?"],
  digestive: ["How severe is your stomach or abdominal discomfort?", "Are you vomiting repeatedly or unable to keep fluids down?", "Do you have blood in vomit or stool, or black stool?", "Is the pain severe or rapidly worsening?", "Can you eat and drink without major difficulty?"],
  neuro: ["Do you have a sudden, unusually severe headache?", "Do you have new weakness or numbness on one side?", "Do you have trouble speaking, seeing, walking or staying balanced?", "Have you had a seizure, fainting or loss of consciousness?", "Do you have new confusion or a major change in behaviour?"],
  womens: ["Are you pregnant or could you be pregnant?", "Are you having labour/contraction pain or has your water broken?", "Are you having heavy vaginal bleeding?", "Do you have severe pelvic or abdominal pain?", "Do you have fever, fainting or severe weakness?"],
  mental: ["How difficult has anxiety, stress or low mood been today?", "Is sleep significantly affected?", "Is it hard to manage normal daily activities?", "Are you having panic symptoms that feel difficult to control?", "Are you having thoughts of harming yourself or not wanting to live?"],
  bones: ["How severe is the pain or movement problem?", "Is there major swelling or deformity?", "Did the problem start after a significant injury or fall?", "Can you put weight on or use the affected area?", "Is weakness, numbness or loss of movement developing?"],
};
const options = [
  { value: "normal", label: "Normal", score: 0 },
  { value: "mild", label: "Mild", score: 1 },
  { value: "moderate", label: "Moderate", score: 2 },
  { value: "severe", label: "Severe / serious", score: 3 },
];
const risk = {
  green: { label: "Low concern", meaning: "Your answers did not show a concerning pattern. Continue healthy routines and monitor any new symptoms.", className: "green" },
  yellow: { label: "Consultation needed", meaning: "Some answers suggest that a routine doctor consultation would be useful, particularly if symptoms persist or return.", className: "yellow" },
  orange: { label: "Urgent", meaning: "Your answers suggest that you should arrange prompt medical assessment rather than waiting several days.", className: "orange" },
  red: { label: "Emergency", meaning: "Your answers include a serious warning sign. Seek immediate medical care or contact your local emergency service now.", className: "red" },
};

export default function HealthAssessment() {
  const navigate = useNavigate();
  const [area, setArea] = useState(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  const selectedQuestions = useMemo(() => area ? questions[area.id] : [], [area]);

  function chooseArea(item) { setArea(item); setStep(0); setAnswers([]); setResult(null); setDoctors([]); }
  function chooseAnswer(value) {
    const next = [...answers]; next[step] = value; setAnswers(next);
  }
  async function submitAssessment() {
    const selected = answers.map(v => options.find(o => o.value === v)?.score ?? 0);
    const text = answers.map((v, i) => `${selectedQuestions[i]} ${v}`).join(" ").toLowerCase();
    const emergencyTerms = area.id === "heart" && (answers[0] === "severe" || answers[4] === "severe")
      || area.id === "respiratory" && (answers[0] === "severe" || answers[3] === "severe" || answers[4] === "severe")
      || area.id === "digestive" && (answers[2] === "severe" || answers[3] === "severe")
      || area.id === "neuro" && answers.some((a, i) => a === "severe" && [0, 1, 2, 3, 4].includes(i))
      || area.id === "womens" && answers.some((a, i) => a === "severe" && [1, 2, 3].includes(i))
      || area.id === "mental" && answers[4] === "severe"
      || /heart attack|stroke|brain tumor|brain tumour|labour pain|labor pain|heavy bleeding|water broke|unconscious|seizure/.test(text);
    const total = selected.reduce((a, b) => a + b, 0);
    const level = emergencyTerms ? "red" : total === 0 ? "green" : total <= 4 ? "yellow" : "orange";
    const output = { level, total, area: area.label, specialty: area.specialty, completedAt: new Date().toISOString(), answers: answers.slice() };
    setResult(output);
    localStorage.setItem("meditrack_health_assessment", JSON.stringify(output));
    setLoadingDoctors(true);
    try {
      const response = await api.get(`/doctors?specialty=${encodeURIComponent(area.specialty)}`);
      setDoctors((response.data?.doctors || []).slice(0, 4));
    } catch { setDoctors([]); } finally { setLoadingDoctors(false); }
  }
  function reset() { setArea(null); setStep(0); setAnswers([]); setResult(null); setDoctors([]); }
  function bookDoctor(doctor) { navigate("/patient/appointments", { state: { recommendedDoctorId: doctor._id, recommendedDoctorName: doctor.user?.name || "Doctor" } }); }

  return <div className="assessment-page">
    <div className="assessment-header"><div><div className="assessment-eyebrow"><ClipboardCheck size={13} /> HEALTH ASSESSMENT</div><h1>General Health Assessment</h1><p>A short guided check-in. Choose the area you want to assess and answer each question honestly.</p></div>{area && <button type="button" className="secondary-button" onClick={reset}><RotateCcw size={14} /> Start over</button>}</div>

    {!area && <section className="assessment-card"><div className="assessment-section-head"><div><span className="assessment-step">STEP 1</span><h2>Which area would you like to check?</h2><p>Select the area closest to your concern.</p></div></div><div className="assessment-area-grid">{areas.map(item => <button type="button" key={item.id} className="assessment-area" onClick={() => chooseArea(item)}><span>{item.icon}</span><strong>{item.label}</strong><small>{item.specialty}</small><ArrowRight size={14} /></button>)}</div></section>}

    {area && !result && <section className="assessment-card"><div className="assessment-progress"><div><span>STEP 2</span><strong>{area.label}</strong></div><span>{step + 1} of {selectedQuestions.length}</span></div><div className="assessment-question"><div className="assessment-question-icon"><HeartPulse size={20} /></div><h2>{selectedQuestions[step]}</h2><p>Choose the option that best matches you right now.</p><div className="assessment-options">{options.map(option => <button type="button" key={option.value} className={answers[step] === option.value ? `selected ${option.value}` : ""} onClick={() => chooseAnswer(option.value)}>{option.label}</button>)}</div></div><div className="assessment-actions"><button type="button" className="secondary-button" onClick={() => step ? setStep(step - 1) : setArea(null)}><ArrowLeft size={14} /> Back</button>{step < selectedQuestions.length - 1 ? <button type="button" className="primary-button" disabled={!answers[step]} onClick={() => setStep(step + 1)}>Next <ArrowRight size={14} /></button> : <button type="button" className="primary-button" disabled={answers.length !== selectedQuestions.length || answers.some(v => !v)} onClick={submitAssessment}><CheckCircle2 size={15} /> Submit assessment</button>}</div></section>}

    {result && <section className="assessment-result-card"><div className={`assessment-result-banner ${risk[result.level].className}`}><span className="assessment-result-dot" /><div><span>ASSESSMENT RESULT</span><h2>{risk[result.level].label}</h2><p>{risk[result.level].meaning}</p></div></div><div className="assessment-result-grid"><div className="assessment-result-panel"><div className="assessment-panel-title"><ClipboardCheck size={16} /><strong>What this means</strong></div><p>Area assessed: <b>{result.area}</b></p><p>Recommended starting point: <b>{result.specialty}</b></p><p>This screening is not a diagnosis. A healthcare professional should assess persistent, worsening or serious symptoms.</p>{result.level === "red" ? <div className="assessment-alert red"><ShieldAlert size={15} /><span>Do not wait for a routine appointment. Seek emergency medical care now.</span></div> : result.level === "orange" ? <div className="assessment-alert orange"><ShieldAlert size={15} /><span>Arrange prompt medical assessment, especially if symptoms worsen.</span></div> : <div className="assessment-alert green"><CheckCircle2 size={15} /><span>Keep monitoring and use routine care if symptoms continue.</span></div>}</div><div className="assessment-result-panel"><div className="assessment-panel-title"><Stethoscope size={16} /><strong>Doctor recommendation</strong></div><div className="assessment-specialty-pill">{result.specialty}</div><p>{result.level === "red" ? "Emergency care first. Once stable, follow the specialist advice provided by your treating team." : `If you need an appointment, ${result.specialty} is the recommended starting specialty for this assessment.`}</p></div></div>{result.level !== "red" && <div className="assessment-doctors"><div className="assessment-panel-title"><UserRound size={16} /><strong>Verified doctors available in MediTrack</strong></div>{loadingDoctors ? <p className="assessment-muted">Loading doctors…</p> : doctors.length ? <div className="assessment-doctor-grid">{doctors.map(d => <article key={d._id} className="assessment-doctor-card"><div className="ai-doctor-avatar"><UserRound size={16} /></div><div><strong>{d.user?.name || "Doctor"}</strong><span>{d.specialty}</span><small>{d.hospital || d.user?.hospital || "MediTrack"}</small></div><button type="button" onClick={() => bookDoctor(d)}>Book <ArrowRight size={13} /></button></article>)}</div> : <p className="assessment-muted">No verified doctor is currently listed for this specialty. You can still use Appointments to explore available doctors.</p>}</div>}<div className="assessment-actions"><button type="button" className="secondary-button" onClick={reset}><RotateCcw size={14} /> New assessment</button>{result.level !== "red" && <button type="button" className="primary-button" onClick={() => navigate("/patient/appointments")}>Open Appointments <ArrowRight size={14} /></button>}</div></section>}
  </div>;
}
