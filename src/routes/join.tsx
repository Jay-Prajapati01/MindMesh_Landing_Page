import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Navbar, Footer } from "@/components/landing/Sections";
import { Crumb, EASE } from "@/components/landing/ui";
import { WaitlistForm } from "@/components/landing/WaitlistForm";

const TITLE = "Join MindMesh Early Access";
const DESC = "Be among the first to experience MindMesh — your AI Personal Knowledge Operating System.";

export const Route = createFileRoute("/join")({
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
  component: JoinPage,
});

function JoinPage() {
  return (
    <div className="paper-grain min-h-screen overflow-x-clip bg-paper text-ink">
      <Navbar />
      <main className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1fr_1.15fr] md:py-20">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
          <Crumb label="Early Access" />
          <h1 className="mt-5 font-display text-[clamp(3rem,8vw,6.5rem)] uppercase leading-[0.9] tracking-[-0.04em]">
            Join the <span className="text-orange">waitlist.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg text-ink-muted">Be among the first to experience MindMesh. Understand your audience and measure genuine interest.</p>
          <div className="brut mt-8 rounded-3xl bg-paper-card p-6">
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-ink-muted">[ ~1 minute ]</p>
            <p className="mt-2 font-display text-2xl uppercase">Quick & easy</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
          className="brut rounded-3xl bg-paper-card p-6 md:p-8">
          <WaitlistForm />
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
