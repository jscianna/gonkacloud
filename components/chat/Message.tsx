"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

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
    return <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.9em]">{children}</code>;
  }

  return (
    <div className="my-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <span className="text-xs font-medium text-white/70">{lang}</span>
        <Button
          size="sm"
          variant="secondary"
          className="h-8 bg-white/10 text-white hover:bg-white/15"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            } catch {
              // ignore
            }
          }}
        >
          {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      <SyntaxHighlighter
        language={lang}
        style={oneDark as any}
        customStyle={{
          margin: 0,
          background: "transparent",
          padding: "12px 14px",
          fontSize: "0.85rem",
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

export function Message({ role, content }: MessageProps) {
  const isUser = role === "user";

  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          isUser
            ? "max-w-[85%] rounded-2xl bg-blue-600 px-4 py-3 text-sm text-white sm:max-w-[70%]"
            : "max-w-[85%] rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-900 sm:max-w-[70%]"
        }
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code: ({ className, children, ...props }) => (
              <code {...props} className={`rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.9em] ${className ?? ""}`}>
                {children}
              </code>
            ),
            pre: ({ children }) => {
              // Fenced code blocks come through as <pre><code className="language-...">...</code></pre>
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
              <a className="underline underline-offset-2" href={href} rel="noreferrer" target="_blank">
                {children}
              </a>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
