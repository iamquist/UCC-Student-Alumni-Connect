import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { debounce, getUserDisplayName } from "@/utils";
import { searchApi } from "@/services/api";
import type { SearchResults } from "@/types";
import Avatar from "@/components/shared/Avatar";

interface SearchDropdownProps {
  onClose: () => void;
}

export default function SearchDropdown({ onClose }: SearchDropdownProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const doSearch = debounce(async (q: string) => {
    if (!q.trim() || q.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await searchApi.search(q);
      setResults(data);
    } catch {
      setResults(null);
    }
    setLoading(false);
  }, 300);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    doSearch(e.target.value);
  };

  const goTo = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Dropdown */}
      <div className="fixed left-1/2 -translate-x-1/2 top-16 w-[560px] max-w-[95vw] bg-white rounded-2xl shadow-float border border-gray-100 z-50 overflow-hidden animate-fade-in">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <svg
            className="w-5 h-5 text-gray-400 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={handleChange}
            placeholder="Search jobs, people, articles…"
            className="flex-1 text-sm text-gray-900 placeholder-gray-400 bg-transparent outline-none"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-brand-blue border-t-transparent rounded-full animate-spin flex-shrink-0" />
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xs font-medium"
          >
            ESC
          </button>
        </div>

        {/* Results */}
        {results && (
          <div className="max-h-[480px] overflow-y-auto">
            {/* Jobs */}
            {results.jobs.length > 0 && (
              <div className="py-3">
                <p className="section-title px-4 pb-2">Jobs</p>
                {results.jobs.slice(0, 3).map((job) => (
                  <button
                    key={job._id}
                    onClick={() => goTo(`/jobs?id=${job._id}`)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0 overflow-hidden">
                      {job.companyLogo ? (
                        <img
                          src={job.companyLogo}
                          alt={job.company}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold">
                          {job.company[0]}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {job.title}
                      </p>
                      <p className="text-xs text-gray-400">{job.company}</p>
                    </div>
                    <svg
                      className="w-4 h-4 text-gray-300 ml-auto"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                ))}
                <button
                  onClick={() => goTo(`/jobs?q=${encodeURIComponent(query)}`)}
                  className="w-full px-4 py-2 text-xs font-medium text-brand-blue hover:bg-blue-50 transition-colors text-left"
                >
                  ALL JOBS ({results.total})
                </button>
              </div>
            )}

            {/* Divider */}
            {results.jobs.length > 0 && results.users.length > 0 && (
              <hr className="border-gray-100" />
            )}

            {/* Users */}
            {results.users.length > 0 && (
              <div className="py-3">
                <p className="section-title px-4 pb-2">People</p>
                {results.users.slice(0, 3).map((user) => (
                  <button
                    key={user._id}
                    onClick={() => goTo(`/profile/${user._id}`)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <Avatar user={user} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {getUserDisplayName(user)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {user.bio?.slice(0, 40) || user.role}
                      </p>
                    </div>
                    <svg
                      className="w-4 h-4 text-gray-300 ml-auto"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                ))}
                <button
                  onClick={() =>
                    goTo(`/network?q=${encodeURIComponent(query)}`)
                  }
                  className="w-full px-4 py-2 text-xs font-medium text-brand-blue hover:bg-blue-50 transition-colors text-left"
                >
                  ALL USERS ({results.users.length}+)
                </button>
              </div>
            )}

            {/* Divider */}
            {results.users.length > 0 && results.posts.length > 0 && (
              <hr className="border-gray-100" />
            )}

            {/* Articles/Posts */}
            {results.posts.length > 0 && (
              <div className="py-3">
                <p className="section-title px-4 pb-2">Articles</p>
                {results.posts.slice(0, 2).map((post) => (
                  <button
                    key={post._id}
                    onClick={() => goTo(`/feed?post=${post._id}`)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-12 h-9 rounded-lg bg-gradient-to-br from-blue-100 to-rose-100 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {post.content.slice(0, 60)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {post.likes.length} likes
                      </p>
                    </div>
                    <svg
                      className="w-4 h-4 text-gray-300 flex-shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                ))}
                <button
                  onClick={() => goTo(`/feed?q=${encodeURIComponent(query)}`)}
                  className="w-full px-4 py-2 text-xs font-medium text-brand-blue hover:bg-blue-50 transition-colors text-left"
                >
                  ALL ARTICLES ({results.posts.length})
                </button>
              </div>
            )}

            {/* All results button */}
            <div className="border-t border-gray-100">
              <button
                onClick={() => goTo(`/search?q=${encodeURIComponent(query)}`)}
                className="w-full py-3 text-sm font-semibold text-white bg-brand-blue hover:bg-primary-700 transition-colors"
                style={{ fontFamily: "Sora, sans-serif" }}
              >
                ALL RESULTS ({results.total}+)
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {query.length >= 2 && !loading && !results && (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-400">
              No results for "<strong>{query}</strong>"
            </p>
          </div>
        )}

        {/* Initial state */}
        {!query && (
          <div className="py-6 px-4">
            <p className="text-xs text-gray-400 font-medium mb-3">
              Quick links
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "UX design",
                "Software engineer",
                "Alumni network",
                "Mentorship",
              ].map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setQuery(tag);
                    doSearch(tag);
                  }}
                  className="chip hover:chip-active cursor-pointer transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
