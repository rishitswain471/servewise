import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { askCopilot } from "@/lib/copilot.functions";

// Session-scoped chat: only message text is stored, tagged with the signed-in user id,
// in sessionStorage. Cleared on sign-out; ignored if a different user signs in.
const KEY = "servewise-copilot-session";
export function clearCopilotSession() {
  try { sessionStorage.removeItem(KEY); } catch { /* unavailable */ }
}

type Msg = { role: "user" | "assistant"; text: string; error?: boolean };
const suggestions = [
  "What happened with the latest completed service?",
  "How much surplus was generated?",
  "How much food was successfully redistributed?",
  "Explain the forecast versus actual for the latest service.",
];

export function CopilotWorkspace() {
  const ask = useServerFn(askCopilot);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const uid = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      uid.current = data.session?.user.id ?? null;
      try {
        const raw = sessionStorage.getItem(KEY);
        const saved = raw ? JSON.parse(raw) : null;
        if (saved && saved.uid === uid.current && Array.isArray(saved.msgs)) setMsgs(saved.msgs.slice(-50));
        else clearCopilotSession();
      } catch { clearCopilotSession(); }
      setReady(true);
    });
  }, []);
  useEffect(() => {
    if (!ready || !uid.current) return;
    try { sessionStorage.setItem(KEY, JSON.stringify({ uid: uid.current, msgs: msgs.slice(-50) })); } catch { /* quota */ }
  }, [msgs, ready]);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest" }); }, [msgs.length]);
  const m = useMutation({
    mutationFn: (question: string) =>
      ask({ data: { question, history: msgs.filter((x) => !x.error).slice(-6).map(({ role, text }) => ({ role, text: text.slice(0, 4000) })) } }),
    onSuccess: (r) => setMsgs((p) => [...p, r.ok ? { role: "assistant", text: r.answer } : { role: "assistant", text: r.error, error: true }]),
    onError: () => setMsgs((p) => [...p, { role: "assistant", text: "Copilot is temporarily unavailable. Your ServeWise operational data is unaffected.", error: true }]),
  });
  const send = (text: string) => {
    const t = text.trim();
    if (!t || m.isPending) return;
    setMsgs((p) => [...p, { role: "user", text: t }]);
    setQ("");
    m.mutate(t);
  };

  return (
    <Card className="shadow-none">
      <CardContent className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex h-[28rem] max-h-[60vh] min-h-64 min-w-0 flex-col gap-3 overflow-y-auto rounded-md border bg-surface p-4" aria-live="polite">
          {msgs.length === 0 ? (
            <div className="m-auto max-w-sm text-center">
              <Sparkles className="mx-auto h-6 w-6 text-primary" />
              <h2 className="mt-3 text-sm font-semibold text-foreground">Ask about your kitchen</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Answers explain your verified ServeWise records. Copilot does not calculate forecasts, safety or impact.
              </p>
            </div>
          ) : (
            msgs.map((x, i) => x.role === "user" ? (
              <div key={i} className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">{x.text}</div>
            ) : (
              <div key={i} className={`max-w-[95%] text-sm leading-6 ${x.error ? "text-destructive" : "text-foreground"} [&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1`}>
                <ReactMarkdown skipHtml>{x.text}</ReactMarkdown>
              </div>
            ))
          )}
          {m.isPending ? <p className="text-xs text-muted-foreground">Copilot is reviewing your records…</p> : null}
          <div ref={endRef} />
        </div>
        <div className="flex min-w-0 flex-col gap-4">
        <div className="grid gap-2">
          <p className="text-xs font-medium text-muted-foreground">Suggested questions</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <Button key={s} size="sm" variant="outline" disabled={m.isPending} className="h-auto whitespace-normal py-1.5 text-left" onClick={() => send(s)}>{s}</Button>
            ))}
          </div>
        </div>
        <form className="flex flex-col justify-end gap-3" onSubmit={(e) => { e.preventDefault(); send(q); }}>
          <div className="grid gap-2">
            <Label htmlFor="copilot-message">Ask about kitchen operations</Label>
            <Textarea id="copilot-message" maxLength={1000} value={q} onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(q); } }}
              placeholder="e.g. Why is the recommended preparation 193?" />
          </div>
          <Button type="submit" disabled={!q.trim() || m.isPending} className="gap-2">
            <Send className="h-4 w-4" />
            Send
          </Button>
          <p className="text-xs text-muted-foreground">Explanations only. Figures come from ServeWise records; impact values are estimates.</p>
        </form>
        </div>
      </CardContent>
    </Card>
  );
}
