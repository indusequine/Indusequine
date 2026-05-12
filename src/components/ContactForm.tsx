"use client";

import { useState, FormEvent } from "react";

const kinds = [
  { value: "brand", label: "I represent a brand" },
  { value: "service-provider", label: "I'm a coach / vet / farrier / trainer" },
  { value: "stable", label: "I run a stable or riding school" },
  { value: "press", label: "Press / partnerships" },
  { value: "other", label: "Something else" },
];

const WEBHOOK_URL = process.env.NEXT_PUBLIC_SHEETS_WEBHOOK_URL;

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function ContactForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const organisation = String(data.get("organisation") || "").trim();
    const kind = String(data.get("kind") || "").trim();
    const message = String(data.get("message") || "").trim();

    if (!name) return setStatus({ kind: "error", message: "Please share your name." });
    if (!email || !validEmail(email))
      return setStatus({ kind: "error", message: "Please share a valid email address." });
    if (!message || message.length < 10)
      return setStatus({ kind: "error", message: "Please share a bit more in your message." });

    setStatus({ kind: "submitting" });

    const payload = {
      form: "contact",
      timestamp: new Date().toISOString(),
      name,
      email,
      organisation,
      kind,
      message,
    };

    if (!WEBHOOK_URL) {
      console.warn("[Indusequine] NEXT_PUBLIC_SHEETS_WEBHOOK_URL not set", payload);
      setStatus({ kind: "success" });
      return;
    }

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        redirect: "follow",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json().catch(() => ({ ok: true }));
      if (json.ok === false) throw new Error(json.error || "Unknown error");
      setStatus({ kind: "success" });
    } catch (err) {
      console.error("[Indusequine] contact submission failed", err);
      setStatus({
        kind: "error",
        message:
          "Something went wrong on our side. Please try again, or email hello@indusequine.com.",
      });
    }
  }

  if (status.kind === "success") {
    return (
      <div className="border border-forest/20 bg-cream p-10 md:p-14 text-center">
        <p className="eyebrow text-brass-deep">
          <span className="rule"></span>Message Received
        </p>
        <h3 className="font-display text-3xl md:text-4xl mt-4 text-forest">
          Thank you.
        </h3>
        <p className="mt-4 text-charcoal leading-relaxed max-w-xl mx-auto">
          Thank you — we&rsquo;ve received your note and will reply soon.
        </p>
      </div>
    );
  }

  const pending = status.kind === "submitting";

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field id="name" label="Your name" required />
        <Field id="email" label="Email" type="email" required />
      </div>

      <Field id="organisation" label="Organisation / brand (optional)" />

      <fieldset>
        <legend className="eyebrow text-charcoal mb-3">What brings you here?</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {kinds.map((k) => (
            <label
              key={k.value}
              className="flex items-center gap-3 px-4 py-3 border border-forest/15 bg-cream-soft hover:border-forest/40 cursor-pointer transition-colors has-[input:checked]:border-forest has-[input:checked]:bg-forest/5"
            >
              <input
                type="radio"
                name="kind"
                value={k.value}
                required
                className="accent-forest"
              />
              <span className="text-sm text-ink">{k.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="message" className="eyebrow text-charcoal mb-2 block">
          Your message <span className="text-oxblood ml-0.5">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          minLength={10}
          maxLength={2000}
          className="w-full px-4 py-3 bg-cream-soft border border-forest/15 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest/30 transition-colors text-ink resize-y"
        />
      </div>

      {status.kind === "error" && (
        <p className="text-oxblood text-sm">{status.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center px-8 py-4 bg-forest text-cream-soft hover:bg-forest-deep transition-colors text-sm tracking-[0.15em] uppercase disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  type = "text",
  required = false,
}: {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="eyebrow text-charcoal mb-2 block">
        {label} {required && <span className="text-oxblood ml-0.5">*</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        autoComplete={type === "email" ? "email" : "off"}
        className="w-full px-4 py-3 bg-cream-soft border border-forest/15 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest/30 transition-colors text-ink"
      />
    </div>
  );
}
