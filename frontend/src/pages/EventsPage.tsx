import React, { useState, useEffect } from "react";
import { eventsApi } from "@/services/api";
import type { Event } from "@/types";
import { useAuthStore } from "@/store/authStore";
import Avatar from "@/components/shared/Avatar";
import Modal from "@/components/shared/Modal";
import { formatDate, getUserDisplayName, cn } from "@/utils";
import toast from "react-hot-toast";

// ── Event Detail Modal ─────────────────────────────────────────
function EventDetailModal({
  event,
  open,
  onClose,
  onRegister,
  onCancel,
  userId,
}: {
  event: Event | null;
  open: boolean;
  onClose: () => void;
  onRegister: (id: string) => void;
  onCancel: (id: string) => void;
  userId?: string;
}) {
  const [attendeesOpen, setAttendeesOpen] = useState(false);
  if (!event) return null;
  const isRegistered = userId
    ? event.attendees.some(
        (a) => (typeof a === "string" ? a : a._id) === userId,
      )
    : false;
  const spotsLeft = event.maxAttendees
    ? event.maxAttendees - event.attendees.length
    : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;

  return (
    <>
      <Modal open={open} onClose={onClose} title="Event Details" size="lg">
        <div className="space-y-5">
          {event.image ? (
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-48 object-cover rounded-xl"
            />
          ) : (
            <div className="w-full h-36 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center">
              <svg
                className="w-10 h-10 text-gray-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
          )}

          <div>
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {event.isVirtual && (
                    <span className="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">
                      🖥️ Virtual
                    </span>
                  )}
                  {event.tags?.map((t) => (
                    <span key={t} className="chip text-xs">
                      {t}
                    </span>
                  ))}
                </div>
                <h2
                  className="text-lg font-bold text-gray-900"
                  style={{ fontFamily: "Sora, sans-serif" }}
                >
                  {event.title}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg
                  className="w-4 h-4 text-brand-blue flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>
                  {formatDate(event.startDate, "long")} ·{" "}
                  {formatDate(event.startDate, "time")}
                </span>
              </div>
              {event.location && !event.isVirtual && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg
                    className="w-4 h-4 text-brand-blue flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>{event.location}</span>
                </div>
              )}
            </div>

            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              {event.description}
            </p>

            {/* Attendees */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAttendeesOpen(true)}
                  className="flex -space-x-2"
                >
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`w-7 h-7 rounded-full border-2 border-white ${["bg-blue-400", "bg-blue-400", "bg-green-400", "bg-yellow-400"][i - 1]}`}
                    />
                  ))}
                </button>
                <button
                  onClick={() => setAttendeesOpen(true)}
                  className="text-sm text-gray-500 hover:text-brand-blue transition-colors"
                >
                  <strong>{event.attendees.length}</strong> attending
                </button>
              </div>
              {spotsLeft !== null && (
                <span
                  className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full",
                    isFull
                      ? "bg-red-100 text-red-600"
                      : spotsLeft <= 5
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700",
                  )}
                >
                  {isFull ? "Fully booked" : `${spotsLeft} spots left`}
                </span>
              )}
            </div>

            {event.organizer && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl mb-4">
                <Avatar user={event.organizer} size="sm" />
                <div>
                  <p className="text-xs font-semibold text-gray-800">
                    Organized by
                  </p>
                  <p className="text-sm text-gray-700">
                    {getUserDisplayName(event.organizer)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {!isRegistered ? (
              <button
                onClick={() => {
                  onRegister(event._id);
                  onClose();
                }}
                disabled={isFull}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFull ? "Event Full" : "Register Now"}
              </button>
            ) : (
              <button
                onClick={() => {
                  onCancel(event._id);
                  onClose();
                }}
                className="btn-secondary flex-1 text-red-500 border-red-200 hover:bg-red-50"
              >
                Cancel Registration
              </button>
            )}
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/events?id=${event._id}`,
                );
                toast.success("Link copied!");
              }}
              className="btn-secondary px-4"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
          </div>
        </div>
      </Modal>

      {/* Attendees modal */}
      <Modal
        open={attendeesOpen}
        onClose={() => setAttendeesOpen(false)}
        title={`Attendees (${event.attendees.length})`}
        size="sm"
      >
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {event.attendees.slice(0, 20).map((a, i) => {
            const attendee = typeof a === "string" ? null : a;
            return (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
                {attendee ? (
                  <Avatar user={attendee} size="sm" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200" />
                )}
                <p className="text-sm font-medium text-gray-800">
                  {attendee
                    ? getUserDisplayName(attendee)
                    : `Attendee ${i + 1}`}
                </p>
              </div>
            );
          })}
          {event.attendees.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-4">
              No attendees yet. Be the first!
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}

// ── Create Event Modal ─────────────────────────────────────────
function CreateEventModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (e: Event) => void;
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    startDate: "",
    startTime: "",
    location: "",
    isVirtual: false,
    maxAttendees: "",
    meetingLink: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const update = (k: string, v: string | boolean) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.startDate) {
      toast.error("Fill all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const startDate = new Date(
        `${form.startDate}T${form.startTime || "09:00"}`,
      ).toISOString();
      const event = await eventsApi.createEvent({
        title: form.title,
        description: form.description,
        startDate,
        location: form.isVirtual ? form.meetingLink || "Online" : form.location,
        isVirtual: form.isVirtual,
        ...(form.maxAttendees ? { maxAttendees: +form.maxAttendees } : {}),
      });
      onCreated(event);
      toast.success("Event created!");
      onClose();
    } catch {
      toast.error("Failed to create event");
    }
    setSubmitting(false);
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Event" size="lg">
      <div className="space-y-[0.1rem]">
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1.5">
            Event Title *
          </label>
          <input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className="input-field"
            placeholder="e.g. Tech for Africa Summit 2024"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1.5">
            Description *
          </label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={4}
            className="input-field resize-none"
            placeholder="Describe your event…"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">
              Date *
            </label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => update("startDate", e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">
              Time
            </label>
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => update("startTime", e.target.value)}
              className="input-field"
            />
          </div>
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            className={cn(
              "w-10 h-5 rounded-full transition-colors mt-1.5",
              form.isVirtual ? "bg-brand-blue" : "bg-gray-200",
            )}
            onClick={() => update("isVirtual", !form.isVirtual)}
          >
            <div
              className={cn(
                "w-4 h-4 bg-white rounded-full shadow-sm transition-transform m-0.5",
                form.isVirtual ? "translate-x-5" : "translate-x-0",
              )}
            />
          </div>
          <span className="mt-1.5 text-sm font-medium text-gray-700">
            This is a virtual event
          </span>
        </label>
        {form.isVirtual ? (
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">
              Meeting Link
            </label>
            <input
              value={form.meetingLink}
              onChange={(e) => update("meetingLink", e.target.value)}
              className="input-field"
              placeholder="https://zoom.us/j/…"
            />
          </div>
        ) : (
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">
              Location
            </label>
            <input
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              className="input-field"
              placeholder="Venue, City, Country"
            />
          </div>
        )}
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1.5">
            Max Attendees (optional)
          </label>
          <input
            type="number"
            value={form.maxAttendees}
            onChange={(e) => update("maxAttendees", e.target.value)}
            className="input-field mb-1.5"
            placeholder="e.g. 100"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary flex-1"
          >
            {submitting ? "Creating…" : "Create Event"}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Events Page ────────────────────────────────────────────────
export default function EventsPage() {
  const { user } = useAuthStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<
    "all" | "virtual" | "in-person" | "registered"
  >("all");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const result = await eventsApi.getEvents({ limit: 20 });
      const eventsArray = Array.isArray(result) ? result : result?.data || [];
      setEvents(eventsArray);
    } catch (err) {
      console.error("Failed to load events:", err);
      toast.error("Failed to load events");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (eventId: string) => {
    try {
      await eventsApi.registerForEvent(eventId);
      setEvents((p) =>
        p.map((e) =>
          e._id === eventId
            ? {
                ...e,
                attendees: [...e.attendees, user?._id || ""] as string[] &
                  typeof e.attendees,
              }
            : e,
        ),
      );
      toast.success("Registered successfully!");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Could not register");
    }
  };

  const handleCancel = async (eventId: string) => {
    try {
      await eventsApi.cancelRegistration(eventId);
      setEvents((p) =>
        p.map((e) =>
          e._id === eventId
            ? {
                ...e,
                attendees: (e.attendees as string[]).filter(
                  (a) => a !== user?._id,
                ) as typeof e.attendees,
              }
            : e,
        ),
      );
      toast.success("Registration cancelled");
    } catch {
      toast.error("Could not cancel");
    }
  };

  const filtered = events.filter((e) => {
    const matchQuery =
      !query ||
      e.title.toLowerCase().includes(query.toLowerCase()) ||
      e.description?.toLowerCase().includes(query.toLowerCase());
    const matchFilter =
      filter === "all"
        ? true
        : filter === "virtual"
          ? e.isVirtual
          : filter === "in-person"
            ? !e.isVirtual
            : filter === "registered"
              ? (e.attendees as string[]).includes(user?._id || "")
              : true;
    return matchQuery && matchFilter;
  });

  return (
    <div className="page-container py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1
            className="text-base font-bold text-gray-900 uppercase tracking-widest"
            style={{ fontFamily: "Sora, sans-serif" }}
          >
            EVENTS
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Discover and join events in your network
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create Event
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events…"
            className="input-field pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "virtual", "in-person", "registered"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "text-xs font-bold px-3 py-2 rounded-lg capitalize whitespace-nowrap transition-colors",
                filter === f
                  ? "bg-brand-blue text-white"
                  : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300",
              )}
              style={{ fontFamily: "Sora, sans-serif" }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton h-64 rounded-xl" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((event) => {
            const isRegistered = user
              ? (event.attendees as string[]).includes(user._id)
              : false;
            const spotsLeft = event.maxAttendees
              ? event.maxAttendees - event.attendees.length
              : null;
            const isFull = spotsLeft !== null && spotsLeft <= 0;

            return (
              <div
                key={event._id}
                className="card overflow-hidden hover:shadow-card-hover transition-shadow"
              >
                <div className="relative">
                  {event.image ? (
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-40 object-cover cursor-pointer"
                      onClick={() => setSelectedEvent(event)}
                    />
                  ) : (
                    <div
                      className="w-full h-32 bg-gradient-to-br from-gray-700 to-gray-900 cursor-pointer flex items-center justify-center"
                      onClick={() => setSelectedEvent(event)}
                    >
                      <svg
                        className="w-8 h-8 text-gray-500"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                  )}
                  {event.isVirtual && (
                    <span className="absolute top-2 left-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      Virtual
                    </span>
                  )}
                  {isRegistered && (
                    <span className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Registered ✓
                    </span>
                  )}
                </div>

                <div className="p-4">
                  {event.tags && event.tags.length > 0 && (
                    <div className="flex gap-1.5 mb-2">
                      {event.tags.slice(0, 2).map((t) => (
                        <span key={t} className="chip text-[10px]">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedEvent(event)}
                    className="font-bold text-gray-900 text-sm leading-tight hover:text-brand-blue transition-colors text-left w-full"
                  >
                    {event.title}
                  </button>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {formatDate(event.startDate, "medium")} ·{" "}
                    {formatDate(event.startDate, "time")}
                  </p>
                  {event.location && !event.isVirtual && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <svg
                        className="w-3 h-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {event.location}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-1.5">
                      <div className="flex -space-x-1.5">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="w-5 h-5 rounded-full bg-gray-200 border-2 border-white"
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">
                        {event.attendees.length} attending
                      </span>
                    </div>
                    {spotsLeft !== null && (
                      <span
                        className={cn(
                          "text-[10px] font-bold",
                          isFull
                            ? "text-red-500"
                            : spotsLeft <= 5
                              ? "text-yellow-600"
                              : "text-green-600",
                        )}
                      >
                        {isFull ? "Full" : `${spotsLeft} spots`}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() =>
                      isRegistered
                        ? handleCancel(event._id)
                        : handleRegister(event._id)
                    }
                    disabled={!isRegistered && isFull}
                    className={cn(
                      "w-full mt-3 py-2 text-xs font-bold rounded-lg transition-all uppercase tracking-wide disabled:opacity-50",
                      isRegistered
                        ? "bg-gray-100 text-red-500 hover:bg-red-50"
                        : "bg-brand-blue text-white hover:bg-primary-700",
                    )}
                    style={{ fontFamily: "Sora, sans-serif" }}
                  >
                    {isFull && !isRegistered
                      ? "FULLY BOOKED"
                      : isRegistered
                        ? "CANCEL REGISTRATION"
                        : "REGISTER NOW"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card py-16 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-6 h-6 text-gray-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <p className="text-sm text-gray-400 mb-3">No events found</p>
          <button
            onClick={() => {
              setQuery("");
              setFilter("all");
            }}
            className="btn-secondary text-xs"
          >
            Clear Filters
          </button>
        </div>
      )}

      <EventDetailModal
        event={selectedEvent}
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onRegister={handleRegister}
        onCancel={handleCancel}
        userId={user?._id}
      />
      <CreateEventModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(event) => setEvents((p) => [event, ...p])}
      />
    </div>
  );
}
