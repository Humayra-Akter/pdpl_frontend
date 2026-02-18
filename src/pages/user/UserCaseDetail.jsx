// src/pages/user/UserCaseDetail.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  Paperclip,
  MessageSquare,
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
      className={cn("rounded-xl border border-slate-200 bg-white", className)}
    >
      {children}
    </div>
  );
}

function EndpointMissing({ label }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
      <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
      <div>
        <div className="text-slate-700 font-semibold">
          {label} not connected
        </div>
        <div className="text-xs text-slate-500">
          Endpoint missing — showing placeholder UI.
        </div>
      </div>
    </div>
  );
}

function Badge({ value }) {
  const v = String(value || "").toUpperCase();
  const cls = ["CLOSED", "COMPLETED", "DONE", "RESOLVED"].includes(v)
    ? "bg-emerald-100 text-emerald-800"
    : ["OPEN", "PENDING", "IN_PROGRESS", "REVIEW"].includes(v)
      ? "bg-amber-100 text-amber-800"
      : ["REJECTED", "CANCELLED", "BLOCKED"].includes(v)
        ? "bg-rose-100 text-rose-800"
        : "bg-slate-100 text-slate-700";
  return (
    <span className={cn("rounded-full px-2 py-1 text-xs font-semibold", cls)}>
      {value || "—"}
    </span>
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
      e.target.value = ""; // allow re-pick same file
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

      // refresh attachments
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

  return (
    <div className="space-y-4">
      <SoftCard className="p-4 shadow-sm ring ring-rose-100 bg-gradient-to-br from-rose-100 to-red-100/50">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/user/cases")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div>
              <div className="text-lg capitalize font-semibold text-indigo-700">
                {title}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                Request ID: {id}
              </div>
            </div>
          </div>

          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </SoftCard>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        {/* LEFT: main */}
        <div className="space-y-4">
          <SoftCard className="p-5 shadow-sm ">
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
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-lg capitalize font-semibold text-indigo-700">
                      {item.title}
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                      {item.type || "—"}
                    </div>
                  </div>
                  <Badge value={item.status} />
                </div>

                <div className="rounded-xl shadow-xs border capitalize border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 leading-relaxed">
                  {item.description || "—"}
                </div>

                {/* Timeline (read-only, placeholder) */}
                <div className="rounded-xl shadow-xs border border-slate-200 bg-white p-4">
                  <div className="text-md font-semibold text-indigo-700">
                    Timeline
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Read-only timeline (will expand when backend provides
                    events).
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="rounded-xl bg-slate-100/70 p-3">
                      <div className="text-sm font-semibold text-indigo-700">
                        Created
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleString()
                          : "—"}
                      </div>
                    </div>
                    <div className="rounded-xl bg-slate-100/70 p-3">
                      <div className="text-sm font-semibold text-indigo-700">
                        Last updated
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.updatedAt
                          ? new Date(item.updatedAt).toLocaleString()
                          : "—"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </SoftCard>

          {/* Comments */}
          <SoftCard className="p-5 shadow-sm ">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-600" />
              <div className="text-md font-semibold text-indigo-700">
                Comments
              </div>
            </div>

            <div className="mt-3">
              {commentsMissing ? (
                <EndpointMissing label="Comments" />
              ) : commentsLoading ? (
                <div className="space-y-2">
                  <div className="h-10 rounded-xl bg-slate-100 animate-pulse" />
                  <div className="h-10 w-2/3 rounded-xl bg-slate-100 animate-pulse" />
                </div>
              ) : comments.length === 0 ? (
                <div className="rounded-xl shadow-xs border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  No comments yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {comments?.map((c, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200 bg-white p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-slate-700">
                          {c.author?.name || c.authorName || "User"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {c.createdAt
                            ? new Date(c.createdAt).toLocaleString()
                            : ""}
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-slate-600">
                        {c.text || c.message || ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add comment */}
            <div className="mt-4 rounded-xl shadow-sm border border-slate-200/70 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-indigo-700">
                Add comment
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {commentsMissing
                  ? "Disabled: endpoint missing."
                  : "Add more context to speed up resolution."}
              </div>

              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={commentsMissing}
                rows={3}
                className={cn(
                  "mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400",
                  commentsMissing && "bg-slate-100 text-slate-400",
                )}
                placeholder={
                  commentsMissing
                    ? "Comments endpoint missing"
                    : "Write your comment…"
                }
              />

              <div className="mt-3 flex justify-end">
                <button
                  onClick={postComment}
                  disabled={commentsMissing || posting || !newComment.trim()}
                  className={cn(
                    "rounded-xl px-4 py-2 text-sm font-semibold text-white",
                    commentsMissing || posting || !newComment.trim()
                      ? "bg-slate-300"
                      : "bg-blue-600 hover:bg-blue-700",
                  )}
                >
                  {posting ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          </SoftCard>
        </div>

        {/* RIGHT: side panels */}
        <div className="space-y-4">
          <SoftCard className="p-5 shadow-sm ">
            <div className="text-md font-semibold text-indigo-700">
              Request info
            </div>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Type</span>
                <span className="font-semibold text-slate-700">
                  {item?.type || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Status</span>
                <span className="font-semibold text-slate-700">
                  {item?.status || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Assigned to</span>
                <span className="font-semibold text-slate-700">
                  {item?.assignedTo?.name || item?.assignedTo || "—"}
                </span>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
              Tip: If this request is urgent, add a comment with the deadline
              and impact.
            </div>
          </SoftCard>

          <SoftCard className="p-5 shadow-sm ">
            <div className="flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-slate-600" />
              <div className="text-md font-semibold text-indigo-700">
                Attachments
              </div>
            </div>

            <div className="mt-3">
              {attMissing ? (
                <EndpointMissing label="Attachments" />
              ) : attLoading ? (
                <div className="space-y-2">
                  <div className="h-10 rounded-xl bg-slate-100 animate-pulse" />
                  <div className="h-10 w-2/3 rounded-xl bg-slate-100 animate-pulse" />
                </div>
              ) : attachments.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  No attachments.
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
                        key={a.id || file.id}
                        className="rounded-xl border border-slate-200 bg-white p-3"
                      >
                        <div className="text-sm font-semibold text-slate-700">
                          {name}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {sizeBytes
                            ? `${Math.round(sizeBytes / 1024)} KB`
                            : ""}
                        </div>

                        {downloadUrl ? (
                          <a
                            href={downloadUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                          >
                            Download
                          </a>
                        ) : (
                          <div className="mt-2 text-xs text-slate-500">
                            Download link unavailable (storage not configured)
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4">
              {uploadErr && (
                <div className="mb-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                  {uploadErr}
                </div>
              )}

              <label
                className={cn(
                  "flex w-full cursor-pointer items-center justify-center rounded-xl border px-3 py-2 text-sm font-semibold transition",
                  attMissing || uploading
                    ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                    : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
                )}
              >
                <input
                  type="file"
                  multiple
                  className="hidden"
                  disabled={attMissing || uploading}
                  onChange={onPickFiles}
                />
                {uploading ? "Uploading..." : "Upload files"}
              </label>
            </div>
          </SoftCard>
        </div>
      </div>
    </div>
  );
}
