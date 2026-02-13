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
};

function CodeBlock({ inline, className, children }: { inline?: boolean; className?: string; children: any }) {
  const code = useMemo(() => String(children ?? "").replace(/\n$/, ""), [children]);
  const match = /language-(\w+)/.exec(className ?? "");
  const lang = match?.[1] ?? "text";
  const [copied, setCopied] = useState(false);

  if (inline) {
    return <code className="rounded bg-slate-200/50 px-1.5 py-0.5 font-mono text-[0.85em]">{children}</code>;
  }

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="text-xs font-medium text-white/60">{lang}</span>
        <button
          className="flex h-7 items-center rounded px-2 text-xs text-white/60 hover:bg-white/10 hover:text-white"
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

export function Message({ role, content }: MessageProps) {
  const isUser = role === "user";

  if (!content) return null;

  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          isUser
            ? "max-w-[85%] rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white sm:max-w-[75%]"
            : "max-w-[85%] text-sm text-slate-900 sm:max-w-[75%]"
        }
      >
        <div className={isUser ? "prose prose-sm prose-invert max-w-none" : "prose prose-sm max-w-none prose-slate"}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code: ({ className, children, ...props }) => (
                <code {...props} className={`rounded bg-slate-200/50 px-1.5 py-0.5 font-mono text-[0.85em] ${className ?? ""}`}>
                  {children}
                </code>
              ),
              pre: ({ children }) => {
                const child = Array.isArray(children) ? children[0] : children;
                if (!child || typeof child !== "object") {
                  return <pre>{children}</pre>;
                }

                const codeChild = child as any;
                const className = codeChild.props?.className as string | undefined;
                const code = codeChild.props?.children;

                return <CodeBlock className={className}>{code}</CodeBlock>;
              },
              a: ({ href, children }) => (
                <a className="text-blue-600 hover:underline" href={href} rel="noreferrer" target="_blank">
                  {children}
                </a>
              ),
              p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="mb-3 list-disc pl-4 last:mb-0">{children}</ul>,
              ol: ({ children }) => <ol className="mb-3 list-decimal pl-4 last:mb-0">{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
