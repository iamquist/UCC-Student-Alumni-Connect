import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Logo */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8">
                <svg viewBox="0 0 32 32" fill="none">
                  <path
                    d="M16 2L4 8v6c0 8 5.5 14.5 12 16 6.5-1.5 12-8 12-16V8L16 2z"
                    stroke="#e8457a"
                    strokeWidth="2"
                    fill="#fff0f5"
                  />
                  <circle cx="8" cy="16" r="3" fill="#ff6b9d" opacity="0.7" />
                  <circle cx="24" cy="16" r="3" fill="#e8457a" opacity="0.7" />
                  <circle cx="16" cy="24" r="3" fill="#c0325e" opacity="0.7" />
                </svg>
              </div>
              <span
                className="font-bold text-sm"
                style={{ fontFamily: "Sora, sans-serif" }}
              >
                <span className="text-gray-900">Uni</span>
                <span className="text-brand-blue">Alum</span>
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Connecting alumni and students for mentorship, networking, and
              career growth.
            </p>
          </div>

          {/* Community */}
          <div>
            <p
              className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3"
              style={{ fontFamily: "Sora, sans-serif" }}
            >
              Community
            </p>
            <ul className="space-y-2">
              {["Community Guidelines", "Privacy & Terms"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Language */}
          <div>
            <p
              className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2"
              style={{ fontFamily: "Sora, sans-serif" }}
            >
              Language
            </p>
            <select className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 bg-white focus:outline-none focus:border-gray-300">
              <option>ENGLISH</option>
              <option>FRANÇAIS</option>
              <option>ESPAÑOL</option>
            </select>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} UCC Student-Alumni Connect All rights
            reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600">
              Privacy Policy
            </a>
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600">
              Terms of Service
            </a>
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
