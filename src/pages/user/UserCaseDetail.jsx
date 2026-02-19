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
  Trash2,
  X,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import {
  getMyCase,
  listCaseComments,
  addCaseComment,
  listCaseAttachments,
  uploadCaseAttachments,
  deleteCaseAttachment,
} from "../../lib/user";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function SoftCard({ className = "", children }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_0_rgba(15,23,42,0.05)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function EndpointMissing({ label }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
      <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-700" />
      <div>
        <div className="font-semibold text-slate-900">
          {label} not connected
        </div>
        <div className="mt-0.5 text-xs text-slate-700/80">
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

function SectionHeader({ icon: Icon, title, subtitle, right }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-2.5">
        {Icon ? (
          <div className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-slate-50">
            <Icon className="h-5 w-5 text-indigo-700" />
          </div>
        ) : null}
        <div className="min-w-0">
          <div className="text-lg font-semibold text-indigo-700">{title}</div>
          {subtitle ? (
            <div className="mt-0.5 text-sm text-slate-600">{subtitle}</div>
          ) : null}
        </div>
      </div>
      {right}
    </div>
  );
}

function StatTile({ label, value, icon: Icon, tone = "slate" }) {
  const toneMap = {
    slate: "border-slate-200 bg-slate-50",
    indigo: "border-indigo-200 bg-indigo-50",
    emerald: "border-emerald-200 bg-emerald-50",
    amber: "border-amber-200 bg-amber-50",
    rose: "border-rose-200 bg-rose-50",
    sky: "border-sky-200 bg-sky-50",
  };
  const cls = toneMap[tone] || toneMap.slate;

  return (
    <div className={cn("rounded-xl border p-4", cls)}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            {label}
          </div>
          <div className="mt-1 truncate text-lg font-semibold text-slate-900">
            {value}
          </div>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/70 border border-white/40">
          <Icon className="h-5 w-5 text-slate-700" />
        </div>
      </div>
    </div>
  );
}

function fileIconByName(name = "") {
  const ext = String(name).split(".").pop()?.toLowerCase();
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) return "image";
  if (["pdf"].includes(ext)) return "pdf";
  if (["doc", "docx"].includes(ext)) return "doc";
  if (["xls", "xlsx", "csv"].includes(ext)) return "sheet";
  return "file";
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

  const [deletingId, setDeletingId] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(null); // attachment object
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

    if (res.missing) return setUploadErr("Upload endpoint missing.");
    if (!res.ok) return setUploadErr(res.error?.message || "Upload failed");

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

  async function refreshAttachments() {
    setAttLoading(true);
    const a = await listCaseAttachments(id);
    setAttMissing(!!a.missing);
    setAttachments(a.ok ? a.data?.items || a.data || [] : []);
    setAttLoading(false);
  }

  async function removeAttachment(linkId) {
    const yes = window.confirm("Remove this attachment?");
    if (!yes) return;

    setDeletingId(String(linkId));
    const res = await deleteCaseAttachment(id, linkId);
    setDeletingId("");

    if (!res.ok) {
      setUploadErr(res.error?.message || "Failed to remove attachment");
      return;
    }

    await refreshAttachments();
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

    const s = String(status || "").toUpperCase();
    const nextAction =
      s === "NEED_INFO"
        ? {
            tone: "amber",
            text: "Add missing details in comments (recommended).",
          }
        : ["IN_REVIEW", "REVIEW"].includes(s)
          ? {
              tone: "sky",
              text: "Waiting for review — add extra context only if needed.",
            }
          : ["SUBMITTED", "OPEN", "IN_PROGRESS", "PENDING"].includes(s)
            ? {
                tone: "indigo",
                text: "Track updates — add deadline/impact if urgent.",
              }
            : ["CLOSED", "COMPLETED", "RESOLVED", "DONE"].includes(s)
              ? {
                  tone: "emerald",
                  text: "Completed — download evidence for records.",
                }
              : {
                  tone: "slate",
                  text: "Review details and keep everything in one place.",
                };

    const focusBanner =
      s === "NEED_INFO"
        ? {
            tone: "amber",
            icon: AlertTriangle,
            title: "Action needed",
            desc: "This request is blocked because the privacy team needs more information. Add missing details below.",
          }
        : ["IN_REVIEW", "REVIEW"].includes(s)
          ? {
              tone: "sky",
              icon: Info,
              title: "In review",
              desc: "The privacy team is reviewing your request. You can still upload supporting evidence if necessary.",
            }
          : s === "INCIDENT"
            ? {
                tone: "rose",
                icon: ShieldAlert,
                title: "Incident tracking",
                desc: "If this is urgent, add timeline + impact + affected systems in a comment. Upload screenshots/logs.",
              }
            : {
                tone: "indigo",
                icon: CheckCircle2,
                title: "Everything in one place",
                desc: "Track progress, keep evidence, and communicate with the privacy team from this page.",
              };

    return {
      countComments,
      filesCount: files.length,
      totalBytes,
      nextAction,
      focusBanner,
    };
  }, [comments, attachments, status]);

  const bannerTone =
    {
      slate: "border-slate-200 bg-slate-50",
      indigo: "border-indigo-200 bg-indigo-50",
      sky: "border-sky-200 bg-sky-50",
      amber: "border-amber-200 bg-amber-50",
      emerald: "border-emerald-200 bg-emerald-50",
      rose: "border-rose-200 bg-rose-50",
    }[derived.focusBanner.tone] || "border-slate-200 bg-slate-50";

  const BannerIcon = derived.focusBanner.icon || Info;

  return (
    <div className="space-y-5">
      {/* Top: page header with strong hierarchy */}
      <SoftCard className="overflow-hidden">
        {/* subtle accent strip (not tacky gradient blocks) */}

        <div className="p-5 bg-blue-100/50 shadow-md border border-slate-200/80 rounded-xl">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-4 min-w-0">
              <button
                onClick={() => navigate("/user/cases")}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="truncate capitalize text-2xl font-semibold text-indigo-700">
                    {title}
                  </div>

                  <Pill icon={Tag} className={cn("capitalize", typePill(type))}>
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
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          {/* Focus banner */}
          <div className={cn("mt-4 rounded-xl border p-4", bannerTone)}>
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/50 bg-white/60">
                <BannerIcon className="h-5 w-5 text-slate-800" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900">
                  {derived.focusBanner.title}
                </div>
                <div className="mt-0.5 text-sm text-slate-700">
                  {derived.focusBanner.desc}
                </div>
              </div>
            </div>
          </div>

          {/* Stat tiles (now 4 tiles to increase clarity/focus) */}
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Next action"
              value={derived.nextAction.text}
              icon={CheckCircle2}
              tone={derived.nextAction.tone}
            />
            <StatTile
              label="Comments"
              value={commentsLoading ? "…" : derived.countComments}
              icon={MessageSquare}
              tone="indigo"
            />
            <StatTile
              label="Attachments"
              value={`${derived.filesCount}${derived.totalBytes ? ` • ${formatBytes(derived.totalBytes)}` : ""}`}
              icon={Paperclip}
              tone="sky"
            />
            <StatTile
              label="Assigned to"
              value={assignedTo}
              icon={User2}
              tone="emerald"
            />
          </div>
        </div>
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />
      </SoftCard>

      <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        {/* LEFT */}
        <div className="space-y-5">
          {/* Description */}
          <SoftCard className="p-5 shadow-md">
            <SectionHeader
              icon={FileText}
              title="Description"
              subtitle="What you submitted (audit-friendly)."
            />

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
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
                  {item.description || "—"}
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Timeline
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    Created / updated timestamps. (Events can expand later.)
                  </div>
                </div>
                <Pill className="border-slate-200 bg-slate-50 text-slate-700">
                  Read-only
                </Pill>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Created
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {fmtDateTime(item?.createdAt)}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
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
              subtitle="Ask/answer questions and add missing context."
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
                  <div className="h-12 rounded-xl bg-slate-100 animate-pulse" />
                  <div className="h-12 w-2/3 rounded-xl bg-slate-100 animate-pulse" />
                </div>
              ) : comments.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <div className="font-semibold text-slate-900">
                    No comments yet
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    Add deadline + business impact + affected systems to speed
                    up resolution.
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {comments.map((c, idx) => (
                    <div
                      key={c.id || idx}
                      className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700">
                            {(c.author?.name ||
                              c.authorName ||
                              "U")[0]?.toUpperCase()}
                          </div>
                          <div className="text-sm font-semibold text-slate-900">
                            {c.author?.name || c.authorName || "User"}
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
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Add a comment
                  </div>
                  <div className="mt-0.5 text-xs text-slate-600">
                    Helpful: deadline, impact, steps taken, what you tried,
                    screenshots.
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
                  "mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/40",
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
                  Tip: Start with “Deadline:” and “Impact:”.
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
          <SoftCard className="p-5 lg:top-5 shadow-md">
            <SectionHeader
              icon={Info}
              title="Request info"
              subtitle="Quick facts (always visible)."
            />
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Type
                  </div>
                  <Pill className={typePill(type)}>{type}</Pill>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Status
                  </div>
                  <Pill className={statusPill(status)}>{status}</Pill>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Assigned to
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {assignedTo}
                </div>
              </div>

              <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">
                <div className="font-semibold">Focus tip</div>
                <div className="mt-1 text-sm text-indigo-900/90">
                  For urgent requests, comment with a deadline + what breaks if
                  delayed.
                </div>
              </div>
            </div>
          </SoftCard>

          {/* Attachments */}
          <SoftCard className="p-5 shadow-md">
            <SectionHeader
              icon={Paperclip}
              title="Attachments"
              subtitle="Evidence and supporting files."
              right={
                <button
                  onClick={refreshAttachments}
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
                  <div className="h-12 rounded-xl bg-slate-100 animate-pulse" />
                  <div className="h-12 w-2/3 rounded-xl bg-slate-100 animate-pulse" />
                </div>
              ) : attachments.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <div className="font-semibold text-slate-900">
                    No attachments
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    Upload screenshots, logs, or documents to support your
                    request.
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
                    const attId = a.id || file.id || name;
                    const kind = fileIconByName(name);

                    return (
                      <div
                        key={attId}
                        className="rounded-xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-slate-50">
                              {kind === "image" ? (
                                <span className="text-xs font-bold text-slate-700">
                                  IMG
                                </span>
                              ) : kind === "pdf" ? (
                                <span className="text-xs font-bold text-slate-700">
                                  PDF
                                </span>
                              ) : kind === "doc" ? (
                                <span className="text-xs font-bold text-slate-700">
                                  DOC
                                </span>
                              ) : kind === "sheet" ? (
                                <span className="text-xs font-bold text-slate-700">
                                  XLS
                                </span>
                              ) : (
                                <span className="text-xs font-bold text-slate-700">
                                  FILE
                                </span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-slate-900">
                                {name}
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                {formatBytes(sizeBytes)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
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

                            <button
                              type="button"
                              onClick={() => removeAttachment(a.id)}
                              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                              title="Remove attachment"
                              disabled={deletingId === String(a.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4">
              {uploadErr && (
                <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
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
