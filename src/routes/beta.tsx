import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Navbar, Footer } from "@/components/landing/Sections";
import { Crumb, EASE } from "@/components/landing/ui";
import { BetaApplicationForm } from "@/components/landing/BetaApplicationForm";

const TITLE = "Become a MindMesh Beta Tester";
const DESC = "Get early access. Test new capabilities. Help shape MindMesh before public launch.";

export const Route = createFileRoute("/beta")({
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
  component: BetaPage,
});

function BetaPage() {
  return (
    <div className="paper-grain min-h-screen overflow-x-clip bg-paper text-ink">
      <Navbar />
      <main className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1fr_1.15fr] md:py-20">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
          <Crumb label="Beta Program" />
          <h1 className="mt-5 font-display text-[clamp(3rem,8vw,6.5rem)] uppercase leading-[0.9] tracking-[-0.04em]">
            Become a <span className="text-orange">beta tester.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg text-ink-muted">Get early access. Test new capabilities. Help shape MindMesh before public launch.</p>
          <div className="brut mt-8 rounded-3xl bg-paper-card p-6">
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-ink-muted">[ ~3–5 minutes ]</p>
            <p className="mt-2 font-display text-2xl uppercase">Serious testers only</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
          className="brut rounded-3xl bg-paper-card p-6 md:p-8">
          <BetaApplicationForm />
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
