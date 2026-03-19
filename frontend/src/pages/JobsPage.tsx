import React, { useState, useEffect, useRef } from "react";
import { jobsApi } from "@/services/api";
import type { Job } from "@/types";
import { useAuthStore } from "@/store/authStore";
import Avatar from "@/components/shared/Avatar";
import Modal from "@/components/shared/Modal";
import { formatRelativeTime, cn } from "@/utils";
import toast from "react-hot-toast";

// ── Job Detail Modal ──────────────────────────────────────────
function JobDetailModal({
  job,
  open,
  onClose,
}: {
  job: Job | null;
  open: boolean;
  onClose: () => void;
}) {
  const [applying, setApplying] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [showApply, setShowApply] = useState(false);

  const handleApply = async () => {
    if (!job) return;
    setApplying(true);
    try {
      await jobsApi.applyForJob(job._id, { coverLetter });
      toast.success("Application submitted!");
      setShowApply(false);
      onClose();
    } catch (e: unknown) {
      toast.error((e as Error).message || "Could not apply");
    }
    setApplying(false);
  };

  if (!job) return null;
  return (
    <Modal open={open} onClose={onClose} title="Job Details" size="lg">
      <div className="space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {job.companyLogo ? (
              <img
                src={job.companyLogo}
                alt={job.company}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-gray-400">
                {job.company[0]}
              </span>
            )}
          </div>
          <div>
            <h2
              className="text-lg font-bold text-gray-900"
              style={{ fontFamily: "Sora, sans-serif" }}
            >
              {job.title}
            </h2>
            <p className="text-sm text-gray-500">
              {job.company} · {job.location}
            </p>
            <div className="flex gap-2 mt-2">
              <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full capitalize">
                {job.type}
              </span>
              {job.salary && (
                <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  ${job.salary.min?.toLocaleString()} – $
                  {job.salary.max?.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="prose prose-sm max-w-none">
          <p className="text-sm text-gray-700 leading-relaxed">
            {job.description}
          </p>
        </div>

        {job.requirements && job.requirements.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-2">
              Requirements
            </h3>
            <ul className="space-y-1.5">
              {job.requirements.map((r, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-gray-600"
                >
                  <span className="text-brand-blue mt-0.5">•</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {job.deadline && (
          <p className="text-xs text-gray-400">
            Application deadline:{" "}
            {new Date(job.deadline).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        )}

        {!showApply ? (
          <div className="flex gap-3">
            <button
              onClick={() => setShowApply(true)}
              className="btn-primary flex-1"
            >
              Apply Now
            </button>
            <button
              onClick={() =>
                jobsApi.saveJob(job._id).then(() => toast.success("Job saved!"))
              }
              className="btn-secondary flex-1"
            >
              Save Job
            </button>
          </div>
        ) : (
          <div className="space-y-3 border-t border-gray-100 pt-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                Cover Letter (optional)
              </label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={5}
                className="input-field resize-none"
                placeholder="Tell them why you're a great fit…"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleApply}
                disabled={applying}
                className="btn-primary flex-1"
              >
                {applying ? "Submitting…" : "Submit Application"}
              </button>
              <button
                onClick={() => setShowApply(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── Post Job Modal ─────────────────────────────────────────────
function PostJobModal({
  open,
  onClose,
  onPosted,
}: {
  open: boolean;
  onClose: () => void;
  onPosted: (j: Job) => void;
}) {
  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    type: "full-time",
    description: "",
    requirements: "",
    salaryMin: "",
    salaryMax: "",
    deadline: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title || !form.company || !form.location || !form.description) {
      toast.error("Please fill all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const job = await jobsApi.postJob({
        title: form.title,
        company: form.company,
        location: form.location,
        type: form.type as Job["type"],
        description: form.description,
        requirements: form.requirements.split("\n").filter(Boolean),
        ...(form.salaryMin && form.salaryMax
          ? {
              salary: {
                min: +form.salaryMin,
                max: +form.salaryMax,
                currency: "USD",
              },
            }
          : {}),
        ...(form.deadline
          ? { deadline: new Date(form.deadline).toISOString() }
          : {}),
      });
      onPosted(job);
      toast.success("Job posted!");
      onClose();
    } catch {
      toast.error("Failed to post job");
    }
    setSubmitting(false);
  };

  return (
    <Modal open={open} onClose={onClose} title="Post a Job" size="lg">
      <div className="space-y-[0.1rem]">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">
              Job Title *
            </label>
            <input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              className="input-field"
              placeholder="e.g. Senior UX Designer"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">
              Company *
            </label>
            <input
              value={form.company}
              onChange={(e) => update("company", e.target.value)}
              className="input-field"
              placeholder="Company name"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">
              Location *
            </label>
            <input
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              className="input-field"
              placeholder="City, Country or Remote"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">
              Job Type *
            </label>
            <select
              value={form.type}
              onChange={(e) => update("type", e.target.value)}
              className="input-field"
            >
              {[
                "full-time",
                "part-time",
                "contract",
                "internship",
                "remote",
              ].map((t) => (
                <option key={t} value={t} className="capitalize">
                  {t.replace("-", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1.5">
            Description *
          </label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={5}
            className="input-field resize-none"
            placeholder="Describe the role, responsibilities, and company…"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1.5">
            Requirements (one per line)
          </label>
          <textarea
            value={form.requirements}
            onChange={(e) => update("requirements", e.target.value)}
            rows={3}
            className="input-field resize-none font-mono text-xs"
            placeholder="3+ years experience&#10;Bachelor's degree in CS&#10;Strong communication skills"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5 mt-1.5">
              Min Salary (GH)
            </label>
            <input
              type="number"
              value={form.salaryMin}
              onChange={(e) => update("salaryMin", e.target.value)}
              className="input-field mb-1.5"
              placeholder="50000"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5 mt-1.5">
              Max Salary (GH)
            </label>
            <input
              type="number"
              value={form.salaryMax}
              onChange={(e) => update("salaryMax", e.target.value)}
              className="input-field mb-1.5"
              placeholder="80000"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">
              Deadline
            </label>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => update("deadline", e.target.value)}
              className="input-field"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary flex-1"
          >
            {submitting ? "Posting…" : "Post Job"}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Filter Panel ──────────────────────────────────────────────
function FilterPanel({
  filters,
  setFilters,
  onClose,
}: {
  filters: Record<string, string>;
  setFilters: (f: Record<string, string>) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState(filters);
  return (
    <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-float border border-gray-100 z-30 p-4 animate-fade-in">
      <p
        className="text-sm font-bold text-gray-900 mb-4"
        style={{ fontFamily: "Sora, sans-serif" }}
      >
        Filter Jobs
      </p>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1.5">
            Job Type
          </label>
          <select
            value={local.type || ""}
            onChange={(e) => setLocal((p) => ({ ...p, type: e.target.value }))}
            className="input-field text-sm"
          >
            <option value="">All Types</option>
            {["full-time", "part-time", "contract", "internship", "remote"].map(
              (t) => (
                <option key={t} value={t} className="capitalize">
                  {t.replace("-", " ")}
                </option>
              ),
            )}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1.5">
            Location
          </label>
          <input
            value={local.location || ""}
            onChange={(e) =>
              setLocal((p) => ({ ...p, location: e.target.value }))
            }
            className="input-field text-sm"
            placeholder="City or Remote"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1.5">
            Experience Level
          </label>
          <select
            value={local.experience || ""}
            onChange={(e) =>
              setLocal((p) => ({ ...p, experience: e.target.value }))
            }
            className="input-field text-sm"
          >
            <option value="">Any Level</option>
            {[
              "Entry Level",
              "Mid Level",
              "Senior Level",
              "Director",
              "Executive",
            ].map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1.5">
            Date Posted
          </label>
          <select
            value={local.datePosted || ""}
            onChange={(e) =>
              setLocal((p) => ({ ...p, datePosted: e.target.value }))
            }
            className="input-field text-sm"
          >
            <option value="">Any Time</option>
            <option value="24h">Last 24 hours</option>
            <option value="week">Past week</option>
            <option value="month">Past month</option>
          </select>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => {
              setFilters(local);
              onClose();
            }}
            className="btn-primary flex-1 text-xs"
          >
            Apply Filters
          </button>
          <button
            onClick={() => {
              setLocal({});
              setFilters({});
              onClose();
            }}
            className="btn-secondary flex-1 text-xs"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Searches Modal ────────────────────────────────────────
function EditSearchesModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [searches, setSearches] = useState([
    {
      id: [],
      label: [],
      location: [],
      count: [],
      notifications: false,
    },
  ]);

  const toggle = (id: string) =>
    setSearches((s) =>
      s.map((x) =>
        x.id === id ? { ...x, notifications: !x.notifications } : x,
      ),
    );
  const remove = (id: string) => {
    setSearches((s) => s.filter((x) => x.id !== id));
    toast.success("Search removed");
  };
  const clearAll = () => {
    setSearches([]);
    toast.success("All searches cleared");
  };

  return (
    <Modal open={open} onClose={onClose} title="My Saved Searches">
      {searches.length > 0 ? (
        <>
          <div className="space-y-2 mb-4">
            {searches.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">
                    {s.label}{" "}
                    {s.count && (
                      <span className="text-brand-blue text-xs">{s.count}</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">{s.location}</p>
                </div>
                <button
                  onClick={() => toggle(s.id)}
                  title={
                    s.notifications
                      ? "Turn off notifications"
                      : "Turn on notifications"
                  }
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    s.notifications
                      ? "text-brand-blue bg-blue-50"
                      : "text-gray-400 hover:bg-gray-200",
                  )}
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill={s.notifications ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 01-3.46 0" />
                  </svg>
                </button>
                <button
                  onClick={() => remove(s.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <polyline points="3,6 5,6 21,6" />
                    <path d="M19 6l-1 14H6L5 6" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={clearAll}
            className="w-full text-xs text-red-400 hover:text-red-600 font-medium py-2 hover:bg-red-50 rounded-lg transition-colors"
          >
            Clear All Searches
          </button>
        </>
      ) : (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-400">No saved searches</p>
        </div>
      )}
    </Modal>
  );
}

// ── Article Reader Modal ───────────────────────────────────────
function ArticleReaderModal({
  article,
  open,
  onClose,
}: {
  article: { title: string; views: string; content: string } | null;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={article?.title || ""} size="lg">
      {article && (
        <>
          <p className="text-xs text-gray-400 mb-4">{`${article.views.length > 0 ? article.views : "No available articles"}`}</p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {article.content}
          </p>
        </>
      )}
    </Modal>
  );
}

// ── Jobs Page ─────────────────────────────────────────────────
export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [postJobOpen, setPostJobOpen] = useState(false);
  const [editSearchesOpen, setEditSearchesOpen] = useState(false);
  const [savedSearches, setSavedSearches] = useState([
    {
      id: [],
      label: [],
      location: [],
      count: [],
      notifications: false,
    },
  ]);
  const [showMoreSearches, setShowMoreSearches] = useState(false);
  const [readArticle, setReadArticle] = useState<{
    title: string;
    views: string;
    content: string;
  } | null>(null);
  const [showMoreArticles, setShowMoreArticles] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  const articles = [
    {
      title: [],
      views: [],
      content: [],
    },
  ];
  const visibleArticles = showMoreArticles ? articles : articles.slice(0, 3);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node))
        setFilterOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async (q?: string) => {
    setLoading(true);
    try {
      const result = await jobsApi.getJobs({ q, ...filters, limit: 20 });
      const jobsArray = Array.isArray(result) ? result : result?.data || [];
      setJobs(jobsArray);
    } catch (err) {
      console.error("Failed to load jobs:", err);
      toast.error("Failed to load jobs");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadJobs(query);
  };
  const handleSaveJob = async (jobId: string) => {
    try {
      await jobsApi.saveJob(jobId);
      toast.success("Job saved!");
    } catch {
      toast.error("Could not save");
    }
  };
  const toggleSearchNotif = (id: string) =>
    setSavedSearches((s) =>
      s.map((x) =>
        x.id === id ? { ...x, notifications: !x.notifications } : x,
      ),
    );

  const forYou = jobs.slice(0, Math.ceil(jobs.length / 2));
  const newJobs = jobs.slice(Math.ceil(jobs.length / 2));

  return (
    <div className="page-container py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main */}
      <div className="lg:col-span-2">
        <div className="card p-5 mb-4">
          <p
            className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3"
            style={{ fontFamily: "Sora, sans-serif" }}
          >
            YOUR DREAM JOB IS HERE
          </p>
          <form onSubmit={handleSearch} className="flex items-center gap-3">
            <div className="flex-1 relative" ref={filterRef}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search jobs, companies, skills…"
                className="input-field pr-10"
              />
              <button
                type="button"
                onClick={() => setFilterOpen(!filterOpen)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-brand-blue transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                  <line x1="11" y1="18" x2="13" y2="18" />
                </svg>
              </button>
              {filterOpen && (
                <FilterPanel
                  filters={filters}
                  setFilters={setFilters}
                  onClose={() => setFilterOpen(false)}
                />
              )}
            </div>
            <button type="submit" className="btn-primary py-2 px-4">
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>
          </form>
          {Object.entries(filters).filter(([_, v]) => v).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {Object.entries(filters)
                .filter(([_, v]) => v)
                .map(([k, v]) => (
                  <span key={k} className="chip-active flex items-center gap-1">
                    {v}
                    <button
                      onClick={() =>
                        setFilters((p) => {
                          const n = { ...p };
                          delete n[k];
                          return n;
                        })
                      }
                      className="ml-0.5 hover:text-primary-700 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {forYou.length > 0 && (
              <>
                <p
                  className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center py-3 mb-1"
                  style={{ fontFamily: "Sora, sans-serif" }}
                >
                  JOBS FOR YOU
                </p>
                {forYou.map((job) => (
                  <div
                    key={job._id}
                    className="card p-4 flex items-start gap-4 mb-3 hover:shadow-card-hover transition-shadow"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {job.companyLogo ? (
                        <img
                          src={job.companyLogo}
                          alt={job.company}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-base font-bold text-gray-400">
                          {job.company[0]}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm">
                        {job.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {job.company} · {job.location}
                      </p>
                      <p className="text-xs text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {job.description}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="btn-primary text-xs px-4 py-2"
                      >
                        MORE
                      </button>
                      <button
                        onClick={() => handleSaveJob(job._id)}
                        className="btn-secondary text-xs px-4 py-2"
                      >
                        SAVE
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
            {newJobs.length > 0 && (
              <>
                <p
                  className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center py-3 mb-1"
                  style={{ fontFamily: "Sora, sans-serif" }}
                >
                  NEW JOBS
                </p>
                {newJobs.map((job) => (
                  <div
                    key={job._id}
                    className="card p-4 flex items-start gap-4 mb-3 hover:shadow-card-hover transition-shadow"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {job.companyLogo ? (
                        <img
                          src={job.companyLogo}
                          alt={job.company}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-base font-bold text-gray-400">
                          {job.company[0]}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm">
                        {job.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {job.company} · {job.location}
                      </p>
                      <p className="text-xs text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {job.description}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="btn-primary text-xs px-4 py-2"
                      >
                        MORE
                      </button>
                      <button
                        onClick={() => handleSaveJob(job._id)}
                        className="btn-secondary text-xs px-4 py-2"
                      >
                        SAVE
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
            {jobs.length === 0 && (
              <div className="card py-16 text-center">
                <p className="text-sm text-gray-400">
                  No jobs found matching your criteria
                </p>
                <button
                  onClick={() => {
                    setQuery("");
                    setFilters({});
                    loadJobs();
                  }}
                  className="btn-secondary text-xs mt-3"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sidebar */}
      <aside className="space-y-4">
        <button
          onClick={() => setPostJobOpen(true)}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
          </svg>
          POST A JOB
        </button>

        {/* Saved Searches */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="section-title">My Searches</p>
            <button
              onClick={() => setEditSearchesOpen(true)}
              className="text-xs font-semibold text-gray-500 hover:text-gray-700 uppercase tracking-wider"
            >
              EDIT LIST
            </button>
          </div>
          <div className="space-y-2">
            {(showMoreSearches ? savedSearches : savedSearches.slice(0, 3)).map(
              (s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800">
                      {s.label}{" "}
                      <span className="text-brand-blue">{s.count}</span>
                    </p>
                    <p className="text-[11px] text-gray-400">{s.location}</p>
                  </div>
                  <button
                    onClick={() => toggleSearchNotif(s.id)}
                    title={
                      s.notifications
                        ? "Disable notifications"
                        : "Enable notifications"
                    }
                    className={cn(
                      "p-1 rounded transition-colors",
                      s.notifications
                        ? "text-brand-blue"
                        : "text-gray-300 hover:text-gray-500",
                    )}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill={s.notifications ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 01-3.46 0" />
                    </svg>
                  </button>
                </div>
              ),
            )}
          </div>
          {!showMoreSearches && savedSearches.length > 3 && (
            <button
              onClick={() => setShowMoreSearches(true)}
              className="w-full text-xs font-semibold text-brand-blue py-2 mt-2 hover:bg-blue-50 rounded-lg transition-colors"
            >
              View More ({savedSearches.length - 3})
            </button>
          )}
        </div>

        {/* Tracked Jobs */}
        {jobs.length > 0 && (
          <div className="card p-4">
            <p className="section-title mb-3">Tracked Jobs</p>
            <div className="space-y-3">
              {jobs.slice(0, 2).map((job) => (
                <button
                  key={job._id}
                  onClick={() => setSelectedJob(job)}
                  className="w-full flex items-center gap-3 hover:bg-gray-50 p-1.5 rounded-lg transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-gray-400">
                      {job.company[0]}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">
                      {job.title}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">
                      {job.company}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            {jobs.length > 2 && (
              <button
                onClick={() => {}}
                className="w-full text-xs font-semibold text-brand-blue mt-3 py-1.5 hover:bg-blue-50 rounded-lg transition-colors"
              >
                View More ({jobs.length - 2})
              </button>
            )}
          </div>
        )}

        {/* Articles */}
        <div className="card p-4">
          <p className="section-title mb-3">Articles For You</p>
          <div className="space-y-3">
            {visibleArticles.map((a, i) => (
              <button
                key={i}
                onClick={() => setReadArticle(a)}
                className="w-full flex items-center gap-3 group text-left"
              >
                <div className="w-12 h-9 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-gray-800 group-hover:text-brand-blue transition-colors leading-tight">
                    {a.title}
                  </p>
                  <p className="text-[11px] text-gray-400">{a.views}</p>
                </div>
              </button>
            ))}
          </div>
          {!showMoreArticles && articles.length > 3 && (
            <button
              onClick={() => setShowMoreArticles(true)}
              className="w-full text-xs font-semibold text-brand-blue mt-3 py-1.5 hover:bg-blue-50 rounded-lg transition-colors"
            >
              VIEW MORE ({articles.length - 3})
            </button>
          )}
        </div>
      </aside>

      <JobDetailModal
        job={selectedJob}
        open={!!selectedJob}
        onClose={() => setSelectedJob(null)}
      />
      <PostJobModal
        open={postJobOpen}
        onClose={() => setPostJobOpen(false)}
        onPosted={(job) => setJobs((prev) => [job, ...prev])}
      />
      <EditSearchesModal
        open={editSearchesOpen}
        onClose={() => setEditSearchesOpen(false)}
      />
      <ArticleReaderModal
        article={readArticle}
        open={!!readArticle}
        onClose={() => setReadArticle(null)}
      />
    </div>
  );
}
