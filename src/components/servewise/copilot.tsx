import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { askCopilot } from "@/lib/copilot.functions";

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
        <div className="flex min-h-64 min-w-0 flex-col gap-3 rounded-md border bg-surface p-4" aria-live="polite">
          {msgs.length === 0 ? (
            <div className="m-auto max-w-sm text-center">
              <Sparkles className="mx-auto h-6 w-6 text-primary" />
              <h2 className="mt-3 text-sm font-semibold text-foreground">Ask about your kitchen</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Answers explain your verified ServeWise records. Copilot does not calculate forecasts, safety or impact.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {suggestions.map((s) => (
                  <Button key={s} size="sm" variant="outline" className="h-auto whitespace-normal text-left" onClick={() => send(s)}>{s}</Button>
                ))}
              </div>
            </div>
          ) : (
            msgs.map((x, i) => (
              <div key={i} className={x.role === "user" ? "ml-auto max-w-[85%] rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground" : `max-w-[95%] whitespace-pre-wrap rounded-md border bg-card px-3 py-2 text-sm ${x.error ? "text-destructive" : "text-foreground"}`}>
                {x.text}
              </div>
            ))
          )}
          {m.isPending ? <p className="text-xs text-muted-foreground">Copilot is reviewing your records…</p> : null}
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
      </CardContent>
    </Card>
  );
}
