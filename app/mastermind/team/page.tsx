import Link from "next/link";
import { listTasks, type TaskWithRefs } from "@/lib/mastermind/tasks";
import { FilterRow, FilterPill } from "@/components/mastermind/filter-pills";
import { Avatar } from "@/components/ui/avatar";
import { TaskStatusControl } from "@/components/mastermind/task-status-control";
import type { TaskStatus, TaskPriority } from "@/types";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "Todo",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
  canceled: "Canceled",
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "Low",
  med: "Med",
  high: "High",
  urgent: "Urgent",
};

const PRIORITY_TONE: Record<TaskPriority, string> = {
  low: "bg-cream text-muted border border-hairline",
  med: "bg-(--color-okr-done-bg) text-(--color-okr-done)",
  high: "bg-(--color-okr-at-risk-bg) text-(--color-okr-at-risk)",
  urgent: "bg-(--color-okr-behind-bg) text-(--color-okr-behind)",
};

type SP = {
  status?: TaskStatus | "all";
  priority?: TaskPriority | "all";
  owner?: "any" | "unassigned";
};

export default async function TeamTaskPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const { status = "all", priority = "all", owner = "any" } = await searchParams;
  const tasks = await listTasks({ status, priority, ownerId: owner });

  const allCounts = await listTasks(); // unfiltered for pill counts
  const countByStatus: Record<TaskStatus | "all", number> = {
    all: allCounts.length,
    todo: 0,
    in_progress: 0,
    blocked: 0,
    done: 0,
    canceled: 0,
  };
  for (const t of allCounts) countByStatus[t.status] += 1;
  const countOwned = allCounts.filter((t) => t.owner_id).length;
  const ownedPct = allCounts.length === 0 ? 0 : Math.round((countOwned / allCounts.length) * 100);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="text-caption text-muted uppercase tracking-wide font-semibold">
          Team & Task Tracker
        </p>
        <h1 className="font-display text-display-xl text-ink leading-tight">
          {allCounts.length} task · {ownedPct}% punya owner.
        </h1>
        <p className="text-body text-ink-soft max-w-2xl">
          Setiap task bisa di-link ke OKR Objective dan/atau spesifik KR.
          Target: 100% task punya owner (KR Q2-2026-O5-KR1).
        </p>
      </header>

      <div className="flex flex-col gap-3">
        <FilterRow label="Status">
          <FilterPill href={hrefWith({ status: "all", priority, owner })} active={status === "all"} label={`Semua (${countByStatus.all})`} />
          {(Object.keys(STATUS_LABEL) as TaskStatus[]).map((s) => (
            <FilterPill
              key={s}
              href={hrefWith({ status: s, priority, owner })}
              active={status === s}
              label={`${STATUS_LABEL[s]} (${countByStatus[s]})`}
            />
          ))}
        </FilterRow>
        <FilterRow label="Priority">
          <FilterPill href={hrefWith({ status, priority: "all", owner })} active={priority === "all"} label="Semua" />
          {(Object.keys(PRIORITY_LABEL) as TaskPriority[]).map((p) => (
            <FilterPill
              key={p}
              href={hrefWith({ status, priority: p, owner })}
              active={priority === p}
              label={PRIORITY_LABEL[p]}
            />
          ))}
        </FilterRow>
        <FilterRow label="Owner">
          <FilterPill href={hrefWith({ status, priority, owner: "any" })} active={owner === "any"} label="Semua" />
          <FilterPill href={hrefWith({ status, priority, owner: "unassigned" })} active={owner === "unassigned"} label={`Unassigned (${allCounts.filter((t) => !t.owner_id).length})`} />
        </FilterRow>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-paper border border-hairline rounded-card-lg shadow-card p-10 text-center">
          <p className="font-display text-title-lg text-ink">No task matching.</p>
          <p className="mt-2 text-body text-muted">Coba reset filter atau tambah task baru.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {tasks.map((t) => (
            <li key={t.id}>
              <TaskRow task={t} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TaskRow({ task }: { task: TaskWithRefs }) {
  return (
    <article className="bg-paper border border-hairline rounded-card-lg shadow-card p-4 md:p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {task.code && (
              <span className="text-caption text-muted font-mono uppercase">{task.code}</span>
            )}
            <span className={cn(
              "inline-flex items-center h-5 px-1.5 rounded-pill text-[10px] font-semibold tracking-wide",
              PRIORITY_TONE[task.priority],
            )}>
              {PRIORITY_LABEL[task.priority]}
            </span>
          </div>
          <p className="mt-1 text-body text-ink font-medium leading-snug">{task.title}</p>
          {task.objective && (
            <p className="mt-1 text-caption text-muted">
              ↳{" "}
              <Link
                href="/mastermind/okrs"
                className="hover:text-ink underline underline-offset-4 decoration-hairline-strong"
              >
                {task.objective.code} · {task.objective.title}
              </Link>
              {task.kr && (
                <>
                  {" · "}
                  <Link
                    href={`/mastermind/okrs/${task.related_kr_id}`}
                    className="hover:text-ink underline underline-offset-4 decoration-hairline-strong"
                  >
                    KR {task.kr.code}
                  </Link>
                </>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {task.owner ? (
            <div className="flex items-center gap-2">
              <Avatar src={task.owner.photo_url} name={task.owner.full_name ?? task.owner.username} size={28} />
              <span className="text-caption text-ink-soft">
                {task.owner.full_name ?? `@${task.owner.username}`}
              </span>
            </div>
          ) : (
            <span className="inline-flex items-center h-6 px-2 rounded-pill bg-(--color-okr-at-risk-bg) text-(--color-okr-at-risk) text-[11px] font-semibold tracking-wide">
              Belum ada owner
            </span>
          )}
        </div>
      </div>
      <TaskStatusControl taskId={task.id} currentStatus={task.status} />
    </article>
  );
}

function hrefWith(opts: SP): string {
  const params = new URLSearchParams();
  if (opts.status && opts.status !== "all") params.set("status", opts.status);
  if (opts.priority && opts.priority !== "all") params.set("priority", opts.priority);
  if (opts.owner && opts.owner !== "any") params.set("owner", opts.owner);
  const qs = params.toString();
  return "/mastermind/team" + (qs ? `?${qs}` : "");
}
