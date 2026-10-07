import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Check, Send } from "lucide-react";
import { motion } from "motion/react";
import { Navbar, Footer } from "@/components/landing/Sections";
import { Crumb, EASE } from "@/components/landing/ui";

// Contact responses sheet. The tab must be named 'Contact' (the script renames
// the first tab automatically if it is missing). Same no-cors caveat as the
// other two forms: a 4xx from Apps Script still resolves as success here, so
// the sheet is the source of truth, not the success panel.
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyDECdUtmZM7deik9ESwukFcG2K1lK3RrEcUPZn0fZa9YSjn6CUNTH2Z0pqohdgsvnk/exec";

const TITLE = "Contact MindMesh | Talk to the team";
const DESC = "Questions, partnerships or self-hosting help? Send the MindMesh team a message and we'll get back to you.";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

const TOPICS = ["General", "Self-hosting", "Partnership", "Bug / feedback"] as const;

const schema = z.object({
  name: z.string().trim().min(1, "Tell us your name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  company: z.string().trim().max(120).optional(),
  topic: z.enum(TOPICS),
  message: z.string().trim().min(10, "At least 10 characters").max(2000),
});

const field = "brut w-full rounded-2xl bg-paper px-4 py-3 text-base text-ink outline-none placeholder:text-ink-muted focus:bg-sheet";

function ContactPage() {
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>("General");
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      name: fd.get("name"), email: fd.get("email"),
      company: (fd.get("company") as string) || undefined, topic, message: fd.get("message"),
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
          company: parsed.data.company ?? null,
          topic: parsed.data.topic,
          message: parsed.data.message,
        }),
      });
      setState("done");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="paper-grain min-h-screen overflow-x-clip bg-paper text-ink">
      <Navbar />
      <main className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1fr_1.15fr] md:py-20">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
          <Crumb label="Contact" />
          <h1 className="mt-5 font-display text-[clamp(3rem,8vw,6.5rem)] uppercase leading-[0.9] tracking-[-0.04em]">
            Let's talk <span className="text-orange">brains.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg text-ink-muted">Questions about MindMesh, self-hosting help, or a partnership idea — drop us a line and the team will reply.</p>
          <div className="brut mt-8 rounded-3xl bg-paper-card p-6">
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-ink-muted">[ Get in touch ]</p>
            <p className="mt-2 font-display text-2xl uppercase">Questions · Ideas · Partnerships</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
          className="brut rounded-3xl bg-paper-card p-6 md:p-8">
          {state === "done" ? (
            <div className="flex min-h-[420px] flex-col items-start justify-center gap-5">
              <span className="brut grid h-16 w-16 place-items-center rounded-2xl bg-orange"><Check className="h-8 w-8" /></span>
              <h2 className="font-display text-4xl uppercase">Message received.</h2>
              <p className="text-ink-muted">Thanks for reaching out — we'll get back to you soon.</p>
              <Link to="/" className="brut-btn rounded-2xl bg-paper px-5 py-3 font-bold">Back to MindMesh</Link>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="grid gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <F label="Name" err={errors["name"]}><input name="name" maxLength={100} className={field} placeholder="Ada Lovelace" /></F>
                <F label="Email" err={errors["email"]}><input name="email" type="email" maxLength={255} className={field} placeholder="ada@mail.com" /></F>
              </div>
              <F label="Company (optional)"><input name="company" maxLength={120} className={field} placeholder="Analytical Engines Ltd" /></F>
              <div>
                <p className="mb-2 font-mono text-xs font-bold uppercase tracking-widest">Topic</p>
                <div className="flex flex-wrap gap-2">
                  {TOPICS.map((t) => (
                    <button type="button" key={t} onClick={() => setTopic(t)}
                      className={`brut-btn rounded-xl px-3 py-2 text-sm font-bold ${topic === t ? "bg-orange" : "bg-paper"}`}>{t}</button>
                  ))}
                </div>
              </div>
              <F label="Message" err={errors["message"]}><textarea name="message" rows={5} maxLength={2000} className={field} placeholder="Tell us what's on your mind…" /></F>
              {state === "error" && <p className="font-bold text-orange">Something went wrong — please try again.</p>}
              <button disabled={state === "sending"} className="brut-btn inline-flex items-center justify-center gap-2 rounded-2xl bg-orange px-6 py-4 text-lg font-bold hover:bg-orange-hover disabled:opacity-60">
                {state === "sending" ? "Sending…" : <>Send message <Send className="h-5 w-5" /></>}
              </button>
            </form>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
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
