import { Link, useRouter } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export function RouteError({ reset }: { error: unknown; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="grid min-h-dvh place-items-center bg-surface px-4">
      <div className="max-w-sm text-center">
        <h1 className="text-lg font-semibold text-foreground">We couldn't load your workspace</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your session may have expired or the connection dropped. Please try again.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Button
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
