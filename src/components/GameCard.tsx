import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import type { CardType } from "@/data/cards";
import { getCardImageUrl } from "@/data/cards";
import { cn } from "@/lib/utils";

type GameCardProps = {
  card?: CardType;
  isFaceDown?: boolean;
  isSelected?: boolean;
  isLoading?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
};

export function GameCard({
  card,
  isFaceDown = false,
  isSelected = false,
  isLoading = false,
  onClick,
  disabled = false,
  className,
  style,
}: GameCardProps) {
  const interactive = !disabled && !isLoading && !!onClick;
  const label = card
    ? `${card.name} — kartu ${isFaceDown ? "tertutup" : "terbuka"}`
    : `kartu ${isFaceDown ? "tertutup" : "terbuka"}`;

  const wiggle = !isFaceDown && card?.isSetan;

  return (
    <motion.div
      role="button"
      aria-label={label}
      aria-disabled={disabled}
      tabIndex={interactive ? 0 : -1}
      onClick={interactive ? onClick : undefined}
      onKeyDown={(e) => {
        if (!interactive) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      whileHover={interactive ? { scale: 1.08 } : undefined}
      animate={wiggle ? { rotate: [-2, 2, -2] } : undefined}
      transition={
        wiggle
          ? { repeat: Infinity, duration: 0.6, ease: "easeInOut" }
          : { duration: 0.15 }
      }
      style={style}
      className={cn(
        "relative flex aspect-[2/3] min-w-[70px] max-w-[110px] flex-col overflow-hidden rounded-lg border border-foreground/15 bg-card shadow-sm",
        "transition-shadow",
        interactive && "cursor-pointer hover:shadow-lg",
        isSelected && "ring-2 ring-primary ring-offset-1",
        disabled && "cursor-not-allowed opacity-55",
        wiggle && "shadow-[0_0_18px_hsl(var(--destructive)/0.55)]",
        className,
      )}
    >
      {isFaceDown ? (
        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-emerald-900 to-emerald-700 text-2xl">
          <span aria-hidden>🍜</span>
          <span className="mt-1 text-[9px] font-bold uppercase tracking-widest text-white/70">
            Jajan Terus
          </span>
        </div>
      ) : (
        <>
          <div className="relative flex-1 overflow-hidden bg-gradient-to-br from-amber-100 to-amber-200">
            {card && !card.isSetan ? (
              <img
                src={getCardImageUrl(card.slug)}
                alt=""
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : null}
            {card?.isSetan && (
              <div className="grid h-full w-full place-items-center bg-gradient-to-br from-zinc-800 to-red-900 text-4xl">
                😈
              </div>
            )}
            {(!card || (!card.isSetan && false)) && (
              <div className="grid h-full w-full place-items-center text-3xl">🍜</div>
            )}
          </div>
          <div className="grid place-items-center bg-secondary px-1 py-1">
            <span
              className={cn(
                "line-clamp-2 text-center font-display font-semibold leading-tight",
                "text-[clamp(9px,1.8vw,13px)]",
                card?.isSetan ? "font-bold text-destructive" : "text-foreground",
              )}
            >
              {card?.name ?? ""}
            </span>
          </div>
        </>
      )}
      {isLoading && (
        <div className="absolute inset-0 grid place-items-center bg-background/50">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </motion.div>
  );
}
