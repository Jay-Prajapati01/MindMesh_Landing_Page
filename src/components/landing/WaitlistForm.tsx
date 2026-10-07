import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Check, Send } from "lucide-react";
import { motion } from "motion/react";
import { Label, EASE } from "./ui";

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

const field = "brut w-full rounded-2xl bg-paper px-4 py-3 text-base text-ink outline-none placeholder:text-ink-muted focus:bg-sheet";

export function WaitlistForm() {
  const [role, setRole] = useState<(typeof ROLES)[number]>("Student");
  const [saveTypes, setSaveTypes] = useState<string[]>([]);
  const [problem, setProblem] = useState<(typeof PROBLEMS)[number]>(PROBLEMS[0]!);
  const [interests, setInterests] = useState<string[]>([]);
  const [wish, setWish] = useState("");
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  function toggle(list: string[], set: (v: string[]) => void, value: string) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      name: fd.get("name"), email: fd.get("email"), role,
      saveTypes, problem, interests, wish: wish || undefined,
    });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const i of parsed.error.issues) errs[String(i.path[0])] = i.message;
      setErrors(errs); return;
    }
    setErrors({}); setState("sending");

    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwrw5tZFccJDF9MM-HWRrga19hzBE65637kRbQk4Iq_0067h1zfPvUCbaZls2xhh3FM1w/exec";

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
        // Apps Script sends no CORS headers, so the response is opaque and
        // cannot be read here. text/plain is CORS-safelisted, which keeps the
        // request simple and avoids a preflight. NOTE: this cannot detect a
        // server-side rejection -- see handleSubmit for how that is verified.
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
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
        <h2 className="font-display text-4xl uppercase">You're on the list.</h2>
        <p className="text-ink-muted">Thanks for joining the MindMesh early access. We'll be in touch soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-8">
      <div>
        <p className="mb-4 font-mono text-xs font-bold uppercase tracking-widest text-ink-muted">Section 1 — About You</p>
        <div className="grid gap-5">
          <F label="Full Name" err={errors["name"]}><input name="name" maxLength={100} className={field} placeholder="Ada Lovelace" /></F>
          <F label="Email Address" err={errors["email"]}><input name="email" type="email" maxLength={255} className={field} placeholder="ada@mail.com" /></F>
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

      <div>
        <p className="mb-4 font-mono text-xs font-bold uppercase tracking-widest text-ink-muted">Section 2 — Your Information</p>
        <p className="mb-2 font-mono text-xs font-bold uppercase tracking-widest">What do you usually save for later?</p>
        <div className="flex flex-wrap gap-2">
          {SAVE_TYPES.map((s) => (
            <button type="button" key={s} onClick={() => toggle(saveTypes, setSaveTypes, s)}
              className={`brut-btn rounded-xl px-3 py-2 text-sm font-bold ${saveTypes.includes(s) ? "bg-orange" : "bg-paper"}`}>{s}</button>
          ))}
        </div>
        {errors["saveTypes"] && <p className="mt-2 text-sm font-bold text-orange">{errors["saveTypes"]}</p>}
      </div>

      <div>
        <p className="mb-4 font-mono text-xs font-bold uppercase tracking-widest text-ink-muted">Section 3 — Your Problem</p>
        <p className="mb-2 font-mono text-xs font-bold uppercase tracking-widest">What's the biggest problem you face with the information you save?</p>
        <div className="flex flex-wrap gap-2">
          {PROBLEMS.map((p) => (
            <button type="button" key={p} onClick={() => setProblem(p)}
              className={`brut-btn rounded-xl px-3 py-2 text-sm font-bold ${problem === p ? "bg-orange" : "bg-paper"}`}>{p}</button>
          ))}
        </div>
        {errors["problem"] && <p className="mt-2 text-sm font-bold text-orange">{errors["problem"]}</p>}
      </div>

      <div>
        <p className="mb-4 font-mono text-xs font-bold uppercase tracking-widest text-ink-muted">Section 4 — MindMesh</p>
        <p className="mb-2 font-mono text-xs font-bold uppercase tracking-widest">What would you most want MindMesh to help you with?</p>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((i) => (
            <button type="button" key={i} onClick={() => toggle(interests, setInterests, i)}
              className={`brut-btn rounded-xl px-3 py-2 text-sm font-bold ${interests.includes(i) ? "bg-orange" : "bg-paper"}`}>{i}</button>
          ))}
        </div>
        {errors["interests"] && <p className="mt-2 text-sm font-bold text-orange">{errors["interests"]}</p>}
        <div className="mt-5">
          <F label="What would you like MindMesh to help you do that you currently can't? (optional)">
            <textarea name="wish" rows={3} maxLength={500} value={wish} onChange={(e) => setWish(e.target.value)} className={field} placeholder="Tell us your wish…" />
          </F>
        </div>
      </div>

      {state === "error" && <p className="font-bold text-orange">Something went wrong — please try again.</p>}
      <div>
        <p className="mb-3 font-mono text-sm font-bold text-ink-muted">Join the MindMesh Early Access</p>
        <p className="mb-4 text-sm text-ink-muted">Be among the first to experience MindMesh.</p>
        <button disabled={state === "sending"} className="brut-btn inline-flex items-center justify-center gap-2 rounded-2xl bg-orange px-6 py-4 text-lg font-bold hover:bg-orange-hover disabled:opacity-60">
          {state === "sending" ? "Submitting…" : <>Submit <Send className="h-5 w-5" /></>}
        </button>
      </div>
    </form>
  );
}

function F({ label, err, children }: { label: string; err?: string | undefined; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="font-mono text-xs font-bold uppercase tracking-widest">{label}</span>
      {children}
      {err && <span className="text-sm font-bold text-orange">{err}</span>}
    </label>
  );
}
