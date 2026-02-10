"use client";

import { Copy, KeyRound, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type ApiKeyRow = {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

type KeysResponse = {
  keys: ApiKeyRow[];
};

type CreateResponse = {
  key: string;
  apiKey: ApiKeyRow;
};

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  }
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function ApiKeysClient({ initialKeys }: { initialKeys: ApiKeyRow[] }) {
  const [keys, setKeys] = useState<ApiKeyRow[]>(initialKeys);
  const [creating, setCreating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const [newKeyName, setNewKeyName] = useState("");
  const [createdFullKey, setCreatedFullKey] = useState<string | null>(null);
  const [createdKeyId, setCreatedKeyId] = useState<string | null>(null);
  const [copyOk, setCopyOk] = useState<boolean | null>(null);

  const activeCount = useMemo(() => keys.filter((k) => !k.revokedAt).length, [keys]);

  async function refresh() {
    const res = await fetch("/api/keys", { cache: "no-store" });
    if (!res.ok) return;
    const payload = (await res.json()) as KeysResponse;
    setKeys(payload.keys ?? []);
  }

  async function createKey() {
    setCreating(true);
    setCopyOk(null);

    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });

      if (!res.ok) {
        return;
      }

      const payload = (await res.json()) as CreateResponse;
      setCreatedFullKey(payload.key);
      setCreatedKeyId(payload.apiKey.id);
      setNewKeyName("");
      await refresh();
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(id: string) {
    setRevokingId(id);

    try {
      const res = await fetch(`/api/keys/${id}`, { method: "DELETE" });
      if (!res.ok) return;
      await refresh();
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">API Keys</h1>
          <p className="mt-1 text-sm text-slate-600">Create and manage keys for OpenAI-compatible API access.</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create New Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create new API key</DialogTitle>
              <DialogDescription>Give it a name so you can recognize it later.</DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="key-name">
                Name
              </label>
              <Input
                id="key-name"
                placeholder="Production backend"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button disabled={creating || newKeyName.trim().length === 0} onClick={createKey}>
                <KeyRound className="mr-2 h-4 w-4" />
                {creating ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <p className="text-sm font-medium text-slate-700">Keys ({activeCount} active)</p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-slate-500">
                  No API keys yet.
                </TableCell>
              </TableRow>
            ) : (
              keys.map((key) => {
                const isRevoked = Boolean(key.revokedAt);
                const displayKey = `${key.keyPrefix}…`;

                return (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium text-slate-900">{key.name}</TableCell>
                    <TableCell className="font-mono text-sm text-slate-700">{displayKey}</TableCell>
                    <TableCell>{formatDate(key.createdAt)}</TableCell>
                    <TableCell>{formatDate(key.lastUsedAt)}</TableCell>
                    <TableCell>
                      <span
                        className={
                          isRevoked
                            ? "inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
                            : "inline-flex rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700"
                        }
                      >
                        {isRevoked ? "Revoked" : "Active"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-2">
                        {createdKeyId === key.id && createdFullKey ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const ok = await copyToClipboard(createdFullKey);
                              setCopyOk(ok);
                            }}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy
                          </Button>
                        ) : null}

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button disabled={isRevoked || revokingId === key.id} size="sm" variant="destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Revoke
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Revoke API key</DialogTitle>
                              <DialogDescription>Are you sure? This cannot be undone.</DialogDescription>
                            </DialogHeader>

                            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                              <div className="flex items-start gap-2">
                                <ShieldAlert className="mt-0.5 h-4 w-4" />
                                <p>
                                  Any services using this key will stop working immediately. Rotate keys in your apps before revoking.
                                </p>
                              </div>
                            </div>

                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogClose>
                              <DialogClose asChild>
                                <Button
                                  variant="destructive"
                                  onClick={async () => {
                                    await revokeKey(key.id);
                                  }}
                                >
                                  {revokingId === key.id ? "Revoking..." : "Revoke"}
                                </Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(createdFullKey)} onOpenChange={(open) => (!open ? setCreatedFullKey(null) : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API key created</DialogTitle>
            <DialogDescription>Copy this key now. You won&apos;t see it again.</DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="break-all font-mono text-sm text-slate-900">{createdFullKey}</p>
            </div>

            {copyOk === true ? <p className="text-sm text-emerald-700">Copied to clipboard.</p> : null}
            {copyOk === false ? <p className="text-sm text-rose-700">Copy failed. Please copy manually.</p> : null}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Done</Button>
            </DialogClose>
            <Button
              onClick={async () => {
                if (!createdFullKey) return;
                const ok = await copyToClipboard(createdFullKey);
                setCopyOk(ok);
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
