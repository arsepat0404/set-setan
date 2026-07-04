import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Kode Akses — Jajan Terus" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const ACCESS_FLAG_KEY = "jajan_access_verified";

const codeSchema = z.object({
  code: z.string().trim().min(1, "Kode wajib diisi"),
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, verifyAccessCode } = useAuth();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Sudah pernah verifikasi + sesi aktif → langsung ke homepage.
    try {
      const flag = localStorage.getItem(ACCESS_FLAG_KEY);
      if (flag === "1" && user) {
        navigate({ to: "/" });
      }
    } catch {
      /* ignore */
    }
  }, [user, navigate]);

  async function handleSubmit() {
    setError(null);
    const parsed = codeSchema.safeParse({ code });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Kode tidak valid");
      return;
    }
    setBusy(true);
    try {
      await verifyAccessCode(parsed.data.code);
      toast.success("Kode akses valid! 🍜");
      navigate({ to: "/" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kode akses salah");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-jajan-pattern px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-primary text-3xl shadow-pop">
            🍜
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold text-foreground">
            Kode Akses
          </h1>
          <p className="mt-1 text-sm text-foreground/60">
            Masukkan kode akses dari admin grupmu untuk masuk warung.
          </p>
        </div>

        <div className="rounded-3xl border-2 border-foreground/10 bg-card p-6 shadow-card">
          <Label
            htmlFor="access-code"
            className="font-display text-sm font-bold uppercase tracking-wider"
          >
            Kode Rahasia
          </Label>
          <Input
            id="access-code"
            type="password"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Masukkan kode…"
            autoComplete="off"
            autoFocus
            className="mt-2 h-12 rounded-xl border-2"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
          />
          {error && (
            <p className="mt-2 text-sm font-semibold text-destructive">{error}</p>
          )}
          <Button
            onClick={handleSubmit}
            disabled={busy}
            className="btn-stamp mt-4 h-12 w-full rounded-xl font-bold"
          >
            {busy ? "Memeriksa…" : "Masuk"}
          </Button>

          <p className="mt-4 text-center text-xs text-foreground/60">
            <Link to="/" className="font-bold text-primary hover:underline">
              Kembali ke beranda
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
