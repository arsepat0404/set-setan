import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { JajanHeader } from "@/components/jajan-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import heroBg from "@/assets/hero-bg.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jajan Terus — Game Kartu Setan-setanan Online" },
      {
        name: "description",
        content:
          "Main game kartu Setan-setanan online bareng teman! Tema jajanan Indonesia, multiplayer seru, gratis.",
      },
      { property: "og:title", content: "Jajan Terus — Game Kartu Setan-setanan Online" },
      {
        property: "og:description",
        content:
          "Main game kartu Setan-setanan online bareng teman! Tema jajanan Indonesia, multiplayer seru, gratis.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

const FEATURES = [
  {
    emoji: "🃏",
    title: "Setan-setanan klasik",
    body: "Pasangkan kartu jajanan, sisakan satu Setan. Yang kepegang terakhir kalah!",
  },
  {
    emoji: "🌶️",
    title: "Tema jajanan Indonesia",
    body: "Cilok, batagor, martabak, es teh — kartu lucu dengan rasa kampung halaman.",
  },
  {
    emoji: "👯",
    title: "Multiplayer realtime",
    body: "Buat room privat, ajak 2–6 teman, main bareng dari HP atau laptop.",
  },
];

const HOW_TO_PLAY = [
  { step: "1", title: "Masukkan kode akses", body: "Minta kode ke admin grupmu untuk masuk warung." },
  { step: "2", title: "Buat / Gabung Ruangan", body: "Bikin room privat atau join pakai kode 6 digit." },
  { step: "3", title: "Pasangkan Kartu", body: "Ambil kartu lawan, cocokkan pasangan, buang ke meja." },
  { step: "4", title: "Hindari Setan!", body: "Yang kepegang kartu Setan terakhir kalah dan bayar!" },
];

const ACCESS_FLAG_KEY = "jajan_access_verified";

const nicknameSchema = z
  .string()
  .trim()
  .min(3, "Nickname minimal 3 karakter")
  .max(20, "Nickname maksimal 20 karakter")
  .regex(/^[a-zA-Z0-9_]+$/, "Hanya huruf, angka, dan underscore");

function Index() {
  const navigate = useNavigate();
  const { user, profile, loading, updateNickname } = useAuth();
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);

  // Gate: kalau belum pernah verifikasi kode akses → paksa ke /auth.
  useEffect(() => {
    if (loading) return;
    let flag: string | null = null;
    try {
      flag = localStorage.getItem(ACCESS_FLAG_KEY);
    } catch {
      /* ignore */
    }
    if (flag !== "1" || !user) {
      navigate({ to: "/auth" });
    }
  }, [loading, user, navigate]);

  // Prefill dari profile bila sudah ada nickname sebelumnya.
  useEffect(() => {
    if (profile?.username && !/^Pemain_/i.test(profile.username)) {
      setNickname(profile.username);
    }
  }, [profile?.username]);

  async function handleStart() {
    const parsed = nicknameSchema.safeParse(nickname);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Nickname tidak valid");
      return;
    }
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    setBusy(true);
    try {
      await updateNickname(parsed.data);
      toast.success(`Halo, ${parsed.data}! 👋`);
      navigate({ to: "/lobby" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan nickname");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-jajan-pattern">
      <JajanHeader />

      <main className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        {/* Hero */}
        <section className="grid items-center gap-10 py-10 md:grid-cols-2 md:py-16">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-wider text-secondary-foreground shadow-pop">
              <span className="h-2 w-2 rounded-full bg-accent" />
              Beta — gratis selama soft launch
            </span>
            <h1 className="font-display text-5xl font-bold leading-[1.05] text-foreground sm:text-6xl">
              Main <span className="text-primary">Setan-setanan</span>
              <br />
              rame-rame, <span className="text-accent">terus jajan!</span>
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-foreground/70">
              Kartu klasik versi anak warung. Ajak teman lewat kode room, pasangkan
              jajanan, hindari kartu Setan — biar nggak kebagian bayar es teh!
            </p>

            <Button
              asChild
              size="lg"
              className="btn-stamp h-14 rounded-2xl px-7 text-base font-bold"
            >
              <a href="#mulai">Mulai Main Sekarang 🍜</a>
            </Button>
          </div>

          <div className="relative">
            <div className="animate-float overflow-hidden rounded-[2.5rem] border-4 border-foreground/10 shadow-card">
              <img
                src={heroBg}
                alt="Aneka jajanan jalanan Indonesia bergaya kawaii"
                width={1536}
                height={1024}
                className="block h-full w-full object-cover"
              />
            </div>
            <div className="absolute -left-4 top-6 hidden rotate-[-8deg] rounded-2xl bg-card px-4 py-2 font-display text-sm font-bold text-foreground shadow-pop sm:block">
              🥟 +1 Pasangan!
            </div>
            <div className="absolute -bottom-3 right-4 hidden rotate-[6deg] rounded-2xl bg-primary px-4 py-2 font-display text-sm font-bold text-primary-foreground shadow-pop sm:block">
              👹 Awas Setan!
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="grid gap-5 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="group rounded-3xl border-2 border-foreground/10 bg-card p-6 shadow-pop transition hover:-translate-y-1"
            >
              <div className="mb-3 inline-grid h-12 w-12 place-items-center rounded-2xl bg-kunyit text-2xl group-hover:animate-wiggle">
                {f.emoji}
              </div>
              <h2 className="font-display text-xl font-bold">{f.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground/70">{f.body}</p>
            </article>
          ))}
        </section>

        {/* How to play */}
        <section className="mt-14">
          <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">
            Cara Main
          </h2>
          <p className="mx-auto mt-2 max-w-md text-center text-foreground/70">
            Empat langkah aja, langsung bisa jajan bareng teman.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_TO_PLAY.map((s) => (
              <article
                key={s.step}
                className="rounded-3xl border-2 border-foreground/10 bg-card p-5 shadow-pop"
              >
                <div className="grid h-10 w-10 place-items-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground">
                  {s.step}
                </div>
                <h3 className="mt-3 font-display text-lg font-bold">{s.title}</h3>
                <p className="mt-1 text-sm text-foreground/70">{s.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Nickname CTA */}
        <section
          id="mulai"
          className="mt-14 overflow-hidden rounded-[2rem] bg-setan-dark p-8 text-setan-dark-foreground shadow-card sm:p-12"
        >
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">
                Siap jadi <span className="text-secondary">si paling jajan?</span>
              </h2>
              <p className="mt-2 max-w-md text-setan-dark-foreground/70">
                Pilih nickname dulu, biar teman-teman kenal kamu di meja jajan.
                Nickname bisa kamu ubah lagi kapan saja di lobby.
              </p>

            </div>

            <div className="rounded-3xl bg-card p-5 text-foreground shadow-pop">
              <Label
                htmlFor="nickname"
                className="font-display text-sm font-bold uppercase tracking-wider"
              >
                Nickname
              </Label>
              <p className="mt-1 text-xs text-foreground/60">
                3–20 karakter. Huruf, angka, atau underscore.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Input
                  id="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="cth: budi_jajan"
                  autoComplete="off"
                  maxLength={20}
                  className="h-12 rounded-xl border-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleStart();
                  }}
                />
                <Button
                  onClick={handleStart}
                  disabled={busy}
                  className="btn-stamp h-12 rounded-xl px-6 font-bold"
                >
                  Mulai Main
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
