import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { z } from "zod";
import { Check, Send, ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { EASE } from "./ui";
import { DiscordInviteModal } from "./DiscordInviteModal";

// Beta responses sheet. The tab must be named 'Beta' (the script renames the
// first tab automatically if it is missing). Same no-cors caveat as the
// waitlist form: a 4xx from Apps Script still resolves as success here, so the
// sheet is the source of truth, not the success panel.
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycby78aeLtzyHp6UDMXAl7wZfoqpe3lxbfKfm3K1MImolbTsQBLHdnjMbv8_fe5T5--o9/exec";

const ROLES = ["Student", "Developer / Engineer", "Researcher", "Creator", "Founder / Entrepreneur", "Working Professional", "Other"] as const;
const USE_CASES = ["Learning", "Research", "Coding / Development", "Work", "Content Creation", "Personal Knowledge Management", "Business", "Other"] as const;
const FEATURES = ["YouTube Knowledge", "PDF / Document Intelligence", "Web Content", "Notes", "AI Search", "RAG / Ask Your Knowledge", "Knowledge Graph", "Cross-Source Intelligence"] as const;
const TIME_COMMITMENTS = ["15–30 minutes/week", "30–60 minutes/week", "1–2 hours/week", "2+ hours/week"] as const;
const COMFORT_LEVELS = ["Yes, definitely", "Yes, whenever I encounter an issue", "Maybe"] as const;
const WILLINGNESS = ["Yes", "Maybe", "No"] as const;

const schema = z.object({
  name: z.string().trim().min(1, "Tell us your name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  role: z.enum(ROLES),
  useCases: z.array(z.enum(USE_CASES)).min(1, "Select at least one").max(3, "Select up to 3"),
  features: z.array(z.enum(FEATURES)).min(1, "Select at least one").max(3, "Select up to 3"),
  timeCommitment: z.enum(TIME_COMMITMENTS),
  comfortLevel: z.enum(COMFORT_LEVELS),
  willingness: z.enum(WILLINGNESS),
  motivation: z.string().trim().min(10, "At least 10 characters").max(2000),
  anythingElse: z.string().trim().max(2000).optional(),
  linkedin: z
    .string()
    .trim()
    .min(1, "Share your LinkedIn profile")
    .max(255)
    .refine(isLinkedInProfile, "Enter your real LinkedIn profile URL (linkedin.com/in/…)"),
  github: z
    .string()
    .trim()
    .min(1, "Share your GitHub profile")
    .max(255)
    .refine(isGitHubProfile, "Enter your real GitHub profile URL (github.com/…)"),
  countryCode: z.string().regex(/^\+\d{1,4}$/, "Select a country code"),
  phone: z.string().trim().max(16).optional(),
}).superRefine((data, ctx) => {
  // Phone is optional, but when provided it must look like a real number for
  // the selected country (digits only, within that country's length range).
  const digits = (data.phone ?? "").replace(/\D/g, "");
  if (!digits) return;
  const max = maxDigitsFor(data.countryCode);
  if (digits.length < 7 || digits.length > max) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["phone"],
      message: `Enter a valid phone number (7–${max} digits)`,
    });
  }
});

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

// Genuine-profile guard: the URL must be a real linkedin.com member/company
// page, not just any link. This keeps placeholder and fake links out.
function isLinkedInProfile(value: string): boolean {
  try {
    const url = new URL(normalizeUrl(value));
    if (url.hostname.toLowerCase().replace(/^www\./, "") !== "linkedin.com") return false;
    return /^\/(in|company)\/[^/]+\/?$/.test(url.pathname);
  } catch {
    return false;
  }
}

// Genuine-profile guard: the URL must be a real github.com user page
// (a single path segment that follows GitHub's username rules).
function isGitHubProfile(value: string): boolean {
  try {
    const url = new URL(normalizeUrl(value));
    if (url.hostname.toLowerCase().replace(/^www\./, "") !== "github.com") return false;
    const segments = url.pathname.split("/").filter(Boolean);
    return (
      segments.length === 1 &&
      /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(segments[0] ?? "")
    );
  } catch {
    return false;
  }
}

// Country calling codes with the max national-number length. Entries without
// an explicit max fall back to 15 (the E.164 maximum). Pinned values cover
// fixed-length numbering plans (e.g. India and NANP mobiles are 10 digits).
const COUNTRIES: { name: string; dial: string; max?: number }[] = [
  { name: "Afghanistan", dial: "93" },
  { name: "Albania", dial: "355" },
  { name: "Algeria", dial: "213" },
  { name: "American Samoa", dial: "1684", max: 10 },
  { name: "Andorra", dial: "376" },
  { name: "Angola", dial: "244" },
  { name: "Anguilla", dial: "1264", max: 10 },
  { name: "Antigua and Barbuda", dial: "1268", max: 10 },
  { name: "Argentina", dial: "54" },
  { name: "Armenia", dial: "374" },
  { name: "Aruba", dial: "297" },
  { name: "Australia", dial: "61" },
  { name: "Austria", dial: "43" },
  { name: "Azerbaijan", dial: "994" },
  { name: "Bahamas", dial: "1242", max: 10 },
  { name: "Bahrain", dial: "973" },
  { name: "Bangladesh", dial: "880", max: 10 },
  { name: "Barbados", dial: "1246", max: 10 },
  { name: "Belarus", dial: "375" },
  { name: "Belgium", dial: "32" },
  { name: "Belize", dial: "501" },
  { name: "Benin", dial: "229" },
  { name: "Bermuda", dial: "1441", max: 10 },
  { name: "Bhutan", dial: "975" },
  { name: "Bolivia", dial: "591" },
  { name: "Bosnia and Herzegovina", dial: "387" },
  { name: "Botswana", dial: "267" },
  { name: "Brazil", dial: "55" },
  { name: "British Virgin Islands", dial: "1284", max: 10 },
  { name: "Brunei", dial: "673" },
  { name: "Bulgaria", dial: "359" },
  { name: "Burkina Faso", dial: "226" },
  { name: "Burundi", dial: "257" },
  { name: "Cambodia", dial: "855" },
  { name: "Cameroon", dial: "237" },
  { name: "Canada", dial: "1", max: 10 },
  { name: "Cape Verde", dial: "238" },
  { name: "Cayman Islands", dial: "1345", max: 10 },
  { name: "Central African Republic", dial: "236" },
  { name: "Chad", dial: "235" },
  { name: "Chile", dial: "56" },
  { name: "China", dial: "86", max: 11 },
  { name: "Colombia", dial: "57" },
  { name: "Comoros", dial: "269" },
  { name: "Congo", dial: "242" },
  { name: "Congo (DRC)", dial: "243" },
  { name: "Cook Islands", dial: "682" },
  { name: "Costa Rica", dial: "506" },
  { name: "Croatia", dial: "385" },
  { name: "Cuba", dial: "53" },
  { name: "Curaçao", dial: "599" },
  { name: "Cyprus", dial: "357" },
  { name: "Czechia", dial: "420" },
  { name: "Denmark", dial: "45" },
  { name: "Djibouti", dial: "253" },
  { name: "Dominica", dial: "1767", max: 10 },
  { name: "Dominican Republic", dial: "1", max: 10 },
  { name: "Ecuador", dial: "593" },
  { name: "Egypt", dial: "20" },
  { name: "El Salvador", dial: "503" },
  { name: "Equatorial Guinea", dial: "240" },
  { name: "Eritrea", dial: "291" },
  { name: "Estonia", dial: "372" },
  { name: "Eswatini", dial: "268" },
  { name: "Ethiopia", dial: "251" },
  { name: "Fiji", dial: "679" },
  { name: "Finland", dial: "358" },
  { name: "France", dial: "33" },
  { name: "French Guiana", dial: "594" },
  { name: "French Polynesia", dial: "689" },
  { name: "Gabon", dial: "241" },
  { name: "Gambia", dial: "220" },
  { name: "Georgia", dial: "995" },
  { name: "Germany", dial: "49" },
  { name: "Ghana", dial: "233" },
  { name: "Gibraltar", dial: "350" },
  { name: "Greece", dial: "30" },
  { name: "Greenland", dial: "299" },
  { name: "Grenada", dial: "1473", max: 10 },
  { name: "Guadeloupe", dial: "590" },
  { name: "Guam", dial: "1671", max: 10 },
  { name: "Guatemala", dial: "502" },
  { name: "Guinea", dial: "224" },
  { name: "Guinea-Bissau", dial: "245" },
  { name: "Guyana", dial: "592" },
  { name: "Haiti", dial: "509" },
  { name: "Honduras", dial: "504" },
  { name: "Hong Kong", dial: "852" },
  { name: "Hungary", dial: "36" },
  { name: "Iceland", dial: "354" },
  { name: "India", dial: "91", max: 10 },
  { name: "Indonesia", dial: "62" },
  { name: "Iran", dial: "98" },
  { name: "Iraq", dial: "964" },
  { name: "Ireland", dial: "353" },
  { name: "Israel", dial: "972" },
  { name: "Italy", dial: "39" },
  { name: "Ivory Coast", dial: "225" },
  { name: "Jamaica", dial: "1876", max: 10 },
  { name: "Japan", dial: "81", max: 11 },
  { name: "Jordan", dial: "962" },
  { name: "Kazakhstan", dial: "7", max: 10 },
  { name: "Kenya", dial: "254" },
  { name: "Kiribati", dial: "686" },
  { name: "Kosovo", dial: "383" },
  { name: "Kuwait", dial: "965" },
  { name: "Kyrgyzstan", dial: "996" },
  { name: "Laos", dial: "856" },
  { name: "Latvia", dial: "371" },
  { name: "Lebanon", dial: "961" },
  { name: "Lesotho", dial: "266" },
  { name: "Liberia", dial: "231" },
  { name: "Libya", dial: "218" },
  { name: "Liechtenstein", dial: "423" },
  { name: "Lithuania", dial: "370" },
  { name: "Luxembourg", dial: "352" },
  { name: "Macao", dial: "853" },
  { name: "Madagascar", dial: "261" },
  { name: "Malawi", dial: "265" },
  { name: "Malaysia", dial: "60" },
  { name: "Maldives", dial: "960" },
  { name: "Mali", dial: "223" },
  { name: "Malta", dial: "356" },
  { name: "Marshall Islands", dial: "692" },
  { name: "Martinique", dial: "596" },
  { name: "Mauritania", dial: "222" },
  { name: "Mauritius", dial: "230" },
  { name: "Mexico", dial: "52" },
  { name: "Micronesia", dial: "691" },
  { name: "Moldova", dial: "373" },
  { name: "Monaco", dial: "377" },
  { name: "Mongolia", dial: "976" },
  { name: "Montenegro", dial: "382" },
  { name: "Montserrat", dial: "1664", max: 10 },
  { name: "Morocco", dial: "212" },
  { name: "Mozambique", dial: "258" },
  { name: "Myanmar", dial: "95" },
  { name: "Namibia", dial: "264" },
  { name: "Nauru", dial: "674" },
  { name: "Nepal", dial: "977" },
  { name: "Netherlands", dial: "31" },
  { name: "New Caledonia", dial: "687" },
  { name: "New Zealand", dial: "64" },
  { name: "Nicaragua", dial: "505" },
  { name: "Niger", dial: "227" },
  { name: "Nigeria", dial: "234" },
  { name: "North Korea", dial: "850" },
  { name: "North Macedonia", dial: "389" },
  { name: "Northern Mariana Islands", dial: "1670", max: 10 },
  { name: "Norway", dial: "47" },
  { name: "Oman", dial: "968" },
  { name: "Pakistan", dial: "92", max: 10 },
  { name: "Palau", dial: "680" },
  { name: "Palestine", dial: "970" },
  { name: "Panama", dial: "507" },
  { name: "Papua New Guinea", dial: "675" },
  { name: "Paraguay", dial: "595" },
  { name: "Peru", dial: "51" },
  { name: "Philippines", dial: "63" },
  { name: "Poland", dial: "48" },
  { name: "Portugal", dial: "351" },
  { name: "Puerto Rico", dial: "1", max: 10 },
  { name: "Qatar", dial: "974" },
  { name: "Réunion", dial: "262" },
  { name: "Romania", dial: "40" },
  { name: "Russia", dial: "7", max: 10 },
  { name: "Rwanda", dial: "250" },
  { name: "Saint Kitts and Nevis", dial: "1", max: 10 },
  { name: "Saint Lucia", dial: "1", max: 10 },
  { name: "Saint Vincent and the Grenadines", dial: "1", max: 10 },
  { name: "Samoa", dial: "685" },
  { name: "San Marino", dial: "378" },
  { name: "São Tomé and Príncipe", dial: "239" },
  { name: "Saudi Arabia", dial: "966" },
  { name: "Senegal", dial: "221" },
  { name: "Serbia", dial: "381" },
  { name: "Seychelles", dial: "248" },
  { name: "Sierra Leone", dial: "232" },
  { name: "Singapore", dial: "65" },
  { name: "Sint Maarten", dial: "1", max: 10 },
  { name: "Slovakia", dial: "421" },
  { name: "Slovenia", dial: "386" },
  { name: "Solomon Islands", dial: "677" },
  { name: "Somalia", dial: "252" },
  { name: "South Africa", dial: "27" },
  { name: "South Korea", dial: "82", max: 11 },
  { name: "South Sudan", dial: "211" },
  { name: "Spain", dial: "34" },
  { name: "Sri Lanka", dial: "94" },
  { name: "Sudan", dial: "249" },
  { name: "Suriname", dial: "597" },
  { name: "Sweden", dial: "46" },
  { name: "Switzerland", dial: "41" },
  { name: "Syria", dial: "963" },
  { name: "Taiwan", dial: "886" },
  { name: "Tajikistan", dial: "992" },
  { name: "Tanzania", dial: "255" },
  { name: "Thailand", dial: "66" },
  { name: "Timor-Leste", dial: "670" },
  { name: "Togo", dial: "228" },
  { name: "Tonga", dial: "676" },
  { name: "Trinidad and Tobago", dial: "1", max: 10 },
  { name: "Tunisia", dial: "216" },
  { name: "Turkey", dial: "90" },
  { name: "Turkmenistan", dial: "993" },
  { name: "Turks and Caicos Islands", dial: "1", max: 10 },
  { name: "Tuvalu", dial: "688" },
  { name: "Uganda", dial: "256" },
  { name: "Ukraine", dial: "380" },
  { name: "United Arab Emirates", dial: "971" },
  { name: "United Kingdom", dial: "44" },
  { name: "United States", dial: "1", max: 10 },
  { name: "Uruguay", dial: "598" },
  { name: "US Virgin Islands", dial: "1", max: 10 },
  { name: "Uzbekistan", dial: "998" },
  { name: "Vanuatu", dial: "678" },
  { name: "Vatican City", dial: "379" },
  { name: "Venezuela", dial: "58" },
  { name: "Vietnam", dial: "84" },
  { name: "Yemen", dial: "967" },
  { name: "Zambia", dial: "260" },
  { name: "Zimbabwe", dial: "263" },
];

function maxDigitsFor(countryCode: string): number {
  const found = COUNTRIES.find((c) => `+${c.dial}` === countryCode);
  return found?.max ?? 15;
}

function countryNameFor(countryCode: string): string {
  const found = COUNTRIES.find((c) => `+${c.dial}` === countryCode);
  return found?.name ?? "your country";
}

const field = "brut w-full rounded-2xl bg-paper px-4 py-3 text-base text-ink outline-none placeholder:text-ink-muted focus:bg-sheet";

const SECTIONS = ["About You", "How You Would Use MindMesh", "Beta Testing", "Your Motivation", "Verify Identity"] as const;
const LAST = SECTIONS.length - 1;
const MOTIVATION = SECTIONS.length - 2;

export function BetaApplicationForm() {
  const [step, setStep] = useState(0);
  // Controlled so the values survive stepping: the step-0 inputs unmount once
  // the user advances, so FormData cannot read them back at submit time.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>("Student");
  const [useCases, setUseCases] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [timeCommitment, setTimeCommitment] = useState<(typeof TIME_COMMITMENTS)[number]>(TIME_COMMITMENTS[2]!);
  const [comfortLevel, setComfortLevel] = useState<(typeof COMFORT_LEVELS)[number]>(COMFORT_LEVELS[0]!);
  const [willingness, setWillingness] = useState<(typeof WILLINGNESS)[number]>(WILLINGNESS[0]!);
  const [motivation, setMotivation] = useState("");
  const [anythingElse, setAnythingElse] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [showDiscord, setShowDiscord] = useState(false);

  const phoneMax = maxDigitsFor(countryCode);

  // Per-form invite: every successful submit shows the Discord popup after the
  // thank-you panel appears. No cross-form suppression — each form owns its invite.
  useEffect(() => {
    if (state !== "done") return;
    const t = window.setTimeout(() => setShowDiscord(true), 700);
    return () => window.clearTimeout(t);
  }, [state]);

  function toggle(list: string[], set: (v: string[]) => void, value: string, max: number) {
    if (list.includes(value)) set(list.filter((v) => v !== value));
    else if (list.length < max) set([...list, value]);
  }

  // Per-step validation so Next never advances on incomplete input. Step 2 has
  // no rules: every option there already carries a default.
  function validate(s: number, current: { name: string; email: string }): boolean {
    const errs: Record<string, string> = {};
    if (s === 0) {
      if (!current.name.trim()) errs["name"] = "Tell us your name";
      if (!current.email.trim()) errs["email"] = "Enter your email";
      else if (!z.string().email().safeParse(current.email).success) errs["email"] = "Enter a valid email";
    }
    if (s === 1) {
      if (useCases.length === 0) errs["useCases"] = "Select at least one";
      if (features.length === 0) errs["features"] = "Select at least one";
    }
    if (s === MOTIVATION && motivation.trim().length < 10) {
      errs["motivation"] = "At least 10 characters";
    }
    if (s === LAST) {
      if (!isLinkedInProfile(linkedin)) errs["linkedin"] = "Enter your real LinkedIn profile URL";
      if (!isGitHubProfile(github)) errs["github"] = "Enter your real GitHub profile URL";
      const digits = phone.replace(/\D/g, "");
      if (digits) {
        const max = maxDigitsFor(countryCode);
        if (digits.length < 7 || digits.length > max) {
          errs["phone"] = `Enter a valid phone number (7–${max} digits)`;
        }
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const next = () => {
    if (validate(step, { name, email })) setStep((s) => Math.min(s + 1, LAST));
  };

  const back = () => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  };

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate(LAST, { name, email })) return;

    const parsed = schema.safeParse({
      name, email, role,
      useCases, features, timeCommitment, comfortLevel, willingness,
      motivation, anythingElse: anythingElse || undefined,
      linkedin, github, countryCode, phone: phone || undefined,
    });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const i of parsed.error.issues) errs[String(i.path[0])] = i.message;
      setErrors(errs); return;
    }
    setErrors({}); setState("sending");

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          name: parsed.data.name,
          email: parsed.data.email,
          role: parsed.data.role,
          useCases: parsed.data.useCases,
          features: parsed.data.features,
          timeCommitment: parsed.data.timeCommitment,
          comfortLevel: parsed.data.comfortLevel,
          willingness: parsed.data.willingness,
          motivation: parsed.data.motivation,
          anythingElse: parsed.data.anythingElse ?? null,
          linkedin: normalizeUrl(parsed.data.linkedin),
          github: normalizeUrl(parsed.data.github),
          countryCode: parsed.data.countryCode,
          phone: (parsed.data.phone ?? "").replace(/\D/g, "") || null,
          phoneFull:
            (parsed.data.phone ?? "").replace(/\D/g, "")
              ? `${parsed.data.countryCode} ${(parsed.data.phone ?? "").replace(/\D/g, "")}`
              : null,
        }),
      });
      setState("done");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="flex min-h-[420px] flex-col items-start justify-center gap-5">
        <span className="brut grid h-16 w-16 place-items-center rounded-2xl bg-orange"><Check className="h-8 w-8" /></span>
        <h2 className="font-display text-4xl uppercase">Application received.</h2>
        <p className="text-ink-muted">Thanks for applying to be a MindMesh Beta Tester. We'll review your application and get back to you soon.</p>
        <DiscordInviteModal open={showDiscord} onClose={() => setShowDiscord(false)} />
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-8">
      <div>
        <div className="flex items-center justify-between font-mono text-xs font-bold uppercase tracking-widest text-ink-muted">
          <span>Step {step + 1} of {SECTIONS.length}</span>
          <span>{SECTIONS[step]}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full border-2 border-ink bg-sheet">
          <motion.div
            className="h-full bg-orange"
            initial={false}
            animate={{ width: `${((step + 1) / SECTIONS.length) * 100}%` }}
            transition={{ duration: 0.35, ease: EASE }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.25, ease: EASE }}
          className="grid gap-8"
        >
          {step === 0 && (
            <div>
              <p className="mb-4 font-mono text-xs font-bold uppercase tracking-widest text-ink-muted">Section 1 — About You</p>
              <div className="grid gap-5">
                <F label="Full Name" err={errors["name"]}><input name="name" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} className={field} placeholder="Ada Lovelace" /></F>
                <F label="Email Address" err={errors["email"]}><input name="email" type="email" maxLength={255} value={email} onChange={(e) => setEmail(e.target.value)} className={field} placeholder="ada@mail.com" /></F>
                <div>
                  <p className="mb-2 font-mono text-xs font-bold uppercase tracking-widest">Which best describes you?</p>
                  <div className="flex flex-wrap gap-2">
                    {ROLES.map((r) => (
                      <button type="button" key={r} onClick={() => setRole(r)}
                        className={`brut-btn rounded-xl px-3 py-2 text-sm font-bold ${role === r ? "bg-orange" : "bg-paper"}`}>{r}</button>
                    ))}
                  </div>
                  {errors["role"] && <p className="mt-2 text-sm font-bold text-orange">{errors["role"]}</p>}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <p className="mb-4 font-mono text-xs font-bold uppercase tracking-widest text-ink-muted">Section 2 — How You Would Use MindMesh</p>
              <div className="grid gap-5">
                <div>
                  <p className="mb-2 font-mono text-xs font-bold uppercase tracking-widest">What would you primarily use MindMesh for? <span className="text-ink-muted">(select up to 3)</span></p>
                  <div className="flex flex-wrap gap-2">
                    {USE_CASES.map((u) => (
                      <button type="button" key={u} onClick={() => toggle(useCases, setUseCases, u, 3)}
                        className={`brut-btn rounded-xl px-3 py-2 text-sm font-bold ${useCases.includes(u) ? "bg-orange" : "bg-paper"}`}>{u}</button>
                    ))}
                  </div>
                  {errors["useCases"] && <p className="mt-2 text-sm font-bold text-orange">{errors["useCases"]}</p>}
                </div>
                <div>
                  <p className="mb-2 font-mono text-xs font-bold uppercase tracking-widest">Which MindMesh features are you most interested in testing? <span className="text-ink-muted">(select up to 3)</span></p>
                  <div className="flex flex-wrap gap-2">
                    {FEATURES.map((f) => (
                      <button type="button" key={f} onClick={() => toggle(features, setFeatures, f, 3)}
                        className={`brut-btn rounded-xl px-3 py-2 text-sm font-bold ${features.includes(f) ? "bg-orange" : "bg-paper"}`}>{f}</button>
                    ))}
                  </div>
                  {errors["features"] && <p className="mt-2 text-sm font-bold text-orange">{errors["features"]}</p>}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="mb-4 font-mono text-xs font-bold uppercase tracking-widest text-ink-muted">Section 3 — Beta Testing</p>
              <div className="grid gap-5">
                <div>
                  <p className="mb-2 font-mono text-xs font-bold uppercase tracking-widest">How much time can you realistically spend testing MindMesh?</p>
                  <div className="flex flex-wrap gap-2">
                    {TIME_COMMITMENTS.map((t) => (
                      <button type="button" key={t} onClick={() => setTimeCommitment(t)}
                        className={`brut-btn rounded-xl px-3 py-2 text-sm font-bold ${timeCommitment === t ? "bg-orange" : "bg-paper"}`}>{t}</button>
                    ))}
                  </div>
                  {errors["timeCommitment"] && <p className="mt-2 text-sm font-bold text-orange">{errors["timeCommitment"]}</p>}
                </div>
                <div>
                  <p className="mb-2 font-mono text-xs font-bold uppercase tracking-widest">Are you comfortable reporting bugs and giving honest feedback?</p>
                  <div className="flex flex-wrap gap-2">
                    {COMFORT_LEVELS.map((c) => (
                      <button type="button" key={c} onClick={() => setComfortLevel(c)}
                        className={`brut-btn rounded-xl px-3 py-2 text-sm font-bold ${comfortLevel === c ? "bg-orange" : "bg-paper"}`}>{c}</button>
                    ))}
                  </div>
                  {errors["comfortLevel"] && <p className="mt-2 text-sm font-bold text-orange">{errors["comfortLevel"]}</p>}
                </div>
                <div>
                  <p className="mb-2 font-mono text-xs font-bold uppercase tracking-widest">Would you be willing to test features that may not be perfect yet?</p>
                  <div className="flex flex-wrap gap-2">
                    {WILLINGNESS.map((w) => (
                      <button type="button" key={w} onClick={() => setWillingness(w)}
                        className={`brut-btn rounded-xl px-3 py-2 text-sm font-bold ${willingness === w ? "bg-orange" : "bg-paper"}`}>{w}</button>
                    ))}
                  </div>
                  {errors["willingness"] && <p className="mt-2 text-sm font-bold text-orange">{errors["willingness"]}</p>}
                </div>
              </div>
            </div>
          )}

          {step === MOTIVATION && (
            <div>
              <p className="mb-4 font-mono text-xs font-bold uppercase tracking-widest text-ink-muted">Section 4 — Your Motivation</p>
              <div className="grid gap-5">
                <F label="Why do you want to become a MindMesh Beta Tester?" err={errors["motivation"]}>
                  <textarea name="motivation" rows={5} maxLength={2000} value={motivation} onChange={(e) => setMotivation(e.target.value)} className={field} placeholder="This is your most important selection question. Tell us about your genuine problem and why you want to test MindMesh…" />
                </F>
                <F label="Is there anything else you'd like me to know? (optional)">
                  <textarea name="anythingElse" rows={3} maxLength={2000} value={anythingElse} onChange={(e) => setAnythingElse(e.target.value)} className={field} placeholder="Anything else on your mind…" />
                </F>
              </div>
            </div>
          )}

          {step === LAST && (
            <div>
              <p className="mb-4 font-mono text-xs font-bold uppercase tracking-widest text-ink-muted">Section 5 — Verify Identity</p>
              <div className="brut mb-5 flex gap-3 rounded-2xl bg-paper p-4">
                <span className="brut grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange"><ShieldCheck className="h-5 w-5" /></span>
                <p className="text-sm text-ink-muted">Share your <span className="font-bold text-ink">real</span> profiles — this information helps us effectively select genuine beta testers and build a trustworthy community. Fake or placeholder links will lead to rejection.</p>
              </div>
              <div className="grid gap-5">
                <F label="LinkedIn Profile" err={errors["linkedin"]}>
                  <input name="linkedin" inputMode="url" autoComplete="url" maxLength={255} value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className={field} placeholder="https://www.linkedin.com/in/your-name" />
                </F>
                <F label="GitHub Profile" err={errors["github"]}>
                  <input name="github" inputMode="url" autoComplete="url" maxLength={255} value={github} onChange={(e) => setGithub(e.target.value)} className={field} placeholder="https://github.com/your-username" />
                </F>
                <div className="grid gap-2">
                  <span className="font-mono text-xs font-bold uppercase tracking-widest">Phone Number (optional)</span>
                  <div className="flex gap-2">
                    <select
                      name="countryCode"
                      aria-label="Country code"
                      value={countryCode}
                      onChange={(e) => {
                        setCountryCode(e.target.value);
                        setPhone((p) => p.replace(/\D/g, "").slice(0, maxDigitsFor(e.target.value)));
                      }}
                      className="brut w-36 shrink-0 rounded-2xl bg-paper px-3 py-3 text-sm font-bold text-ink outline-none"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={`${c.name}-${c.dial}`} value={`+${c.dial}`}>
                          {c.name} (+{c.dial})
                        </option>
                      ))}
                    </select>
                    <input
                      name="phone"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      maxLength={phoneMax}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, phoneMax))}
                      className={`${field} flex-1`}
                      placeholder={countryCode === "+91" ? "98765 43210" : "Your number"}
                    />
                  </div>
                  {errors["phone"] && <span className="text-sm font-bold text-orange">{errors["phone"]}</span>}
                  <p className="text-xs text-ink-muted">Digits only — up to {phoneMax} digits for {countryNameFor(countryCode)}.</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {state === "error" && <p className="font-bold text-orange">Something went wrong — please try again.</p>}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm font-bold text-ink-muted">Become a MindMesh Beta Tester</p>
          <p className="mt-1 text-sm text-ink-muted">Get early access. Test new capabilities. Help shape MindMesh before public launch.</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {step > 0 && (
            <button type="button" onClick={back} className="brut-btn inline-flex items-center gap-2 rounded-2xl bg-paper px-5 py-4 text-base font-bold">
              <ArrowLeft className="h-5 w-5" /> Back
            </button>
          )}
          {step < LAST ? (
            <button type="button" onClick={next} className="brut-btn inline-flex items-center gap-2 rounded-2xl bg-orange px-6 py-4 text-base font-bold hover:bg-orange-hover">
              Next <ArrowRight className="h-5 w-5" />
            </button>
          ) : (
            <button type="submit" disabled={state === "sending"} className="brut-btn inline-flex items-center justify-center gap-2 rounded-2xl bg-orange px-6 py-4 text-lg font-bold hover:bg-orange-hover disabled:opacity-60">
              {state === "sending" ? "Submitting…" : <>Submit Application <Send className="h-5 w-5" /></>}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

function F({ label, err, children }: { label: string; err?: string | undefined; children: ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="font-mono text-xs font-bold uppercase tracking-widest">{label}</span>
      {children}
      {err && <span className="text-sm font-bold text-orange">{err}</span>}
    </label>
  );
}