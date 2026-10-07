import { useState, type FormEvent, type ReactNode } from "react";
import { z } from "zod";
import { Check, Send, ArrowLeft, ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { EASE } from "./ui";

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
});

const field = "brut w-full rounded-2xl bg-paper px-4 py-3 text-base text-ink outline-none placeholder:text-ink-muted focus:bg-sheet";

const SECTIONS = ["About You", "How You Would Use MindMesh", "Beta Testing", "Your Motivation"] as const;
const LAST = SECTIONS.length - 1;

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
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

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
    if (s === LAST && motivation.trim().length < 10) {
      errs["motivation"] = "At least 10 characters";
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

          {step === LAST && (
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