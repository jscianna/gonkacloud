"use client";

import { useEffect, useState } from "react";
import { Copy, KeyRound, Plus, ShieldAlert, Trash2, Loader2 } from "lucide-react";

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

type ApiKeyRow = {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
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

export function ApiKeysPanel() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const [newKeyName, setNewKeyName] = useState("");
  const [createdFullKey, setCreatedFullKey] = useState<string | null>(null);
  const [createdKeyId, setCreatedKeyId] = useState<string | null>(null);
  const [copyOk, setCopyOk] = useState<boolean | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const activeCount = keys.filter((k) => !k.revokedAt).length;

  async function refresh() {
    const res = await fetch("/api/keys", { cache: "no-store" });
    if (!res.ok) return;
    const payload = await res.json();
    setKeys(payload.keys ?? []);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  async function createKey() {
    setCreating(true);
    setCopyOk(null);
    setCreateError(null);

    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });

      if (!res.ok) {
        const errorPayload = await res.json().catch(() => null);
        const message = errorPayload?.error ?? "Failed to create key";
        setCreateError(message);
        return;
      }

      const payload = await res.json();
      setCreateDialogOpen(false);
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
      if (res.ok) await refresh();
    } finally {
      setRevokingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-base text-gray-600">
            Create and manage keys for OpenAI-compatible API access.
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-base">
              <Plus className="mr-2 h-5 w-5" />
              Create New Key
            </Button>
          </DialogTrigger>
          <DialogContent className="border-gray-200 bg-white">
            <DialogHeader>
              <DialogTitle className="text-gray-900 text-xl">Create new API key</DialogTitle>
              <DialogDescription className="text-gray-500 text-base">
                Give it a name so you can recognize it later.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-2">
              <label className="text-base font-medium text-gray-700" htmlFor="key-name">
                Name
              </label>
              <Input
                id="key-name"
                placeholder="Production backend"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 text-base"
              />
            </div>
            {createError && <p className="mt-3 text-base text-red-600">{createError}</p>}

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" className="text-base">Cancel</Button>
              </DialogClose>
              <Button
                disabled={creating || newKeyName.trim().length === 0}
                onClick={createKey}
                className="bg-emerald-500 hover:bg-emerald-600 text-base"
              >
                <KeyRound className="mr-2 h-5 w-5" />
                {creating ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <p className="text-base font-medium text-gray-700">Keys ({activeCount} active)</p>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-gray-200 hover:bg-gray-50">
              <TableHead className="text-gray-600 text-base">Name</TableHead>
              <TableHead className="text-gray-600 text-base">Key</TableHead>
              <TableHead className="text-gray-600 text-base">Created</TableHead>
              <TableHead className="text-gray-600 text-base">Status</TableHead>
              <TableHead className="text-right text-gray-600 text-base">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.length === 0 ? (
              <TableRow className="border-gray-200 hover:bg-gray-50">
                <TableCell colSpan={5} className="py-10 text-center text-base text-gray-500">
                  No API keys yet.
                </TableCell>
              </TableRow>
            ) : (
              keys.map((key) => {
                const isRevoked = Boolean(key.revokedAt);
                const displayKey = `${key.keyPrefix}…`;

                return (
                  <TableRow key={key.id} className="border-gray-200 hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-900 text-base">{key.name}</TableCell>
                    <TableCell className="font-mono text-base text-gray-600">{displayKey}</TableCell>
                    <TableCell className="text-gray-600 text-base">{formatDate(key.createdAt)}</TableCell>
                    <TableCell>
                      <span
                        className={
                          isRevoked
                            ? "inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-sm font-medium text-gray-500"
                            : "inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-sm font-medium text-emerald-700"
                        }
                      >
                        {isRevoked ? "Revoked" : "Active"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-2">
                        {createdKeyId === key.id && createdFullKey && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const ok = await copyToClipboard(createdFullKey);
                              setCopyOk(ok);
                            }}
                            className="text-base"
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy
                          </Button>
                        )}

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              disabled={isRevoked || revokingId === key.id}
                              size="sm"
                              variant="destructive"
                              className="text-base"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Revoke
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="border-gray-200 bg-white">
                            <DialogHeader>
                              <DialogTitle className="text-gray-900 text-xl">Revoke API key</DialogTitle>
                              <DialogDescription className="text-gray-500 text-base">
                                Are you sure? This cannot be undone.
                              </DialogDescription>
                            </DialogHeader>

                            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-base text-amber-800">
                              <div className="flex items-start gap-2">
                                <ShieldAlert className="mt-0.5 h-5 w-5" />
                                <p>
                                  Any services using this key will stop working immediately.
                                </p>
                              </div>
                            </div>

                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline" className="text-base">Cancel</Button>
                              </DialogClose>
                              <DialogClose asChild>
                                <Button variant="destructive" onClick={() => revokeKey(key.id)} className="text-base">
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

      <Dialog
        open={Boolean(createdFullKey)}
        onOpenChange={(open) => !open && setCreatedFullKey(null)}
      >
        <DialogContent className="border-gray-200 bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900 text-xl">API key created</DialogTitle>
            <DialogDescription className="text-gray-500 text-base">
              Copy this key now. You won&apos;t see it again.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="break-all font-mono text-base text-emerald-600">{createdFullKey}</p>
            </div>

            {copyOk === true && <p className="text-base text-emerald-600">Copied to clipboard.</p>}
            {copyOk === false && (
              <p className="text-base text-red-600">Copy failed. Please copy manually.</p>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="text-base">Done</Button>
            </DialogClose>
            <Button
              onClick={async () => {
                if (!createdFullKey) return;
                const ok = await copyToClipboard(createdFullKey);
                setCopyOk(ok);
              }}
              className="bg-emerald-500 hover:bg-emerald-600 text-base"
            >
              <Copy className="mr-2 h-5 w-5" />
              Copy Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
