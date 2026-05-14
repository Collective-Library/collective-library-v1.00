"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { EventRsvp } from "@/types";

/**
 * Lightweight inline form that appears after a user has RSVP'd. Fields are
 * fully optional — RSVP works without filling these — but filling them turns
 * the attendee card from "1 nama doang" into "oh, bawa Atomic Habits, dari
 * Demak, pengen ngobrol soal habit". Pure social signal.
 *
 * Renders nothing if the user hasn't RSVPed yet (parent controls visibility
 * by checking optimisticStatus). Renders collapsed by default if the user
 * has already saved context (so they don't see the form every visit).
 */

interface Props {
  eventId: string;
  profileId: string;
  initialContext: Pick<EventRsvp, "origin_city" | "bringing_book" | "conversation_topic"> | null;
}

export function RsvpContextPrompt({ eventId, profileId, initialContext }: Props) {
  const hasInitial = Boolean(
    initialContext?.origin_city ||
      initialContext?.bringing_book ||
      initialContext?.conversation_topic,
  );

  const [expanded, setExpanded] = useState(!hasInitial);
  const [originCity, setOriginCity] = useState(initialContext?.origin_city ?? "");
  const [bringingBook, setBringingBook] = useState(initialContext?.bringing_book ?? "");
  const [topic, setTopic] = useState(initialContext?.conversation_topic ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("event_rsvps")
      .update({
        origin_city: originCity.trim() || null,
        bringing_book: bringingBook.trim() || null,
        conversation_topic: topic.trim() || null,
      })
      .eq("event_id", eventId)
      .eq("profile_id", profileId);

    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Tersimpan — kartu kamu sekarang ada konteksnya. ✨");
    setExpanded(false);
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="text-caption text-ink-soft hover:text-ink underline underline-offset-4 self-start"
      >
        {hasInitial ? "Edit konteks kamu" : "Tambahin konteks (opsional)"}
      </button>
    );
  }

  return (
    <div className="p-4 rounded-card border border-hairline bg-cream/50 flex flex-col gap-3">
      <div>
        <p className="text-caption text-muted uppercase tracking-wide font-semibold mb-1">
          Optional · Bikin kartu kamu lebih hidup
        </p>
        <p className="text-caption text-muted leading-relaxed">
          Cuma muncul di kartu kamu di section "Hadir". Gak wajib — kosongin juga gapapa.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Field
          label="Dari kota mana?"
          value={originCity}
          onChange={setOriginCity}
          placeholder="Demak, Semarang, Jakarta..."
          maxLength={80}
        />
        <Field
          label="Bawa buku apa?"
          value={bringingBook}
          onChange={setBringingBook}
          placeholder="The Psychology of Money, atau yang lain..."
          maxLength={200}
        />
        <Field
          label="Pengen ngobrolin apa?"
          value={topic}
          onChange={setTopic}
          placeholder="habit, career, self-growth..."
          maxLength={200}
        />
      </div>

      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={() => setExpanded(false)}
          disabled={saving}
          className="flex-1"
        >
          Nanti aja
        </Button>
        <Button onClick={save} disabled={saving} className="flex-1">
          {saving ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  maxLength: number;
}) {
  return (
    <div>
      <label className="block text-body-sm font-semibold text-ink mb-1.5">
        {label}
      </label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
      />
    </div>
  );
}
