"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

const GLYPHS = ["✦", "✧", "✶", "✷", "✸", "✹", "✺", "✻"];
const PHRASES = [
  "Analyzing your request…",
  "Selecting modules…",
  "Composing contract…",
  "Reviewing security…",
  "Checking compatibility…",
];

export function TypingIndicator() {
  const [glyphIndex, setGlyphIndex] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(
    () => Math.floor(Math.random() * PHRASES.length),
  );

  useEffect(() => {
    const id = setInterval(
      () => setGlyphIndex((i) => (i + 1) % GLYPHS.length),
      100,
    );
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(
      () => setPhraseIndex((i) => (i + 1) % PHRASES.length),
      1500,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex items-center gap-2 py-2"
    >
      <span className="w-5 text-center text-base text-ink-secondary">
        {GLYPHS[glyphIndex]}
      </span>
      <AnimatePresence mode="wait">
        <motion.span
          key={phraseIndex}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="text-sm text-ink-secondary"
        >
          {PHRASES[phraseIndex]}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
}
