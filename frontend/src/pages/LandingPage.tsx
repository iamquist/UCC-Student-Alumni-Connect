import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import Footer from "@/components/layout/Footer";
import { Eye, EyeOff, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

// ── Animated Counter ──────────────────────────────────────────
function AnimatedCounter({
  target,
  suffix = "",
  duration = 2000,
}: {
  target: number;
  suffix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const steps = 60;
        const increment = target / steps;
        let current = 0;
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            setCount(target);
            clearInterval(timer);
          } else setCount(Math.floor(current));
        }, duration / steps);
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// ── Typed Text ────────────────────────────────────────────────
function TypedText({ phrases }: { phrases: string[] }) {
  const [phrase, setPhrase] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const target = phrases[phrase];
    const timeout = setTimeout(
      () => {
        if (!deleting) {
          if (text.length < target.length) {
            setText(target.slice(0, text.length + 1));
          } else {
            setTimeout(() => setDeleting(true), 1800);
          }
        } else {
          if (text.length > 0) {
            setText(text.slice(0, -1));
          } else {
            setDeleting(false);
            setPhrase((p) => (p + 1) % phrases.length);
          }
        }
      },
      deleting ? 40 : 80,
    );
    return () => clearTimeout(timeout);
  }, [text, deleting, phrase, phrases]);

  return (
    <span className="text-brand-blue">
      {text}
      <span className="animate-pulse">|</span>
    </span>
  );
}

// ── Feature Card ──────────────────────────────────────────────
function FeatureCard({
  icon,
  title,
  desc,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border border-gray-100">
      <div
        className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4`}
      >
        {icon}
      </div>
      <h3
        className="font-bold text-gray-900 mb-2"
        style={{ fontFamily: "Sora, sans-serif" }}
      >
        {title}
      </h3>
      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

// ── Testimonial Card ──────────────────────────────────────────
function TestimonialCard({
  quote,
  name,
  role,
  color,
}: {
  quote: string;
  name: string;
  role: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <svg
            key={i}
            className="w-4 h-4 text-yellow-400 fill-current"
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
      <p className="text-sm text-gray-600 leading-relaxed mb-4 italic">
        "{quote}"
      </p>
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white text-sm font-bold`}
        >
          {name[0]}
        </div>
        <div>
          <p
            className="text-sm font-semibold text-gray-900"
            style={{ fontFamily: "Sora, sans-serif" }}
          >
            {name}
          </p>
          <p className="text-xs text-gray-400">{role}</p>
        </div>
      </div>
    </div>
  );
}

// ── Landing Page ──────────────────────────────────────────────
export default function LandingPage() {
  const [authModal, setAuthModal] = useState<"login" | "register" | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate("/feed");
  }, [isAuthenticated]);

  const stats = [
    { value: 12500, suffix: "+", label: "Students Connected" },
    { value: 3800, suffix: "+", label: "Alumni Mentors" },
    { value: 940, suffix: "+", label: "Job Listings" },
    { value: 250, suffix: "+", label: "Universities" },
  ];

  const features = [
    {
      icon: (
        <svg
          className="w-6 h-6 text-blue-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      ),
      title: "Build Your Network",
      desc: "Connect with thousands of alumni and students from leading universities worldwide.",
      color: "bg-blue-50",
    },
    {
      icon: (
        <svg
          className="w-6 h-6 text-purple-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      ),
      title: "Get Mentored",
      desc: "Find experienced alumni mentors who have walked your path and can guide your career journey.",
      color: "bg-purple-50",
    },
    {
      icon: (
        <svg
          className="w-6 h-6 text-green-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
        </svg>
      ),
      title: "Find Opportunities",
      desc: "Access exclusive job listings, internships, and career opportunities posted by alumni.",
      color: "bg-green-50",
    },
    {
      icon: (
        <svg
          className="w-6 h-6 text-orange-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      ),
      title: "Real-Time Messaging",
      desc: "Chat instantly with your network. Share files, reply to messages, and stay connected.",
      color: "bg-orange-50",
    },
    {
      icon: (
        <svg
          className="w-6 h-6 text-blue-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="16" y1="2" x2="16" y2="6" />
        </svg>
      ),
      title: "Events & Webinars",
      desc: "Attend virtual and in-person events, workshops, and networking sessions.",
      color: "bg-blue-50",
    },
    {
      icon: (
        <svg
          className="w-6 h-6 text-teal-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
        </svg>
      ),
      title: "Track Your Growth",
      desc: "Monitor your profile views, connection requests, and career progress with detailed analytics.",
      color: "bg-teal-50",
    },
  ];

  const testimonials = [
    {
      quote:
        "Student-Alumni Connect helped me land my first remote job. The mentorship I received from alumni was invaluable — they gave me real insights I couldn't find anywhere else.",
      name: "Enoch Hodo",
      role: "Junior Frontend Dev. Remote, Class of 2025",
      color: "bg-blue-500",
    },
    {
      quote:
        "As an alumni mentor, I love giving back. The platform makes it so easy to connect with students who are genuinely motivated. It's incredibly rewarding.",
      name: "Precious Gbewodoh Xoese",
      role: "Product Manager, Remote",
      color: "bg-purple-500",
    },
    {
      quote:
        "I found three internship opportunities through Student-Alumni Connect in my first semester. The job board is fantastic and the alumni network is super active!",
      name: "Linda Larbi",
      role: "Intern at theBlackTech, Inc",
      color: "bg-green-500",
    },
  ];

  const howItWorks = [
    {
      step: "01",
      title: "Create Your Profile",
      desc: "Sign up as a student or alumni and complete your profile with your education, skills, and goals.",
    },
    {
      step: "02",
      title: "Connect & Network",
      desc: "Find and connect with alumni in your field. Send connection requests and start meaningful conversations.",
    },
    {
      step: "03",
      title: "Request Mentorship",
      desc: "Choose a mentor whose career path aligns with your goals and request a mentorship session.",
    },
    {
      step: "04",
      title: "Grow Your Career",
      desc: "Apply for jobs, attend events, and leverage your network to accelerate your professional growth.",
    },
  ];

  return (
    <div
      className="min-h-screen bg-white"
      style={{ fontFamily: "DM Sans, sans-serif" }}
    >
      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 32 32" fill="none" className="w-9 h-9">
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
            <span
              className="text-xl font-bold"
              style={{ fontFamily: "Sora, sans-serif" }}
            >
              <span className="text-gray-900">Student-Alumni</span>
              <span className="text-brand-blue">Connect</span>
            </span>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="hidden sm:block btn-secondary text-sm py-2"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/register")}
              className="btn-primary text-sm py-2"
            >
              Get Started
            </button>
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg
                className="w-5 h-5 text-gray-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
            <button
              onClick={() => {
                navigate("/login");
                setMobileMenuOpen(false);
              }}
              className="w-full btn-secondary text-sm py-2"
            >
              Sign In
            </button>
          </div>
        )}
      </nav>

      {/* ── Hero Section ── */}
      <section
        className="pt-28 pb-20 px-4"
        style={{
          background:
            "linear-gradient(135deg, #f0f3ff 0%, #ffffff 40%, #f0f4ff 100%)",
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div
                className="inline-flex items-center gap-2 bg-blue-100 text-brand-blue text-xs font-bold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wider"
                style={{ fontFamily: "Sora, sans-serif" }}
              >
                <span className="w-2 h-2 bg-brand-blue rounded-full animate-pulse" />
                Real Time & Active Members
              </div>

              <h1
                className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6"
                style={{ fontFamily: "Sora, sans-serif" }}
              >
                Where Alumni
                <br />
                <TypedText
                  phrases={[
                    "Mentor Students.",
                    "Share Wisdom.",
                    "Build Futures.",
                    "Create Opportunities.",
                  ]}
                />
              </h1>

              <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-lg">
                Student-Alumni Connect bridges the gap between students and
                alumni — creating a powerful network for mentorship, career
                growth, and lifelong professional relationships.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate("/register")}
                  className="btn-primary px-8 py-4 text-base rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                >
                  Join For Free
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="btn-secondary px-8 py-4 text-base rounded-xl flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M14 12H3" />
                  </svg>
                  Sign In
                </button>
              </div>

              {/* Trust indicators */}
              <div className="flex items-center gap-4 mt-8">
                <div className="flex -space-x-2">
                  {[
                    "bg-blue-100",
                    "bg-blue-200",
                    "bg-blue-300",
                    "bg-blue-400",
                    "bg-blue-500",
                  ].map((c, i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 ${c} rounded-full border-2 border-white`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-800">active</span>{" "}
                  alumni ready to mentor you
                </p>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative hidden lg:block">
              <div className="relative w-full h-96">
                {/* Main card */}
                <div className="absolute top-0 right-0 w-80 bg-white rounded-2xl shadow-float p-5 border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                      BM
                    </div>
                    <div>
                      <p
                        className="font-bold text-gray-900 text-sm"
                        style={{ fontFamily: "Sora, sans-serif" }}
                      >
                        Bat Man
                      </p>
                      <p className="text-xs text-gray-400">
                        FullStack Dev. Remote
                      </p>
                    </div>
                    <div className="ml-auto w-2 h-2 bg-green-400 rounded-full" />
                  </div>
                  <div className="bg-gray-900 rounded-xl p-3 mb-3">
                    <p className="text-white text-xs leading-relaxed">
                      "Happy to mentor CS students! Let's talk about system
                      design and career growth." 🚀
                    </p>
                    <p className="text-gray-400 text-[10px] mt-1">4:30 PM ✓✓</p>
                  </div>
                  <button
                    className="w-full bg-brand-blue text-white text-xs font-bold py-2 rounded-lg"
                    style={{ fontFamily: "Sora, sans-serif" }}
                  >
                    REQUEST MENTORSHIP
                  </button>
                </div>

                {/* Job card */}
                <div className="absolute bottom-4 left-0 w-64 bg-white rounded-2xl shadow-float p-4 border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold text-sm">
                      gp
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-xs">
                        Product Designer
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Ghana · Cape-Coast
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Full-time
                    </span>
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Remote OK
                    </span>
                  </div>
                </div>

                {/* Stats floating card */}
                <div className="absolute top-28 left-4 bg-white rounded-xl shadow-float p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-brand-blue"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                    <span className="text-xs font-bold text-gray-900">
                      Trending This Week
                    </span>
                  </div>
                  <p
                    className="text-2xl font-bold text-gray-900"
                    style={{ fontFamily: "Sora, sans-serif" }}
                  >
                    247
                  </p>
                  <p className="text-xs text-gray-400">New connections made</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      {/* <section className="bg-gray-900 py-12 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <p
                className="text-4xl font-bold text-white mb-1"
                style={{ fontFamily: "Sora, sans-serif" }}
              >
                <AnimatedCounter target={s.value} suffix={s.suffix} />
              </p>
              <p className="text-sm text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section> */}

      {/* ── Features ── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p
              className="text-xs font-bold text-brand-blue uppercase tracking-widest mb-3"
              style={{ fontFamily: "Sora, sans-serif" }}
            >
              Platform Features
            </p>
            <h2
              className="text-4xl font-bold text-gray-900 mb-4"
              style={{ fontFamily: "Sora, sans-serif" }}
            >
              Everything You Need to Grow
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              From real-time chat to career tools, Student-Alumni Connect gives
              you a complete platform for professional development.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <FeatureCard key={i} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p
              className="text-xs font-bold text-brand-blue uppercase tracking-widest mb-3"
              style={{ fontFamily: "Sora, sans-serif" }}
            >
              How It Works
            </p>
            <h2
              className="text-4xl font-bold text-gray-900"
              style={{ fontFamily: "Sora, sans-serif" }}
            >
              Start in 4 Simple Steps
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, i) => (
              <div key={i} className="text-center relative">
                {i < 3 && (
                  <div className="hidden lg:block absolute top-8 left-1/2 w-full h-px bg-gray-200 z-0" />
                )}
                <div className="relative z-10 w-16 h-16 bg-brand-blue rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-200">
                  <span
                    className="text-white font-bold text-lg"
                    style={{ fontFamily: "Sora, sans-serif" }}
                  >
                    {step.step}
                  </span>
                </div>
                <h3
                  className="font-bold text-gray-900 mb-2 text-sm"
                  style={{ fontFamily: "Sora, sans-serif" }}
                >
                  {step.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p
              className="text-xs font-bold text-brand-blue uppercase tracking-widest mb-3"
              style={{ fontFamily: "Sora, sans-serif" }}
            >
              Testimonials
            </p>
            <h2
              className="text-4xl font-bold text-gray-900"
              style={{ fontFamily: "Sora, sans-serif" }}
            >
              What Our Community Says
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <TestimonialCard key={i} {...t} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <Footer />
    </div>
  );
}
