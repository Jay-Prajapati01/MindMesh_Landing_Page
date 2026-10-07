"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { z } from "zod";
import { Check, Send, ArrowLeft, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const ROLES = ["Student", "Developer / Engineer", "Researcher", "Creator", "Founder / Entrepreneur", "Working Professional", "Other"] as const;
const SAVE_TYPES = ["YouTube videos", "Web pages / Articles", "PDFs / Documents", "Notes", "Instagram / Social Media content", "Other"] as const;
const PROBLEMS = ["I can't find it later", "I forget what I learned", "My information is scattered everywhere", "I save too much and rarely revisit it", "Searching through everything takes too much time", "I don't really have this problem"] as const;
const INTERESTS = ["Remember what I learn", "Find information I've saved", "Search across all my knowledge", "Connect information from different sources", "Ask AI questions about my knowledge", "All of the above"] as const;

const schema = z.object({
  name: z.string().trim().min(1, "Tell us your name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  role: z.enum(ROLES),
  saveTypes: z.array(z.enum(SAVE_TYPES)).min(1, "Select at least one"),
  problem: z.enum(PROBLEMS),
  interests: z.array(z.enum(INTERESTS)).min(1, "Select at least one"),
  wish: z.string().trim().max(500).optional(),
});

// Apps Script web app deployed by the owner. Configure access as "Anyone".
// NB: no-cors means the response is opaque, so a 4xx from Apps Script still
// resolves as success here. The sheet is the source of truth; verify there.
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwrw5tZFccJDF9MM-HWRrga19hzBE65637kRbQk4Iq_0067h1zfPvUCbaZls2xhh3FM1w/exec";

const field = "brut w-full rounded-2xl bg-paper px-4 py-3 text-base text-ink outline-none placeholder:text-ink-muted focus:bg-sheet";

// Default is null so a consumer rendered outside the provider throws loudly.
// An object default (a no-op open) would silently swallow every click, which is
// exactly the bug this replaces.
const WaitlistContext = createContext<{ open: () => void } | null>(null);

export function useWaitlist() {
  const ctx = useContext(WaitlistContext);
  if (!ctx) {
    throw new Error("useWaitlist() must be called inside <WaitlistProvider>");
  }
  return ctx;
}

export function WaitlistProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>("Student");
  const [saveTypes, setSaveTypes] = useState<string[]>([]);
  const [problem, setProblem] = useState<(typeof PROBLEMS)[number]>(PROBLEMS[0]!);
  const [interests, setInterests] = useState<string[]>([]);
  const [wish, setWish] = useState("");
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  const open = () => {
    // Reset everything so a returning visitor never sees the previous answers
    // still sitting in the fields after a submission.
    setStep(0);
    setState("idle");
    setErrors({});
    setName("");
    setEmail("");
    setRole("Student");
    setSaveTypes([]);
    setProblem(PROBLEMS[0]!);
    setInterests([]);
    setWish("");
    setIsOpen(true);
  };

  const close = () => setIsOpen(false);

  function toggle(list: string[], set: (v: string[]) => void, value: string) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  function validateStep(s: number): boolean {
    const errs: Record<string, string> = {};
    if (s === 0) {
      if (!name.trim()) errs["name"] = "Tell us your name";
      if (!email.trim()) errs["email"] = "Enter your email";
      else if (!z.string().email().safeParse(email).success) errs["email"] = "Enter a valid email";
    }
    if (s === 1 && saveTypes.length === 0) errs["saveTypes"] = "Select at least one";
    if (s === 3 && interests.length === 0) errs["interests"] = "Select at least one";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, 3));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit() {
    if (!validateStep(3)) return;

    const parsed = schema.safeParse({
      name, email, role, saveTypes, problem, interests, wish: wish || undefined,
    });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const i of parsed.error.issues) errs[String(i.path[0])] = i.message;
      setErrors(errs);
      return;
    }
    setErrors({});
    setState("sending");

    const payload = {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      saveTypes: parsed.data.saveTypes,
      problem: parsed.data.problem,
      interests: parsed.data.interests,
      wish: parsed.data.wish ?? null,
    };

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
      setState("done");
    } catch {
      setState("error");
    }
  }

  const success = (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="brut max-w-lg rounded-3xl border-2 border-ink bg-paper p-8 shadow-[6px_6px_0_var(--ink)]">
        <div className="flex flex-col items-start justify-center gap-5">
          <span className="brut grid h-16 w-16 place-items-center rounded-2xl bg-orange"><Check className="h-8 w-8" /></span>
          <h2 className="font-display text-4xl uppercase">You're on the list.</h2>
          <p className="text-ink-muted">Thanks for joining the MindMesh early access. We'll be in touch soon.</p>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <WaitlistContext.Provider value={{ open }}>
      {children}
      {state === "done" ? (
        success
      ) : (
        <>
      <Dialog open={isOpen && step === 0} onOpenChange={(o) => { if (!o) close(); }}>
        <DialogContent className="brut max-w-lg rounded-3xl border-2 border-ink bg-paper p-6 shadow-[6px_6px_0_var(--ink)] md:p-8">
          <div className="mb-4">
            <span className="font-mono text-xs font-bold text-ink-muted">Step 1 of 4</span>
            <h3 className="font-display mt-1 text-2xl uppercase">About You</h3>
          </div>
          <div className="grid gap-5">
            <F label="Full Name" err={errors["name"]}>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} className={field} placeholder="Ada Lovelace" />
            </F>
            <F label="Email Address" err={errors["email"]}>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} className={field} placeholder="ada@mail.com" />
            </F>
            <div>
              <p className="mb-2 font-mono text-xs font-bold uppercase tracking-widest">Which best describes you?</p>
              <div className="flex flex-wrap gap-2">
                {ROLES.map((r) => (
                  <button type="button" key={r} onClick={() => setRole(r)}
                    className={`brut-btn rounded-xl px-3 py-2 text-sm font-bold ${role === r ? "bg-orange" : "bg-paper"}`}>{r}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button onClick={next} className="brut-btn inline-flex items-center gap-2 rounded-xl bg-orange px-6 py-3 text-sm font-bold hover:bg-orange-hover">
              Next <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isOpen && step === 1} onOpenChange={(o) => { if (!o) close(); }}>
        <DialogContent className="brut max-w-lg rounded-3xl border-2 border-ink bg-paper p-6 shadow-[6px_6px_0_var(--ink)] md:p-8">
          <div className="mb-4">
            <span className="font-mono text-xs font-bold text-ink-muted">Step 2 of 4</span>
            <h3 className="font-display mt-1 text-2xl uppercase">Your Information</h3>
          </div>
          <div>
            <p className="mb-2 font-mono text-xs font-bold uppercase tracking-widest">What do you usually save for later?</p>
            <div className="flex flex-wrap gap-2">
              {SAVE_TYPES.map((s) => (
                <button type="button" key={s} onClick={() => toggle(saveTypes, setSaveTypes, s)}
                  className={`brut-btn rounded-xl px-3 py-2 text-sm font-bold ${saveTypes.includes(s) ? "bg-orange" : "bg-paper"}`}>{s}</button>
              ))}
            </div>
            {errors["saveTypes"] && <p className="mt-2 text-sm font-bold text-orange">{errors["saveTypes"]}</p>}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <button onClick={back} className="brut-btn inline-flex items-center gap-2 rounded-xl bg-paper px-4 py-3 text-sm font-bold">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button onClick={next} className="brut-btn inline-flex items-center gap-2 rounded-xl bg-orange px-6 py-3 text-sm font-bold hover:bg-orange-hover">
              Next <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isOpen && step === 2} onOpenChange={(o) => { if (!o) close(); }}>
        <DialogContent className="brut max-w-lg rounded-3xl border-2 border-ink bg-paper p-6 shadow-[6px_6px_0_var(--ink)] md:p-8">
          <div className="mb-4">
            <span className="font-mono text-xs font-bold text-ink-muted">Step 3 of 4</span>
            <h3 className="font-display mt-1 text-2xl uppercase">Your Problem</h3>
          </div>
          <div>
            <p className="mb-2 font-mono text-xs font-bold uppercase tracking-widest">What's the biggest problem you face with the information you save?</p>
            <div className="flex flex-wrap gap-2">
              {PROBLEMS.map((p) => (
                <button type="button" key={p} onClick={() => setProblem(p)}
                  className={`brut-btn rounded-xl px-3 py-2 text-sm font-bold ${problem === p ? "bg-orange" : "bg-paper"}`}>{p}</button>
              ))}
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <button onClick={back} className="brut-btn inline-flex items-center gap-2 rounded-xl bg-paper px-4 py-3 text-sm font-bold">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button onClick={next} className="brut-btn inline-flex items-center gap-2 rounded-xl bg-orange px-6 py-3 text-sm font-bold hover:bg-orange-hover">
              Next <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isOpen && step === 3} onOpenChange={(o) => { if (!o) close(); }}>
        <DialogContent className="brut max-w-lg rounded-3xl border-2 border-ink bg-paper p-6 shadow-[6px_6px_0_var(--ink)] md:p-8">
          <div className="mb-4">
            <span className="font-mono text-xs font-bold text-ink-muted">Step 4 of 4</span>
            <h3 className="font-display mt-1 text-2xl uppercase">MindMesh</h3>
          </div>
          <div className="grid gap-5">
            <div>
              <p className="mb-2 font-mono text-xs font-bold uppercase tracking-widest">What would you most want MindMesh to help you with?</p>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((i) => (
                  <button type="button" key={i} onClick={() => toggle(interests, setInterests, i)}
                    className={`brut-btn rounded-xl px-3 py-2 text-sm font-bold ${interests.includes(i) ? "bg-orange" : "bg-paper"}`}>{i}</button>
                ))}
              </div>
              {errors["interests"] && <p className="mt-2 text-sm font-bold text-orange">{errors["interests"]}</p>}
            </div>
            <F label="What would you like MindMesh to help you do that you currently can't? (optional)">
              <textarea rows={3} maxLength={500} value={wish} onChange={(e) => setWish(e.target.value)} className={field} placeholder="Tell us your wish…" />
            </F>
          </div>
          {state === "error" && <p className="mt-4 font-bold text-orange">Something went wrong — please try again.</p>}
          <div className="mt-6 flex items-center justify-between">
            <button onClick={back} className="brut-btn inline-flex items-center gap-2 rounded-xl bg-paper px-4 py-3 text-sm font-bold">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button onClick={submit} disabled={state === "sending"} className="brut-btn inline-flex items-center justify-center gap-2 rounded-xl bg-orange px-6 py-3 text-sm font-bold hover:bg-orange-hover disabled:opacity-60">
              {state === "sending" ? "Submitting…" : <>Submit <Send className="h-4 w-4" /></>}
            </button>
          </div>
        </DialogContent>
      </Dialog>
        </>
      )}
    </WaitlistContext.Provider>
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
