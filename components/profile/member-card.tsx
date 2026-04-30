import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { InterestList, IntentList } from "@/components/profile/interest-chips";
import type { MemberSummary } from "@/lib/profile";

/**
 * Compact member card for the /anggota directory.
 * Optimized for scan-density — show identity + first sliver of interests +
 * book count, then click-through to full profile.
 */
export function MemberCard({ member }: { member: MemberSummary }) {
  const href = member.username ? `/profile/${member.username}` : "#";
  const cityLine = [member.city, member.address_area].filter(Boolean).join(" · ");
  const openTags: string[] = [];
  if (member.open_for_lending) openTags.push("Pinjam");
  if (member.open_for_selling) openTags.push("Jual");
  if (member.open_for_trade) openTags.push("Tukar");

  return (
    <Link
      href={href}
      className="group bg-paper border border-hairline rounded-card-lg p-4 md:p-5 shadow-card hover:shadow-card-hover transition-shadow flex flex-col gap-3"
    >
      <div className="flex items-start gap-3">
        <Avatar src={member.photo_url} name={member.full_name} size={48} isAdmin={member.is_admin} />
        <div className="min-w-0 flex-1">
          <p className="text-body-sm font-semibold text-ink leading-tight truncate">
            {member.full_name ?? member.username}
          </p>
          <p className="text-caption text-muted truncate">
            @{member.username}
            {cityLine && <span> · {cityLine}</span>}
          </p>
          {member.profession && (
            <p className="mt-1 text-caption text-ink-soft line-clamp-1">
              {member.profession}
            </p>
          )}
        </div>
      </div>

      {member.bio && (
        <p className="text-body-sm text-ink-soft line-clamp-2">{member.bio}</p>
      )}

      {member.interests && member.interests.length > 0 && (
        <InterestList slugs={member.interests.slice(0, 4)} />
      )}

      {member.intents && member.intents.length > 0 && (
        <IntentList slugs={member.intents.slice(0, 3)} />
      )}

      <div className="mt-auto pt-2 flex items-center justify-between gap-2 border-t border-hairline-soft">
        <span className="text-caption text-muted">
          <span className="font-semibold text-ink">{member.book_count}</span>{" "}
          buku
        </span>
        {openTags.length > 0 && (
          <span className="text-caption text-muted">Buka: {openTags.join(" · ")}</span>
        )}
      </div>
    </Link>
  );
}
