import mongoose from "mongoose";

// ── Conversation ──────────────────────────────────────────
const conversationSchema = new mongoose.Schema(
  {
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    isGroup: { type: Boolean, default: false },
    groupName: { type: String },
    groupAvatar: { type: String },
    groupAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

conversationSchema.index({ participants: 1 });
export const Conversation = mongoose.model("Conversation", conversationSchema);

// ── Message ───────────────────────────────────────────────
const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true, maxlength: 5000 },
    attachments: [{ type: String }],
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
export const Message = mongoose.model("Message", messageSchema);

// ── Notification ──────────────────────────────────────────
const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      enum: [
        "connection_request",
        "connection_accepted",
        "post_like",
        "post_comment",
        "mentorship_request",
        "mentorship_accepted",
        "job_match",
        "event_reminder",
        "message",
        "system",
        "profile_view",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed },
    read: { type: Boolean, default: false },
    deliveredViaEmail: { type: Boolean, default: false },
    deliveredViaSMS: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
export const Notification = mongoose.model("Notification", notificationSchema);

// ── Post ─────────────────────────────────────────────────
const commentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true, maxlength: 2000 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true, maxlength: 5000 },
    images: [{ type: String }],
    files: [
      {
        name: String,
        url: String,
        size: Number,
        type: String,
      },
    ],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema],
    tags: [{ type: String, lowercase: true, trim: true }],
    visibility: {
      type: String,
      enum: ["public", "connections", "private"],
      default: "public",
    },
    views: { type: Number, default: 0 },
    isFlagged: { type: Boolean, default: false },
  },
  { timestamps: true },
);

postSchema.index({ author: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ content: "text" });
export const Post = mongoose.model("Post", postSchema);

// ── Connection ────────────────────────────────────────────
const connectionSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
    message: { type: String, maxlength: 300 },
  },
  { timestamps: true },
);

connectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });
connectionSchema.index({ status: 1 });
export const Connection = mongoose.model("Connection", connectionSchema);

// ── Job ───────────────────────────────────────────────────
const jobApplicationSchema = new mongoose.Schema(
  {
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    coverLetter: { type: String, maxlength: 3000 },
    resume: { type: String },
    status: {
      type: String,
      enum: ["pending", "reviewed", "shortlisted", "rejected", "hired"],
      default: "pending",
    },
  },
  { timestamps: true },
);

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    companyLogo: { type: String },
    location: { type: String, required: true },
    type: {
      type: String,
      enum: ["full-time", "part-time", "contract", "internship", "remote"],
      default: "full-time",
    },
    description: { type: String, required: true },
    requirements: [{ type: String }],
    salary: {
      min: Number,
      max: Number,
      currency: { type: String, default: "USD" },
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    applications: [jobApplicationSchema],
    savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    deadline: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

jobSchema.index({ title: "text", company: "text", description: "text" });
jobSchema.index({ isActive: 1, createdAt: -1 });
export const JobOpportunity = mongoose.model("JobOpportunity", jobSchema);

// ── Event ─────────────────────────────────────────────────
const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    location: { type: String },
    isVirtual: { type: Boolean, default: false },
    meetingLink: { type: String },
    image: { type: String },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    maxAttendees: { type: Number },
    tags: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

eventSchema.index({ startDate: 1 });
eventSchema.index({ organizer: 1 });
export const Event = mongoose.model("Event", eventSchema);

// ── MentorshipRequest ─────────────────────────────────────
const mentorshipSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    alumni: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    topic: { type: String, required: true },
    message: { type: String, required: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "completed"],
      default: "pending",
    },
    responseMessage: { type: String },
    scheduledAt: { type: Date },
  },
  { timestamps: true },
);

export const MentorshipRequest = mongoose.model(
  "MentorshipRequest",
  mentorshipSchema,
);

// ── StudentQuestion ───────────────────────────────────────
const questionResponseSchema = new mongoose.Schema(
  {
    alumni: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

const questionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    tags: [{ type: String }],
    responses: [questionResponseSchema],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isResolved: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const StudentQuestion = mongoose.model(
  "StudentQuestion",
  questionSchema,
);

// ── Skill ─────────────────────────────────────────────────
const skillSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    category: { type: String, default: "General" },
    proficiency: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "expert"],
      default: "beginner",
    },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    endorsements: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

export const Skill = mongoose.model("Skill", skillSchema);

// ── ActivityLog ───────────────────────────────────────────
const activityLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    activityType: { type: String, required: true },
    description: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
  },
  { timestamps: true },
);

activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ activityType: 1 });
export const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);

// ── AlumniProfile ─────────────────────────────────────────
const alumniProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    graduationYear: { type: Number },
    currentCompany: { type: String },
    currentPosition: { type: String },
    industry: { type: String },
    yearsExperience: { type: Number },
    expertise: [{ type: String }],
    mentorshipAvailable: { type: Boolean, default: true },
    linkedin: { type: String },
    github: { type: String },
    website: { type: String },
  },
  { timestamps: true },
);

export const AlumniProfile = mongoose.model(
  "AlumniProfile",
  alumniProfileSchema,
);

// ── StudentProfile ────────────────────────────────────────
const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    program: { type: String },
    year: { type: Number },
    gpa: { type: Number, min: 0, max: 4.0 },
    skills: [{ type: String }],
    interests: [{ type: String }],
    careerGoals: { type: String },
    portfolio: { type: String },
    github: { type: String },
    linkedin: { type: String },
  },
  { timestamps: true },
);

export const StudentProfile = mongoose.model(
  "StudentProfile",
  studentProfileSchema,
);

// ── SavedSearch ───────────────────────────────────────────
const savedSearchSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    query: { type: String, required: true },
    filters: { type: mongoose.Schema.Types.Mixed },
    notifications: { type: Boolean, default: false },
    resultCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const SavedSearch = mongoose.model("SavedSearch", savedSearchSchema);

// ── Settings ──────────────────────────────────────────────
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    description: { type: String },
  },
  { timestamps: true },
);

export const Setting = mongoose.model("Setting", settingSchema);

// ── ContentModeration ─────────────────────────────────────
const moderationSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetType: {
      type: String,
      enum: ["post", "comment", "user", "job", "event"],
      required: true,
    },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved", "dismissed"],
      default: "pending",
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewNote: { type: String },
  },
  { timestamps: true },
);

export const ContentModeration = mongoose.model(
  "ContentModeration",
  moderationSchema,
);

export default {
  Conversation,
  Message,
  Notification,
  Post,
  Connection,
  JobOpportunity,
  Event,
  MentorshipRequest,
  StudentQuestion,
  Skill,
  ActivityLog,
  AlumniProfile,
  StudentProfile,
  SavedSearch,
  Setting,
  ContentModeration,
};
