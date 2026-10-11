import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

export const DISCORD_INVITE_URL = "https://discord.gg/cKs6pEjwn";

type Props = {
  open: boolean;
  onClose: () => void;
};

function ClydeMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 127.14 96.36"
      aria-hidden="true"
      focusable="false"
      className={className}
      fill="currentColor"
    >
      <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83A97.68 97.68 0 0 0 49 6.83 72.37 72.37 0 0 0 45.64 0 105.89 105.89 0 0 0 19.39 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.71 16.46 77.8 77.8 0 0 0 6.75-10.89 68.42 68.42 0 0 1-10.68-5.1c.9-.66 1.77-1.35 2.62-2.07a75.59 75.59 0 0 0 64.28 0c.86.72 1.73 1.41 2.63 2.07a68.21 68.21 0 0 1-10.68 5.1 77.8 77.8 0 0 0 6.74 10.89 105.12 105.12 0 0 0 32.71-16.46c2.6-27.31-4.43-51-18.78-72.14ZM42.45 65.69C36.18 65.69 31 60 31 53s5-12.74 11.43-12.74S54 46 53.89 53s-5.05 12.69-11.44 12.69Zm42.24 0C78.41 65.69 73.31 60 73.31 53s5-12.74 11.43-12.74S96.23 46 96.12 53s-5.04 12.69-11.43 12.69Z" />
    </svg>
  );
}

export function DiscordInviteModal({ open, onClose }: Props) {
  const joinRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => joinRef.current?.focus(), 60);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
          role="presentation"
          aria-hidden={false}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="discord-invite-title"
            aria-describedby="discord-invite-body"
            className="brut relative w-full max-w-md rounded-3xl bg-paper-card p-6 text-ink md:p-8"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Discord invite"
              className="brut-btn absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl bg-paper"
            >
              <X className="h-4 w-4" />
            </button>

            <p className="font-mono text-xs font-bold uppercase tracking-widest text-ink-muted">
              [ Discord ]
            </p>
            <h2
              id="discord-invite-title"
              className="mt-3 font-display text-3xl uppercase leading-none"
            >
              One last thing — join the Discord.
            </h2>
            <p id="discord-invite-body" className="mt-3 text-ink-muted">
              All announcements and updates land on our Discord server first, and that&apos;s where
              we discuss everything with you.
            </p>

            <a
              ref={joinRef}
              href={DISCORD_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="brut-btn mt-6 inline-flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-4 text-lg font-bold text-white"
              style={{ backgroundColor: "#5865F2" }}
            >
              <ClydeMark className="h-7 w-7 shrink-0 text-white" />
              Join the Discord Server
            </a>
            <p className="mt-3 break-all text-center font-mono text-xs text-ink-muted">
              {DISCORD_INVITE_URL}
            </p>

            <div className="mt-2 text-center">
              <button
                type="button"
                onClick={onClose}
                className="font-bold text-ink-muted underline underline-offset-4 hover:text-ink"
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
