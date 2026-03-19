import React from 'react';
import { Search, ChevronRight, X } from 'lucide-react';
import { Avatar } from './Avatar';
import { users, jobs, trendingArticles } from '../../data/mockData';

interface SearchModalProps {
  query: string;
  onQueryChange: (q: string) => void;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ query, onQueryChange, onClose }) => {
  const filteredUsers = Object.values(users).filter(
    u => u.name.toLowerCase().includes(query.toLowerCase()) ||
         u.title.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 2);

  const filteredJobs = jobs.filter(
    j => j.title.toLowerCase().includes(query.toLowerCase()) ||
         j.company.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 2);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-16 left-1/2 -translate-x-1/2 w-full max-w-md z-50 animate-slide-down">
        <div className="bg-white rounded-2xl shadow-modal mx-4 overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
            <input
              type="text"
              value={query}
              onChange={e => onQueryChange(e.target.value)}
              className="flex-1 text-sm text-accent outline-none placeholder-gray-400"
              placeholder="Search..."
              autoFocus
            />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-accent text-white hover:bg-gray-800 transition-colors"
            >
              <Search size={14} />
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {/* Jobs section */}
            {filteredJobs.length > 0 && (
              <div className="py-2">
                <p className="px-4 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider">Jobs</p>
                {filteredJobs.map(job => (
                  <button
                    key={job.id}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                      <img src={job.companyLogo} alt={job.company} className="w-6 h-6 object-contain"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-accent">{job.title}</p>
                      <p className="text-xs text-gray-400">{job.company}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 shrink-0" />
                  </button>
                ))}
                <button className="w-full px-4 py-2 text-xs font-semibold text-gray-500 hover:text-accent text-left transition-colors">
                  ALL JOBS (84)
                </button>
              </div>
            )}

            {/* Divider */}
            <div className="h-px bg-border mx-4" />

            {/* Users section */}
            {filteredUsers.length > 0 && (
              <div className="py-2">
                <p className="px-4 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider">Users</p>
                {filteredUsers.map(user => (
                  <button
                    key={user.id}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <Avatar src={user.avatar} alt={user.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-accent">{user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.title}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 shrink-0" />
                  </button>
                ))}
                <button className="w-full px-4 py-2 text-xs font-semibold text-gray-500 hover:text-accent text-left transition-colors">
                  ALL USERS (1,530)
                </button>
              </div>
            )}

            {/* Divider */}
            <div className="h-px bg-border mx-4" />

            {/* Articles section */}
            <div className="py-2">
              <p className="px-4 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider">Articles</p>
              {trendingArticles.slice(0, 1).map(article => (
                <button
                  key={article.id}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <img src={article.image} alt={article.title} className="w-14 h-10 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-accent leading-snug">{article.title}</p>
                    <p className="text-xs text-gray-400">{article.views.toLocaleString()} viewers</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 shrink-0" />
                </button>
              ))}
              <button className="w-full px-4 py-2 text-xs font-semibold text-gray-500 hover:text-accent text-left transition-colors">
                ALL ARTICLES (30)
              </button>
            </div>

            {/* All results */}
            <div className="p-3 pt-0">
              <button className="w-full bg-primary text-white text-sm font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors">
                ALL RESULTS (2,000+)
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
