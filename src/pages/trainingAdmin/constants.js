import { FileText, Link as LinkIcon, Video, ClipboardList } from "lucide-react";

const CONTENT_TYPES = [
  { key: "DOC", label: "Document (PDF)", icon: FileText },
  { key: "LINK", label: "External Link", icon: LinkIcon },
  { key: "VIDEO", label: "Video (future)", icon: Video },
  { key: "ASSESSMENT", label: "Assessment (Quiz)", icon: ClipboardList },
];

const DIFFICULTY = ["EASY", "MEDIUM", "HARD"];
const STATUS = ["DRAFT", "PENDING_DPO_APPROVAL", "PUBLISHED", "ARCHIVED"];
const ASSIGNMENT_STATUS = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
  "OVERDUE",
];

export { CONTENT_TYPES, DIFFICULTY, STATUS, ASSIGNMENT_STATUS };
