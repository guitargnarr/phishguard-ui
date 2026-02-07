"use client";

import { useState } from "react";
import {
  Search,
  Globe,
  Phone,
  Mail,
  Loader2,
  AlertTriangle,
  Zap,
} from "lucide-react";

interface MessageInputProps {
  onSubmit: (params: {
    domains: string[];
    phones: string[];
    emails: string[];
    enrich: boolean;
    rawMessage?: string;
  }) => void;
  loading?: boolean;
}

type InputMode = "message" | "artifacts";

export default function MessageInput({ onSubmit, loading }: MessageInputProps) {
  const [mode, setMode] = useState<InputMode>("message");
  const [message, setMessage] = useState("");
  const [domains, setDomains] = useState("");
  const [phones, setPhones] = useState("");
  const [emails, setEmails] = useState("");
  const [enrich, setEnrich] = useState(true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (mode === "message") {
      // Extract artifacts from message text on the client side
      // Backend will do proper extraction, but we need domains/phones/emails for the graph endpoint
      const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
      const domainRegex = /(?:^|\s)([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.(?:[a-zA-Z]{2,}))/g;
      const phoneRegex = /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g;
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

      const urls = message.match(urlRegex) || [];
      const extractedDomains = [
        ...new Set([
          ...urls.map((u) => {
            try {
              return new URL(u).hostname;
            } catch {
              return "";
            }
          }).filter(Boolean),
          ...(message.match(domainRegex) || []).map((d) => d.trim()),
        ]),
      ];

      const extractedPhones = (message.match(phoneRegex) || []).map((p) =>
        p.replace(/[^+\d]/g, "")
      );
      const extractedEmails = message.match(emailRegex) || [];

      if (
        extractedDomains.length === 0 &&
        extractedPhones.length === 0 &&
        extractedEmails.length === 0
      ) {
        return;
      }

      onSubmit({
        domains: extractedDomains,
        phones: extractedPhones,
        emails: extractedEmails,
        enrich,
        rawMessage: message,
      });
    } else {
      const domainList = domains
        .split(/[,\n]/)
        .map((d) => d.trim())
        .filter(Boolean);
      const phoneList = phones
        .split(/[,\n]/)
        .map((p) => p.trim())
        .filter(Boolean);
      const emailList = emails
        .split(/[,\n]/)
        .map((e) => e.trim())
        .filter(Boolean);

      if (
        domainList.length === 0 &&
        phoneList.length === 0 &&
        emailList.length === 0
      )
        return;

      onSubmit({
        domains: domainList,
        phones: phoneList,
        emails: emailList,
        enrich,
      });
    }
  }

  const sampleMessage = `URGENT: Your AT&T account has been suspended.
Verify your identity at https://att-secure-verify.xyz/login
or call 1-888-555-0142 immediately.
Reply to support@att-verify-secure.com`;

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs uppercase tracking-[0.15em] text-[#8a8580] font-medium">
          Investigate
        </h2>
        <div className="flex rounded-lg border border-[#2a2a2a] overflow-hidden">
          <button
            type="button"
            onClick={() => setMode("message")}
            className={`px-3 py-1 text-[10px] uppercase tracking-wider transition-colors ${
              mode === "message"
                ? "bg-[#14b8a6]/15 text-[#14b8a6]"
                : "text-[#4a4540] hover:text-[#8a8580]"
            }`}
          >
            Message
          </button>
          <button
            type="button"
            onClick={() => setMode("artifacts")}
            className={`px-3 py-1 text-[10px] uppercase tracking-wider transition-colors ${
              mode === "artifacts"
                ? "bg-[#14b8a6]/15 text-[#14b8a6]"
                : "text-[#4a4540] hover:text-[#8a8580]"
            }`}
          >
            Direct
          </button>
        </div>
      </div>

      {mode === "message" ? (
        <div className="flex-1 flex flex-col gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Paste a suspicious message, SMS, or email..."
            className="flex-1 min-h-[120px] resize-none bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-3 text-sm text-[#f5f0eb] placeholder:text-[#4a4540] focus:border-[#14b8a6]/50 focus:outline-none font-mono"
          />
          <button
            type="button"
            onClick={() => setMessage(sampleMessage)}
            className="self-start flex items-center gap-1.5 px-2 py-1 text-[10px] text-[#4a4540] hover:text-[#8a8580] transition-colors"
          >
            <AlertTriangle className="w-3 h-3" />
            Load sample scam
          </button>
        </div>
      ) : (
        <div className="flex-1 space-y-2">
          <div>
            <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-[#4a4540] mb-1">
              <Globe className="w-3 h-3" />
              Domains
            </label>
            <input
              value={domains}
              onChange={(e) => setDomains(e.target.value)}
              placeholder="example.com, test.xyz"
              className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-3 py-2 text-xs text-[#f5f0eb] placeholder:text-[#4a4540] focus:border-[#14b8a6]/50 focus:outline-none font-mono"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-[#4a4540] mb-1">
              <Phone className="w-3 h-3" />
              Phone Numbers
            </label>
            <input
              value={phones}
              onChange={(e) => setPhones(e.target.value)}
              placeholder="+1-888-555-0142"
              className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-3 py-2 text-xs text-[#f5f0eb] placeholder:text-[#4a4540] focus:border-[#14b8a6]/50 focus:outline-none font-mono"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-[#4a4540] mb-1">
              <Mail className="w-3 h-3" />
              Email Addresses
            </label>
            <input
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="suspicious@example.com"
              className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-3 py-2 text-xs text-[#f5f0eb] placeholder:text-[#4a4540] focus:border-[#14b8a6]/50 focus:outline-none font-mono"
            />
          </div>
        </div>
      )}

      {/* Enrich toggle */}
      <label className="flex items-center gap-2 cursor-pointer group">
        <div
          className={`w-8 h-4 rounded-full transition-colors relative ${
            enrich ? "bg-[#14b8a6]" : "bg-[#2a2a2a]"
          }`}
          onClick={() => setEnrich(!enrich)}
        >
          <div
            className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
              enrich ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </div>
        <span className="text-[10px] text-[#8a8580] group-hover:text-[#f5f0eb] transition-colors">
          Deep enrichment (DNS + WHOIS + SSL)
        </span>
      </label>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#14b8a6] text-white text-sm font-medium hover:bg-[#0d9488] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Building graph...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            Map Infrastructure
          </>
        )}
      </button>
    </form>
  );
}
