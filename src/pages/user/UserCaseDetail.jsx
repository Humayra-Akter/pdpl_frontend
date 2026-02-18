// src/pages/user/UserCaseDetail.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  Paperclip,
  MessageSquare,
  Clock,
  User2,
  FileText,
  Download,
  Upload,
  Info,
  Tag,
} from "lucide-react";
import {
  getMyCase,
  listCaseComments,
  addCaseComment,
  listCaseAttachments,
  uploadCaseAttachments,
} from "../../lib/user";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function SoftCard({ className = "", children }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_0_rgba(15,23,42,0.03)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function EndpointMissing({ label }) {
  return (
    <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm">
      <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-700" />
      <div>
        <div className="font-semibold text-slate-900">
          {label} not connected
        </div>
        <div className="mt-0.5 text-xs text-slate-600">
          Endpoint missing — showing placeholder UI.
        </div>
      </div>
    </div>
  );
}

function Pill({ children, className = "", icon: Icon }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        className,
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {children}
    </span>
  );
}

function statusPill(status) {
  const s = String(status || "").toUpperCase();
  if (["CLOSED", "COMPLETED", "DONE", "RESOLVED"].includes(s))
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (["NEED_INFO"].includes(s))
    return "border-amber-200 bg-amber-50 text-amber-900";
  if (["IN_REVIEW", "REVIEW"].includes(s))
    return "border-sky-200 bg-sky-50 text-sky-900";
  if (["OPEN", "PENDING", "IN_PROGRESS", "SUBMITTED"].includes(s))
    return "border-indigo-200 bg-indigo-50 text-indigo-800";
  if (["REJECTED", "CANCELLED", "BLOCKED"].includes(s))
    return "border-rose-200 bg-rose-50 text-rose-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function typePill(type) {
  const t = String(type || "").toUpperCase();
  if (t === "INCIDENT") return "border-rose-200 bg-rose-50 text-rose-800";
  if (t === "DSR") return "border-indigo-200 bg-indigo-50 text-indigo-800";
  if (t === "VENDOR") return "border-amber-200 bg-amber-50 text-amber-900";
  if (t === "POLICY" || t === "QUESTION")
    return "border-sky-200 bg-sky-50 text-sky-900";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function fmtDateTime(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleString();
}

function formatBytes(n) {
  const num = Number(n || 0);
  if (!Number.isFinite(num) || num <= 0) return "";
  const kb = num / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
}

function StatTile({ label, value, icon: Icon, tone = "slate" }) {
  const toneMap = {
    slate: "border-slate-200 bg-slate-50 text-slate-900",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-900",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    rose: "border-rose-200 bg-rose-50 text-rose-900",
    sky: "border-sky-200 bg-sky-50 text-sky-900",
  };
  const cls = toneMap[tone] || toneMap.slate;

  return (
    <div className={cn("rounded-2xl border p-4", cls)}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            {label}
          </div>
          <div className="mt-1 truncate text-lg font-semibold">{value}</div>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/70 border border-white/40">
          <Icon className="h-5 w-5 opacity-80" />
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, right }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {Icon ? (
          <div className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-slate-50">
            <Icon className="h-4 w-4 text-slate-700" />
          </div>
        ) : null}
        <div className="text-base font-semibold text-slate-900">{title}</div>
      </div>
      {right}
    </div>
  );
}

export default function UserCaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [item, setItem] = useState(null);

  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsMissing, setCommentsMissing] = useState(false);
  const [comments, setComments] = useState([]);

  const [attLoading, setAttLoading] = useState(true);
  const [attMissing, setAttMissing] = useState(false);
  const [attachments, setAttachments] = useState([]);

  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");

  const fileInputRef = useRef(null);

  async function load() {
    setLoading(true);
    const d = await getMyCase(id);
    setMissing(!!d.missing);
    setItem(d.ok ? d.data?.item || d.data : null);
    setLoading(false);

    setCommentsLoading(true);
    const c = await listCaseComments(id);
    setCommentsMissing(!!c.missing);
    setComments(c.ok ? c.data?.items || c.data || [] : []);
    setCommentsLoading(false);

    setAttLoading(true);
    const a = await listCaseAttachments(id);
    setAttMissing(!!a.missing);
    setAttachments(a.ok ? a.data?.items || a.data || [] : []);
    setAttLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function onPickFiles(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;

    setUploadErr("");
    setUploading(true);

    const res = await uploadCaseAttachments(id, files, "USER_ATTACHMENT");

    setUploading(false);

    if (res.missing) {
      setUploadErr("Upload endpoint missing.");
      return;
    }
    if (!res.ok) {
      setUploadErr(res.error?.message || "Upload failed");
      return;
    }

    const a = await listCaseAttachments(id);
    setAttMissing(!!a.missing);
    setAttachments(a.ok ? a.data?.items || a.data || [] : []);
  }

  async function postComment() {
    if (!newComment.trim()) return;
    setPosting(true);
    const res = await addCaseComment(id, { text: newComment.trim() });
    setPosting(false);

    if (res.missing || !res.ok) return;
    setNewComment("");

    const c = await listCaseComments(id);
    setCommentsMissing(!!c.missing);
    setComments(c.ok ? c.data?.items || c.data || [] : []);
  }

  const title = item?.title || "Request detail";
  const status = item?.status || "—";
  const type = item?.type || "—";
  const assignedTo =
    item?.assignedTo?.fullName ||
    item?.assignedTo?.name ||
    (typeof item?.assignedTo === "string" ? item.assignedTo : null) ||
    "—";

  const derived = useMemo(() => {
    const countComments = Array.isArray(comments) ? comments.length : 0;

    const files = Array.isArray(attachments) ? attachments : [];
    const totalBytes = files.reduce((acc, a) => {
      const f = a.file || a;
      const n = Number(f.sizeBytes || f.size || 0);
      return acc + (Number.isFinite(n) ? n : 0);
    }, 0);

    const attentionHint = (() => {
      const s = String(status || "").toUpperCase();
      if (s === "NEED_INFO")
        return {
          tone: "amber",
          title: "Action needed",
          desc: "This request needs more information. Add details in comments to unblock review.",
        };
      if (["IN_REVIEW", "REVIEW"].includes(s))
        return {
          tone: "sky",
          title: "In review",
          desc: "The team is reviewing your request. You can still add context if needed.",
        };
      if (["SUBMITTED", "OPEN", "IN_PROGRESS", "PENDING"].includes(s))
        return {
          tone: "indigo",
          title: "Tracking",
          desc: "Your request is in progress. Add a deadline/impact if it’s time-sensitive.",
        };
      if (["CLOSED", "COMPLETED", "RESOLVED", "DONE"].includes(s))
        return {
          tone: "emerald",
          title: "Completed",
          desc: "This request is closed. You can download any attachments and keep notes for your records.",
        };
      return {
        tone: "slate",
        title: "Request details",
        desc: "Review the description, track updates, and keep all supporting files here.",
      };
    })();

    return {
      countComments,
      filesCount: files.length,
      totalBytes,
      attentionHint,
    };
  }, [comments, attachments, status]);

  const hintToneMap = {
    slate: "border-slate-200 bg-slate-50 text-slate-900",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-900",
    sky: "border-sky-200 bg-sky-50 text-sky-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    rose: "border-rose-200 bg-rose-50 text-rose-900",
  };
  const hintCls = hintToneMap[derived.attentionHint.tone] || hintToneMap.slate;

  return (
    <div className="space-y-5">
      {/* Header */}
      <SoftCard className="overflow-hidden shadow-md bg-gradient-to-br from-indigo-300/40 to-white/60">
        <div className="relative">
          {/* subtle top accent */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />
          <div className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => navigate("/user/cases")}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:shadow-sm"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="truncate text-xl capitalize font-semibold text-slate-900">
                      {title}
                    </div>

                    <Pill
                      icon={Tag}
                      className={cn("capitalize", typePill(type))}
                    >
                      {type}
                    </Pill>

                    <Pill
                      icon={Info}
                      className={cn("capitalize", statusPill(status))}
                    >
                      {status}
                    </Pill>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                      Request ID: <span className="font-semibold">{id}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1">
                      <Clock className="h-3.5 w-3.5" />
                      Created:{" "}
                      <span className="font-semibold">
                        {fmtDateTime(item?.createdAt)}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1">
                      <RefreshCw className="h-3.5 w-3.5" />
                      Updated:{" "}
                      <span className="font-semibold">
                        {fmtDateTime(item?.updatedAt)}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1">
                      <User2 className="h-3.5 w-3.5" />
                      Assigned:{" "}
                      <span className="font-semibold">{assignedTo}</span>
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={load}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:shadow-sm"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>

            {/* focus banner */}
            <div className={cn("mt-4 rounded-2xl border p-4", hintCls)}>
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/50 bg-white/60">
                  <AlertTriangle className="h-5 w-5 opacity-80" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold">
                    {derived.attentionHint.title}
                  </div>
                  <div className="mt-0.5 text-sm text-slate-700/90">
                    {derived.attentionHint.desc}
                  </div>
                </div>
              </div>
            </div>

            {/* quick stats */}
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <StatTile
                label="Comments"
                value={derived.countComments}
                icon={MessageSquare}
                tone="indigo"
              />
              <StatTile
                label="Attachments"
                value={`${derived.filesCount}${
                  derived.totalBytes
                    ? ` • ${formatBytes(derived.totalBytes)}`
                    : ""
                }`}
                icon={Paperclip}
                tone="sky"
              />
              <StatTile
                label="Owner / Assignee"
                value={assignedTo}
                icon={User2}
                tone="emerald"
              />
            </div>
          </div>
        </div>
      </SoftCard>

      <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        {/* LEFT */}
        <div className="space-y-5">
          {/* Details */}
          <SoftCard className="p-5 shadow-md">
            <SectionHeader icon={FileText} title="Description" />
            <div className="mt-4">
              {missing ? (
                <EndpointMissing label="Case detail" />
              ) : loading ? (
                <div className="space-y-2">
                  <div className="h-5 w-2/3 rounded bg-slate-200/70 animate-pulse" />
                  <div className="h-4 w-full rounded bg-slate-200/70 animate-pulse" />
                  <div className="h-4 w-5/6 rounded bg-slate-200/70 animate-pulse" />
                </div>
              ) : !item ? (
                <div className="text-sm text-slate-600">Not found.</div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-800">
                  {item.description || "—"}
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Timeline
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    Audit-friendly timestamps. (Events can be expanded later.)
                  </div>
                </div>
                <Pill className="border-slate-200 bg-slate-50 text-slate-700">
                  Read-only
                </Pill>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Created
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {fmtDateTime(item?.createdAt)}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Last updated
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {fmtDateTime(item?.updatedAt)}
                  </div>
                </div>
              </div>
            </div>
          </SoftCard>

          {/* Comments */}
          <SoftCard className="p-5 shadow-md">
            <SectionHeader
              icon={MessageSquare}
              title="Comments"
              right={
                <span className="text-sm font-semibold text-slate-600">
                  {commentsLoading ? "…" : `${comments.length} total`}
                </span>
              }
            />

            <div className="mt-4">
              {commentsMissing ? (
                <EndpointMissing label="Comments" />
              ) : commentsLoading ? (
                <div className="space-y-2">
                  <div className="h-12 rounded-2xl bg-slate-100 animate-pulse" />
                  <div className="h-12 w-2/3 rounded-2xl bg-slate-100 animate-pulse" />
                </div>
              ) : comments.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <div className="font-semibold text-slate-900">
                    No comments yet
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    Add missing context (deadline, impact, affected systems) to
                    speed up resolution.
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {comments.map((c, idx) => (
                    <div
                      key={c.id || idx}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="grid h-7 w-7 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700">
                              {(c.author?.name ||
                                c.authorName ||
                                "U")[0]?.toUpperCase()}
                            </div>
                            <div className="text-sm font-semibold text-slate-900">
                              {c.author?.name || c.authorName || "User"}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-slate-500">
                          {c.createdAt ? fmtDateTime(c.createdAt) : ""}
                        </div>
                      </div>

                      <div className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">
                        {c.text || c.message || ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add comment */}
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Add a comment
                  </div>
                  <div className="mt-0.5 text-xs text-slate-600">
                    {commentsMissing
                      ? "Disabled: endpoint missing."
                      : "Helpful: deadline, impact, steps taken, screenshots."}
                  </div>
                </div>
                {String(status || "").toUpperCase() === "NEED_INFO" ? (
                  <Pill className="border-amber-200 bg-amber-50 text-amber-900">
                    Recommended
                  </Pill>
                ) : null}
              </div>

              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={commentsMissing}
                rows={3}
                className={cn(
                  "mt-3 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/40",
                  commentsMissing && "bg-slate-100 text-slate-400",
                )}
                placeholder={
                  commentsMissing
                    ? "Comments endpoint missing"
                    : "Write your comment…"
                }
              />

              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  Tip: Mention “deadline” and “business impact”.
                </div>
                <button
                  onClick={postComment}
                  disabled={commentsMissing || posting || !newComment.trim()}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm",
                    commentsMissing || posting || !newComment.trim()
                      ? "bg-slate-300"
                      : "bg-indigo-600 hover:bg-indigo-700",
                  )}
                >
                  {posting ? "Posting..." : "Post comment"}
                </button>
              </div>
            </div>
          </SoftCard>
        </div>

        {/* RIGHT */}
        <div className="space-y-5">
          {/* Request info */}
          <SoftCard className="p-5 shadow-md lg:top-5">
            <SectionHeader icon={Info} title="Request info" />
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Type
                  </div>
                  <Pill className={typePill(type)}>{type}</Pill>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Status
                  </div>
                  <Pill className={statusPill(status)}>{status}</Pill>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Assigned to
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {assignedTo}
                </div>
              </div>

              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">
                <div className="font-semibold">Focus tip</div>
                <div className="mt-1 text-sm text-indigo-900/90">
                  For urgent requests, add a comment with a clear deadline +
                  what breaks if delayed.
                </div>
              </div>
            </div>
          </SoftCard>

          {/* Attachments */}
          <SoftCard className="p-5 shadow-md">
            <SectionHeader
              icon={Paperclip}
              title="Attachments"
              right={
                <button
                  onClick={async () => {
                    setAttLoading(true);
                    const a = await listCaseAttachments(id);
                    setAttMissing(!!a.missing);
                    setAttachments(a.ok ? a.data?.items || a.data || [] : []);
                    setAttLoading(false);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              }
            />

            <div className="mt-4">
              {attMissing ? (
                <EndpointMissing label="Attachments" />
              ) : attLoading ? (
                <div className="space-y-2">
                  <div className="h-12 rounded-2xl bg-slate-100 animate-pulse" />
                  <div className="h-12 w-2/3 rounded-2xl bg-slate-100 animate-pulse" />
                </div>
              ) : attachments.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <div className="font-semibold text-slate-900">
                    No attachments
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    Upload screenshots or files that support your request.
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {attachments.map((a) => {
                    const file = a.file || a;
                    const name =
                      file.originalName || a.name || a.fileName || "File";
                    const sizeBytes = file.sizeBytes || file.size || 0;
                    const downloadUrl =
                      file.downloadUrl || a.downloadUrl || null;

                    return (
                      <div
                        key={a.id || file.id || name}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900">
                              {name}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {formatBytes(sizeBytes)}
                            </div>
                          </div>

                          {downloadUrl ? (
                            <a
                              href={downloadUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </a>
                          ) : (
                            <span className="text-xs text-slate-500">
                              No link
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4">
              {uploadErr && (
                <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                  {uploadErr}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                disabled={attMissing || uploading}
                onChange={onPickFiles}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={attMissing || uploading}
                className={cn(
                  "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition",
                  attMissing || uploading
                    ? "cursor-not-allowed border border-slate-200 bg-slate-50 text-slate-400"
                    : "border border-indigo-200 bg-indigo-600 text-white hover:bg-indigo-700",
                )}
              >
                {uploading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload files
                  </>
                )}
              </button>

              <div className="mt-2 text-xs text-slate-500">
                Max 10 files • 10MB each • Stored in Supabase (signed URL).
              </div>
            </div>
          </SoftCard>
        </div>
      </div>
    </div>
  );
}
