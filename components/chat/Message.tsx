"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import { useMemo, useState } from "react";

type MessageProps = {
  role: "user" | "assistant" | "system";
  content: string;
  dark?: boolean;
};

function CodeBlock({ className, children }: { className?: string; children: any }) {
  const code = useMemo(() => String(children ?? "").replace(/\n$/, ""), [children]);
  const match = /language-(\w+)/.exec(className ?? "");
  const lang = match?.[1] ?? "text";
  const [copied, setCopied] = useState(false);

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1b]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="text-xs font-medium text-white/50">{lang}</span>
        <button
          className="flex h-7 items-center rounded px-2 text-xs text-white/50 hover:bg-white/10 hover:text-white"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              // ignore
            }
          }}
        >
          {copied ? <Check className="mr-1.5 h-3 w-3" /> : <Copy className="mr-1.5 h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <SyntaxHighlighter
        language={lang}
        style={oneDark as any}
        customStyle={{
          margin: 0,
          background: "transparent",
          padding: "16px",
          fontSize: "0.8rem",
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

export function Message({ role, content, dark = true }: MessageProps) {
  if (!content) return null;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code: ({ className, children, ...props }) => {
          const isInline = !className;
          if (isInline) {
            return (
              <code 
                {...props} 
                className={`rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.85em] text-emerald-300 ${className ?? ""}`}
              >
                {children}
              </code>
            );
          }
          return (
            <code {...props} className={className}>
              {children}
            </code>
          );
        },
        pre: ({ children }) => {
          const child = Array.isArray(children) ? children[0] : children;
          if (!child || typeof child !== "object") {
            return <pre className="overflow-auto">{children}</pre>;
          }

          const codeChild = child as any;
          const className = codeChild.props?.className as string | undefined;
          const code = codeChild.props?.children;

          return <CodeBlock className={className}>{code}</CodeBlock>;
        },
        a: ({ href, children }) => (
          <a 
            className="text-emerald-400 underline decoration-emerald-400/30 underline-offset-2 hover:decoration-emerald-400" 
            href={href} 
            rel="noreferrer" 
            target="_blank"
          >
            {children}
          </a>
        ),
        p: ({ children }) => <p className="mb-3 leading-relaxed last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="mb-3 list-disc pl-4 last:mb-0">{children}</ul>,
        ol: ({ children }) => <ol className="mb-3 list-decimal pl-4 last:mb-0">{children}</ol>,
        li: ({ children }) => <li className="mb-1">{children}</li>,
        h1: ({ children }) => <h1 className="mb-3 mt-4 text-xl font-semibold first:mt-0">{children}</h1>,
        h2: ({ children }) => <h2 className="mb-3 mt-4 text-lg font-semibold first:mt-0">{children}</h2>,
        h3: ({ children }) => <h3 className="mb-2 mt-3 text-base font-semibold first:mt-0">{children}</h3>,
        blockquote: ({ children }) => (
          <blockquote className="my-3 border-l-2 border-emerald-400/50 pl-4 italic text-white/70">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="my-4 border-white/10" />,
        table: ({ children }) => (
          <div className="my-3 overflow-x-auto">
            <table className="w-full border-collapse text-sm">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-white/10 bg-white/5 px-3 py-2 text-left font-semibold">{children}</th>
        ),
        td: ({ children }) => (
          <td className="border border-white/10 px-3 py-2">{children}</td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
