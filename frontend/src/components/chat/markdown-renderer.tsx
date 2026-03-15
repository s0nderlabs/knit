"use client";

import { useEffect, type ComponentPropsWithoutRef } from "react";
import { Streamdown } from "streamdown";

interface MarkdownRendererProps {
  content: string;
  isAnimating?: boolean;
}

const knitCSS = `
  [data-streamdown="code-block"] {
    border-radius: 0.75rem;
    border: 1px solid #E8E8E8;
    overflow: hidden;
    margin: 1rem 0;
  }
  [data-streamdown="code-block-header"] {
    background-color: #F0F0F0;
    border-bottom: 1px solid #E8E8E8;
    padding: 0.5rem 1rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    color: #6B7280;
  }
  [data-streamdown="code-block-body"] {
    background-color: #F4F4F4;
    padding: 1rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.8rem;
    line-height: 1.6;
    color: #242424;
    overflow-x: auto;
  }
  [data-streamdown="code-block-copy-button"],
  [data-streamdown="code-block-download-button"] {
    color: #9CA3AF;
    cursor: pointer;
    padding: 0.25rem;
    transition: color 0.2s;
  }
  [data-streamdown="code-block-copy-button"]:hover,
  [data-streamdown="code-block-download-button"]:hover {
    color: #242424;
  }
`;

const h1 = (props: ComponentPropsWithoutRef<"h1">) => (
  <h1 className="text-2xl font-semibold text-ink mt-6 mb-3" {...props} />
);
const h2 = (props: ComponentPropsWithoutRef<"h2">) => (
  <h2 className="text-xl font-semibold text-ink mt-5 mb-2" {...props} />
);
const h3 = (props: ComponentPropsWithoutRef<"h3">) => (
  <h3 className="text-lg font-semibold text-ink mt-4 mb-2" {...props} />
);
const p = (props: ComponentPropsWithoutRef<"p">) => (
  <p className="mb-3 leading-relaxed text-ink/90" {...props} />
);
const ul = (props: ComponentPropsWithoutRef<"ul">) => (
  <ul className="list-disc pl-5 mb-3 marker:text-accent" {...props} />
);
const ol = (props: ComponentPropsWithoutRef<"ol">) => (
  <ol className="list-decimal pl-5 mb-3 marker:text-accent" {...props} />
);
const li = (props: ComponentPropsWithoutRef<"li">) => (
  <li className="leading-relaxed text-ink/90 mb-1" {...props} />
);
const blockquote = (props: ComponentPropsWithoutRef<"blockquote">) => (
  <blockquote
    className="border-l-2 border-accent/50 pl-4 my-4 text-ink-secondary italic"
    {...props}
  />
);
const a = (props: ComponentPropsWithoutRef<"a">) => (
  <a
    className="text-accent hover:text-accent-hover transition-colors underline underline-offset-2"
    target="_blank"
    rel="noopener noreferrer"
    {...props}
  />
);
const strong = (props: ComponentPropsWithoutRef<"strong">) => (
  <strong className="font-semibold text-ink" {...props} />
);
const em = (props: ComponentPropsWithoutRef<"em">) => (
  <em className="italic text-ink/95" {...props} />
);
const table = (props: ComponentPropsWithoutRef<"table">) => (
  <div className="overflow-x-auto rounded-lg border border-border my-4">
    <table className="w-full text-sm" {...props} />
  </div>
);
const thead = (props: ComponentPropsWithoutRef<"thead">) => (
  <thead className="bg-base" {...props} />
);
const th = (props: ComponentPropsWithoutRef<"th">) => (
  <th
    className="px-4 py-2 text-left font-mono text-xs text-ink-secondary font-semibold border-b border-border"
    {...props}
  />
);
const td = (props: ComponentPropsWithoutRef<"td">) => (
  <td className="px-4 py-2 border-b border-border" {...props} />
);
const hr = (props: ComponentPropsWithoutRef<"hr">) => (
  <hr className="border-none h-px bg-border my-6" {...props} />
);

const STYLE_ID = "knit-markdown-css";

export function MarkdownRenderer({
  content,
  isAnimating = false,
}: MarkdownRendererProps) {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = knitCSS;
    document.head.appendChild(style);
  }, []);

  return (
    <div className="markdown-renderer text-[15px] max-w-2xl">
      <Streamdown
        isAnimating={isAnimating}
        components={
          {
            h1, h2, h3, p, ul, ol, li, blockquote, a, strong, em,
            table, thead, th, td, hr,
          } as any
        }
      >
        {content}
      </Streamdown>
    </div>
  );
}
