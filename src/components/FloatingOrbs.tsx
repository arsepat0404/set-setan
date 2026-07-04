const EMOJIS = ['🍜', '🍢', '🥟', '🍡', '🧆', '🫙', '🍱', '🥘'];

// Seeded pseudo-random based on index for stable positions
function seededRand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export function FloatingOrbs() {
  return (
    <>
      <style>{`
        @keyframes jajan-float {
          0%, 100% { transform: translateY(0px) rotate(-3deg); }
          50%      { transform: translateY(-18px) rotate(3deg); }
        }
      `}</style>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        {EMOJIS.map((emoji, i) => {
          const top = `${Math.floor(seededRand(i + 1) * 85)}%`;
          const left = `${Math.floor(seededRand(i + 11) * 90)}%`;
          const size = 36 + Math.floor(seededRand(i + 23) * 28);
          const delay = `${(i * 0.5).toFixed(2)}s`;
          const duration = `${(5 + seededRand(i + 31) * 3).toFixed(2)}s`;
          return (
            <span
              key={i}
              className="absolute select-none opacity-25"
              style={{
                top,
                left,
                fontSize: `${size}px`,
                animation: `jajan-float ${duration} ease-in-out ${delay} infinite`,
              }}
            >
              {emoji}
            </span>
          );
        })}
      </div>
    </>
  );
}

export default FloatingOrbs;
