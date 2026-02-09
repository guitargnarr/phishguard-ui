"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { BarChart3, Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/rank", label: "Rank" },
  { href: "/compare", label: "Compare" },
];

export default function Nav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1a1a1a] bg-[#050505]/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#14b8a6]" />
          <span className="text-sm font-semibold text-[#f5f0eb] tracking-tight">
            Meridian
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden sm:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-xs uppercase tracking-[0.08em] transition-colors ${
                pathname === link.href || pathname?.startsWith(link.href + "/")
                  ? "text-[#14b8a6]"
                  : "text-[#8a8580] hover:text-[#f5f0eb]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden p-2 text-[#8a8580]"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`sm:hidden overflow-hidden transition-all duration-300 ease-in-out border-t border-[#1a1a1a] bg-[#050505]/95 backdrop-blur-md ${
          mobileOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0 border-t-0"
        }`}
      >
        <div className="px-6 py-3 space-y-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block text-sm transition-colors ${
                pathname === link.href || pathname?.startsWith(link.href + "/")
                  ? "text-[#14b8a6]"
                  : "text-[#8a8580] hover:text-[#f5f0eb]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
