import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function JajanHeader({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        "flex items-center justify-between gap-4 px-5 py-4 sm:px-8",
        className,
      )}
    >
      <Link to="/" className="flex items-center gap-2">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-pop">
          <span className="font-display text-xl font-bold">J!</span>
        </span>
        <span className="font-display text-xl font-bold tracking-tight text-foreground">
          Jajan Terus
        </span>
      </Link>
      <nav className="flex items-center gap-1 text-sm font-semibold">
        <Link
          to="/lobby"
          className="rounded-full px-3 py-1.5 text-foreground/70 hover:bg-secondary/40 hover:text-foreground"
          activeProps={{ className: "bg-secondary text-secondary-foreground" }}
        >
          Lobby
        </Link>
        <Link
          to="/leaderboard"
          className="rounded-full px-3 py-1.5 text-foreground/70 hover:bg-secondary/40 hover:text-foreground"
          activeProps={{ className: "bg-secondary text-secondary-foreground" }}
        >
          Leaderboard
        </Link>
      </nav>
    </header>
  );
}
