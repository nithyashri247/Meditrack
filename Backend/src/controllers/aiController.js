import Doctor from "../models/doctor.js";
import Prescription from "../models/Prescription.js";
import VitalReading from "../models/VitalReading.js";

const SPECIALTY_RULES = [
  { specialty: "Cardiology", keywords: ["heart attack", "chest pain", "chest pressure", "palpitation", "palpitations", "fast heartbeat", "heart racing", "blood pressure", " bp ", "cholesterol"] },
  { specialty: "Neurology", keywords: ["stroke", "migraine", "severe headache", "headache", "seizure", "numbness", "tingling", "dizziness", "vertigo", "memory problem", "brain tumor", "brain tumour"] },
  { specialty: "Psychology", keywords: ["anxiety", "stress", "panic", "sad", "depressed", "depression", "mental health", "insomnia", "sleep problem"] },
  { specialty: "Pulmonology", keywords: ["cough", "asthma", "wheezing", "breathing", "breathlessness", "shortness of breath", "lung"] },
  { specialty: "Gastroenterology", keywords: ["stomach", "acidity", "acid reflux", "heartburn", "gastric", "vomiting", "diarrhea", "constipation", "abdomen", "abdominal", "liver"] },
  { specialty: "Dermatology", keywords: ["rash", "acne", "itching", "skin", "eczema", "pimple", "hair loss"] },
  { specialty: "Orthopedics", keywords: ["knee", "joint", "back pain", "bone", "shoulder", "fracture", "muscle pain", "neck pain"] },
  { specialty: "Endocrinology", keywords: ["diabetes", "blood sugar", "glucose", "thyroid", "insulin"] },
  { specialty: "Ophthalmology", keywords: ["eye", "vision", "blurred vision", "red eye", "spectacles"] },
  { specialty: "ENT", keywords: ["ear", "hearing", "sinus", "sore throat", "throat", "tonsil", "nose"] },
  { specialty: "Gynecology", keywords: ["period", "periods", "menstrual", "pregnancy", "pregnant", "pcos", "pelvic pain", "labour", "labor"] },
  { specialty: "Urology", keywords: ["urine", "urination", "kidney stone", "kidney", "prostate", "burning urine"] },
  { specialty: "General Medicine", keywords: ["fever", "cold", "weakness", "body pain", "fatigue", "tired"] },
];

const SPECIALTY_SEARCH_TERMS = {
  Cardiology: ["cardiology", "cardiologist", "cardiac"],
  Neurology: ["neurology", "neurologist"],
  Psychology: ["psychology", "psychologist", "psychiatry", "psychiatrist"],
  Pulmonology: ["pulmonology", "pulmonologist", "respiratory"],
  Gastroenterology: ["gastroenterology", "gastroenterologist"],
  Dermatology: ["dermatology", "dermatologist"],
  Orthopedics: ["orthopedics", "orthopedic", "orthopaedic"],
  Endocrinology: ["endocrinology", "endocrinologist"],
  Ophthalmology: ["ophthalmology", "ophthalmologist", "eye specialist"],
  ENT: ["ent", "otolaryngology", "ent specialist"],
  Gynecology: ["gynecology", "gynaecology", "gynecologist", "gynaecologist"],
  Urology: ["urology", "urologist"],
  "General Medicine": ["general medicine", "general physician", "internal medicine", "physician"],
};

// These are intentionally narrow, high-confidence emergency phrases.
// A normal word such as "heart", "headache" or "pregnancy" must NOT become red by itself.
const RED_PATTERNS = [
  /\bheart attack\b/, /\bmyocardial infarction\b/, /\bcrushing chest pain\b/,
  /\bchest pain\b.{0,80}\b(sweat|sweating|faint|breath|breathing|pressure)\b/,
  /\b(severe|extreme)\s+chest pain\b/,
  /\b(can't|cannot|unable to|struggling to)\s+breathe\b/,
  /\bsevere\s+(shortness of breath|breathing difficulty)\b/,
  /\bblue\s+(lips|face)\b/, /\b(unconscious|unresponsive)\b/, /\b(stroke|face drooping|slurred speech|one side weakness)\b/,
  /\b(severe|heavy|uncontrolled)\s+bleeding\b/, /\bbleeding\b.{0,60}\b(pregnant|pregnancy)\b/,
  /\b(pregnant|pregnancy)\b.{0,60}\b(heavy bleeding|severe bleeding)\b/,
  /\bwater broke\b/, /\bwaters broke\b/, /\bamniotic fluid\b.{0,40}\b(leak|leaking|flow)\b/,
  /\b(labour|labor)\s+(pain|started|started suddenly)\b/, /\bgoing into\s+(labour|labor)\b/, /\bbaby\s+(is\s+)?coming\b/,
  /\bseizure\s+(now|right now|currently)\b/, /\b(coughing|vomiting)\s+blood\b/,
  /\b(suicidal|want to die|kill myself|self harm|self-harm)\b/,
  /\bbrain\s+(tumou?r|cancer)\b/, /\blife[- ]threatening\b/,
];

const ORANGE_PATTERNS = [
  /\bsevere\s+headache\b/, /\bvery high fever\b/, /\bhigh fever\b/,
  /\bsevere\s+(pain|vomiting|diarrhea)\b/, /\brepeated vomiting\b/, /\bdehydrated\b/,
  /\bmoderate\s+(breathing|breathlessness)\b/, /\bshortness of breath\b/,
  /\bgetting worse\b/, /\bworsening\b/, /\bpassed out\b/, /\bfainted\b/,
];

const RISK_META = {
  green: { label: "Low concern", meaning: "This sounds mild from what you have described. Home care and monitoring may be reasonable if you otherwise feel well." },
  yellow: { label: "Consultation needed", meaning: "A routine doctor consultation is sensible if the symptom persists, returns, or is affecting your daily activities." },
  orange: { label: "Urgent", meaning: "Please arrange prompt medical assessment, especially if the symptom is worsening or difficult to manage." },
  red: { label: "Emergency", meaning: "This can be a medical emergency. Seek immediate in-person care or contact your local emergency service rather than relying on chat." },
};

function normalize(value) {
  return String(value || "").toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/\s+/g, " ").trim();
}
function has(text, phrase) { return text.includes(phrase); }
function matchesAny(text, patterns) { return patterns.some((pattern) => pattern instanceof RegExp ? pattern.test(text) : text.includes(pattern)); }
function isMild(text) { return /\b(slight|mild|minor|little|a bit|not severe|small)\b/.test(text); }

function detectSpecialties(message) {
  const text = ` ${normalize(message)} `;
  return SPECIALTY_RULES.filter((rule) => rule.keywords.some((keyword) => text.includes(keyword))).map((rule) => rule.specialty).slice(0, 3);
}

function detectRisk(message) {
  const text = normalize(message);
  // Never infer emergency from stored vital status. Emergency must be supported by the current message.
  if (matchesAny(text, RED_PATTERNS)) return "red";
  if (matchesAny(text, ORANGE_PATTERNS)) return "orange";
  if (isMild(text) && !matchesAny(text, [/\bchest pain\b/, /\bbreath\b/, /\bbleeding\b/, /\bwater broke\b/])) return "green";
  if (has(text, "cold") || has(text, "cough") || has(text, "runny nose") || has(text, "sore throat") || has(text, "throat pain") || has(text, "acidity") || has(text, "heartburn")) return "green";
  if (detectSpecialties(text).length || /\b(symptom|pain|medicine|tablet|fever|headache|rash|anxiety|doubt|problem)\b/.test(text)) return "yellow";
  return "green";
}

function buildCarePlan(message, risk) {
  const text = normalize(message);
  const steps = [];
  const medicine = [];

  if (risk === "red") {
    return { steps: ["Do not wait for an AI explanation. Seek immediate in-person medical care or contact your local emergency service now."] , medicine };
  }

  if (has(text, "cold") || has(text, "cough") || has(text, "sore throat") || has(text, "throat pain")) {
    steps.push("Take enough rest and drink warm fluids to stay hydrated.");
    steps.push("Warm salt-water gargling may soothe a sore throat if it is comfortable for you.");
    steps.push("Avoid smoke, dust and other throat irritants.");
    medicine.push("For mild fever or pain, paracetamol is a common over-the-counter option for many adults. Follow the package label and avoid taking another product that also contains paracetamol.");
  } else if (has(text, "acidity") || has(text, "heartburn") || has(text, "acid reflux")) {
    steps.push("Prefer smaller meals and avoid lying down soon after eating.");
    steps.push("Limit foods or drinks that clearly trigger your acidity, such as very spicy or fatty foods.");
    medicine.push("An antacid may give short-term relief for occasional acidity. Ask a pharmacist for a suitable product, especially if symptoms are frequent or you take other medicines.");
  } else if (has(text, "headache")) {
    steps.push("Rest in a quiet place, drink water and reduce screen brightness for a while.");
    steps.push("If the headache is new, persistent, recurrent, or interfering with normal activities, arrange a doctor consultation.");
    if (isMild(text)) medicine.push("For occasional mild headache, paracetamol is commonly used by many adults. Follow the package directions and check with a pharmacist/doctor if you have other medical conditions or take other medicines.");
  } else if (has(text, "fever")) {
    steps.push("Rest and drink plenty of fluids; keep track of your temperature.");
    steps.push("Seek medical advice if the fever is high, persistent, or accompanied by worsening symptoms.");
    medicine.push("Paracetamol can reduce fever for many adults when used according to the product label. Avoid duplicate paracetamol-containing products.");
  } else if (has(text, "allergy") || has(text, "sneezing") || has(text, "itching")) {
    steps.push("Avoid the suspected trigger if you know it and keep the affected area clean.");
    medicine.push("Some allergy symptoms are treated with antihistamines such as cetirizine, but the right medicine depends on your age, conditions and other medicines. A pharmacist can help choose a suitable option.");
  } else if (has(text, "anxiety") || has(text, "stress") || has(text, "panic") || has(text, "insomnia")) {
    steps.push("Move somewhere quiet, slow your breathing and reduce caffeine for the moment.");
    steps.push("If these symptoms keep returning or affect daily life, consider speaking with a mental-health professional.");
  } else if (has(text, "fast heartbeat") || has(text, "heart racing") || has(text, "palpitation")) {
    steps.push("Sit down, rest and avoid caffeine or strenuous activity for the moment.");
    steps.push("If this is new, keeps recurring, or comes with chest pain, fainting or breathing difficulty, seek prompt medical care.");
  } else {
    steps.push("Based on what you have shared, monitor the symptom, rest and stay hydrated if appropriate.");
    steps.push("If you tell me when it started, how severe it is, and any other symptoms, I can give more relevant general guidance.");
  }
  return { steps, medicine };
}

function conversationReply(message, specialties, context) {
  const text = normalize(message);
  const lower = text;

  if (/^(hi+|hey+|hai+|hello+|good morning|good afternoon|good evening|namaste|yo)\b/.test(lower)) {
    return { reply: "Hi! 👋 I’m MediTrack AI. Tell me what you’re feeling, what you’re worried about, or ask a general health question. I’ll explain the next sensible steps and, when useful, point you to the right doctor.", riskLevel: "green", riskMeta: RISK_META.green, carePlan: [], medicineSuggestions: [], specialties: [], emergency: false, conversational: true };
  }
  if (/^(thanks|thank you|ok|okay|great|fine|got it)\b/.test(lower)) {
    return { reply: "You’re welcome 😊. If anything changes or you have another health doubt, tell me what you’re experiencing and I’ll help you work through the next step.", riskLevel: "green", riskMeta: RISK_META.green, carePlan: [], medicineSuggestions: [], specialties: [], emergency: false, conversational: true };
  }
  if (/^(who are you|what are you|what can you do)\b/.test(lower)) {
    return { reply: "I’m MediTrack AI, a health-information assistant inside MediTrack. I can explain common symptoms, suggest sensible self-care, provide general medicine information, identify when a doctor review may be useful, and help you choose a suitable specialty. I cannot diagnose you or replace an in-person clinician.", riskLevel: "green", riskMeta: RISK_META.green, carePlan: [], medicineSuggestions: [], specialties: [], emergency: false, conversational: true };
  }
  if (/^(thanks|thank you|thankyou|thx|ok|okay|great|fine|got it|gotcha|nice|cool|sure|yes|yeah|yep|no|nope)\b/.test(lower)) {
    return { reply: "You’re welcome 😊. I’m here whenever you have another question. Tell me what you want to know, and I’ll respond based on what you actually ask.", riskLevel: "green", riskMeta: RISK_META.green, carePlan: [], medicineSuggestions: [], specialties: [], emergency: false, conversational: true };
  }
  if (/^(how are you|how r u|what's up|whats up|who are you|what can you do)\b/.test(lower)) {
    return { reply: "I’m doing well 😊. I’m MediTrack AI, your health-information assistant. You can chat with me normally, ask a health question, describe a symptom, ask about a medicine, or ask which doctor may be appropriate.", riskLevel: "green", riskMeta: RISK_META.green, carePlan: [], medicineSuggestions: [], specialties: [], emergency: false, conversational: true };
  }

  if (/^(what is|what are|define|meaning of)\b/.test(lower) && !/(symptom|pain|bleeding|breath|attack)/.test(lower)) {
    return { reply: "I can explain that in simple terms. Tell me the health term or condition you want explained, and I’ll describe what it usually means, common symptoms, and when professional care is appropriate.", riskLevel: "green", riskMeta: RISK_META.green, carePlan: [], medicineSuggestions: [], specialties: [], emergency: false };
  }
  if (/^(what should i do|help me|i need help|i have a doubt|i have doubt|can you help)\??$/.test(lower)) {
    return { reply: "Of course. Tell me what you are experiencing, when it started, how severe it feels, and any other symptoms you have. I’ll guide you step by step.", riskLevel: "green", riskMeta: RISK_META.green, carePlan: [], medicineSuggestions: [], specialties: [], emergency: false };
  }

  const risk = detectRisk(text);
  const meta = RISK_META[risk];
  const care = buildCarePlan(text, risk);

  if (risk === "red") {
    const emergencySpecialty = specialties.length ? specialties : ["Emergency Medicine"];
    return {
      reply: `I understand what you wrote. The symptoms you mentioned can indicate a serious emergency, so the safest step is to get urgent in-person medical help now. Please do not wait for this chat to manage an emergency.\n\nIf you are with someone who is unwell, stay with them and contact your local emergency service or go to the nearest emergency department.`,
      riskLevel: risk, riskMeta: meta, carePlan: care.steps, medicineSuggestions: [], specialties: emergencySpecialty, emergency: true,
    };
  }

  const specialtyText = specialties.length
    ? `For this type of problem, ${specialties[0]} is the most relevant specialty to consider.`
    : "If it does not improve, a General Medicine doctor is a sensible first point of contact.";

  let reply = `${care.steps.join("\n")}\n\n${specialtyText}`;
  if (care.medicine.length) reply += `\n\nMedicine information (general):\n${care.medicine.join(" ")}`;
  reply += `\n\n${meta.meaning}`;
  if (context.activeMedicineNames.length) {
    reply += `\n\nYou currently have ${context.activeMedicineNames.length} active medicine${context.activeMedicineNames.length > 1 ? "s" : ""} in MediTrack. Please check with your clinician or pharmacist before adding a new medicine or changing an existing one.`;
  }

  return {
    reply, riskLevel: risk, riskMeta: meta, carePlan: care.steps, medicineSuggestions: care.medicine,
    specialties: specialties.length ? specialties : ["General Medicine"], emergency: false,
  };
}

async function findRecommendedDoctors(specialties) {
  const terms = specialties.filter((item) => item !== "Emergency Medicine");
  if (!terms.length) return [];
  const searchTerms = terms.flatMap((specialty) => SPECIALTY_SEARCH_TERMS[specialty] || [specialty]);
  const regexes = searchTerms.map((item) => new RegExp(item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  const doctors = await Doctor.find({ isAvailable: true, $or: [
    { specialty: { $in: regexes } }, { areasOfExpertise: { $in: regexes } }, { servicesOffered: { $in: regexes } },
  ]}).populate({ path: "user", match: { role: "doctor", accountStatus: "active", doctorVerification: "verified" }, select: "name specialization hospital" })
    .sort({ rating: -1, totalReviews: -1 }).limit(6).lean();
  return doctors.filter((doctor) => doctor.user).map((doctor) => ({
    id: doctor._id, userId: doctor.user?._id, name: doctor.user?.name || "Doctor",
    specialty: doctor.specialty || doctor.user?.specialization || "Specialist", hospital: doctor.hospital || doctor.user?.hospital || "MediTrack",
    experience: doctor.experience || 0, consultationFee: doctor.consultationFee || 0, rating: doctor.rating || 0,
    visitTypes: doctor.visitTypes || ["in-person"],
  }));
}

async function getPatientContext(patientId) {
  const [vitals, prescriptions] = await Promise.all([
    VitalReading.find({ patient: patientId }).sort({ recordedAt: -1 }).limit(7).lean(),
    Prescription.find({ patient: patientId }).sort({ prescriptionDate: -1 }).limit(10).lean(),
  ]);
  const activeMedicineNames = prescriptions.flatMap((prescription) => (prescription.medicines || []).filter((medicine) => medicine.status === "active").map((medicine) => medicine.name));
  return { vitals, activeMedicineNames: [...new Set(activeMedicineNames)] };
}

export async function chatWithMediTrackAI(req, res) {
  try {
    const message = String(req.body?.message || "").trim();
    if (!message) return res.status(400).json({ success: false, message: "Please enter a health question." });
    if (message.length > 1000) return res.status(400).json({ success: false, message: "Please keep your message under 1000 characters." });

    const specialties = detectSpecialties(message);
    const context = await getPatientContext(req.user._id);
    const result = conversationReply(message, specialties, context);
    const doctors = result.emergency ? [] : await findRecommendedDoctors(result.specialties);

    return res.json({ success: true, data: {
      ...result, doctors,
      context: { activeMedicineCount: context.activeMedicineNames.length, recentVitalCount: context.vitals.length },
    }});
  } catch (error) {
    console.error("MediTrack AI chat error:", error);
    return res.status(500).json({ success: false, message: "MediTrack AI could not process that question right now." });
  }
}
