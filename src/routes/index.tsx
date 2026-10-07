import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import Lenis from "lenis";
import { IntroReveal } from "@/components/landing/IntroReveal";
import { Hero } from "@/components/landing/Hero";
import { Manifesto } from "@/components/landing/Manifesto";
import { Features } from "@/components/landing/Features";
import { Navbar, Marquee, ProblemSolution, HowItWorks, Bento, Stats, FinalCTA, Footer } from "@/components/landing/Sections";
import { lenisRef } from "@/lib/lenis";

const TITLE = "MindMesh | Your AI Personal Knowledge Operating System";
const DESC = "Capture, understand, connect and ask. MindMesh unifies YouTube, PDFs, audio, Instagram, web and docs into one private, self-hosted brain you can talk to.";

export const Route = createFileRoute("/")({
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
  component: Index,
});

function Index() {
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.1 });
    lenisRef.current = lenis;
    let id = 0;
    const raf = (t: number) => { lenis.raf(t); id = requestAnimationFrame(raf); };
    id = requestAnimationFrame(raf);
    let t = 0;
    const onHold = (e: Event) => {
      lenis.stop();
      const html = document.documentElement;
      html.style.overflow = "hidden";
      clearTimeout(t);
      t = window.setTimeout(() => { html.style.overflow = ""; lenis.start(); }, (e as CustomEvent<number>).detail ?? 2000);
    };
    window.addEventListener("mindmesh:intro-hold", onHold);
    return () => { cancelAnimationFrame(id); clearTimeout(t); window.removeEventListener("mindmesh:intro-hold", onHold); document.documentElement.style.overflow = ""; lenis.destroy(); if (lenisRef.current === lenis) lenisRef.current = null; };
  }, []);

  return (
    <div className="paper-grain min-h-screen overflow-x-clip text-ink">
      <IntroReveal>
        <Navbar />
        <main>
          <Hero />
          <Marquee />
          <Manifesto />
          <ProblemSolution />
          <Features />
          <HowItWorks />
          <Bento />
          <Stats />
          <FinalCTA />
        </main>
        <Footer />
      </IntroReveal>
    </div>
  );
}
