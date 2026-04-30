"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CONDITION_LABELS } from "@/lib/status";
import type { BookCondition } from "@/types";

export function WantedForm({
  userId,
  defaultCity = "Semarang",
  defaultTitle = "",
  defaultAuthor = "",
}: {
  userId: string;
  defaultCity?: string;
  defaultTitle?: string;
  defaultAuthor?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(defaultTitle);
  const [author, setAuthor] = useState(defaultAuthor);
  const [budget, setBudget] = useState<string>("");
  const [condition, setCondition] = useState<BookCondition | "">("");
  const [city, setCity] = useState(defaultCity);
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError("Judul wajib diisi.");

    setSaving(true);
    const supabase = createClient();
    const { error: err } = await supabase.from("wanted_requests").insert({
      requester_id: userId,
      title: title.trim(),
      author: author.trim() || null,
      max_budget: budget ? Number(budget) : null,
      desired_condition: condition || null,
      city: city.trim() || "Semarang",
      notes: notes.trim() || null,
      status: "open",
    });

    setSaving(false);
    if (err) {
      toast.error("Gagal posting WTB — coba lagi.");
      return setError(err.message);
    }
    toast.success("WTB request masuk ke komunitas ✓");
    router.replace("/wanted");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-paper border border-hairline rounded-card-lg shadow-card p-6 md:p-8 flex flex-col gap-5"
    >
      <Input
        label="Judul yang dicari"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Sapiens"
        required
      />
      <Input
        label="Author (opsional)"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        placeholder="Yuval Noah Harari"
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <Input
          label="Budget maks (IDR, opsional)"
          value={budget}
          onChange={(e) => setBudget(e.target.value.replace(/\D/g, ""))}
          placeholder="100000"
          inputMode="numeric"
          hint="Berapa max yang lo siap bayar."
        />
        <Select
          label="Kondisi diinginkan (opsional)"
          value={condition}
          onChange={(e) => setCondition(e.target.value as BookCondition | "")}
        >
          <option value="">Apa aja</option>
          {(Object.keys(CONDITION_LABELS) as BookCondition[]).map((c) => (
            <option key={c} value={c}>
              {CONDITION_LABELS[c]}
            </option>
          ))}
        </Select>
      </div>

      <Input
        label="Kota / area"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="Semarang"
      />

      <Textarea
        label="Catatan (opsional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Misal: lebih prefer cetakan baru, atau bisa tukar sama buku X."
        rows={3}
      />

      {error && <p className="text-caption text-(--color-error)">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Batal
        </Button>
        <Button type="submit" disabled={saving} className="flex-1">
          {saving ? "Lagi kirim ke komunitas…" : "Posting WTB request"}
        </Button>
      </div>
    </form>
  );
}
