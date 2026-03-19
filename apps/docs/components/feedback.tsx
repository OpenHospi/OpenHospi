"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useCallback, useState } from "react";

type FeedbackState = "idle" | "form" | "submitting" | "success" | "error";

interface PageFeedbackProps {
  url: string;
  onSubmit: (feedback: {
    url: string;
    opinion: string;
    message: string;
  }) => Promise<{ githubUrl: string }>;
}

export function PageFeedback({ url, onSubmit }: PageFeedbackProps) {
  const [state, setState] = useState<FeedbackState>("idle");
  const [opinion, setOpinion] = useState<"positive" | "negative" | null>(null);
  const [message, setMessage] = useState("");
  const [githubUrl, setGithubUrl] = useState<string | null>(null);

  const handleVote = useCallback((vote: "positive" | "negative") => {
    setOpinion(vote);
    setState("form");
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!opinion) return;
    setState("submitting");
    try {
      const result = await onSubmit({
        url,
        opinion,
        message: message || "(geen toelichting)",
      });
      setGithubUrl(result.githubUrl);
      setState("success");
    } catch {
      setState("error");
    }
  }, [opinion, message, url, onSubmit]);

  if (state === "success") {
    return (
      <div className="mt-6 rounded-lg border bg-fd-card p-4 text-sm text-fd-muted-foreground">
        <p className="font-medium text-fd-foreground">Bedankt voor je feedback!</p>
        {githubUrl && (
          <p className="mt-1">
            Bekijk de discussie op{" "}
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-fd-primary underline"
            >
              GitHub
            </a>
            .
          </p>
        )}
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="mt-6 rounded-lg border bg-fd-card p-4 text-sm text-fd-muted-foreground">
        <p>Er ging iets mis bij het versturen. Probeer het later opnieuw.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-lg border bg-fd-card p-4">
      <p className="text-sm font-medium text-fd-foreground">Was deze pagina nuttig?</p>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleVote("positive")}
          className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors ${
            opinion === "positive"
              ? "border-fd-primary bg-fd-primary/10 text-fd-primary"
              : "text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-accent-foreground"
          }`}
        >
          <ThumbsUp className="size-4" />
          Ja
        </button>
        <button
          type="button"
          onClick={() => handleVote("negative")}
          className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors ${
            opinion === "negative"
              ? "border-fd-primary bg-fd-primary/10 text-fd-primary"
              : "text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-accent-foreground"
          }`}
        >
          <ThumbsDown className="size-4" />
          Nee
        </button>
      </div>

      {(state === "form" || state === "submitting") && (
        <div className="mt-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Heb je nog aanvullende feedback? (optioneel)"
            rows={3}
            className="w-full resize-none rounded-md border bg-fd-background px-3 py-2 text-sm text-fd-foreground placeholder:text-fd-muted-foreground focus:border-fd-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={state === "submitting"}
            className="mt-2 rounded-md bg-fd-primary px-4 py-1.5 text-sm font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/90 disabled:opacity-50"
          >
            {state === "submitting" ? "Versturen..." : "Verstuur feedback"}
          </button>
        </div>
      )}
    </div>
  );
}
