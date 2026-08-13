"use client";

import { useState, FormEvent } from "react";

const WEBHOOK_URL = process.env.NEXT_PUBLIC_SHEETS_WEBHOOK_URL;

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function EnquiryForm({
  productSlug,
  productName,
}: {
  productSlug: string;
  productName: string;
}) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const message = String(data.get("message") || "").trim();

    if (!name) return setStatus({ kind: "error", message: "Please share your name." });
    if (!email || !validEmail(email))
      return setStatus({ kind: "error", message: "Please share a valid email address." });

    setStatus({ kind: "submitting" });

    const payload = {
      form: "product-enquiry",
      timestamp: new Date().toISOString(),
      productId: productSlug,
      productName,
      name,
      email,
      phone,
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
      console.error("[Indusequine] enquiry submission failed", err);
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
        <p className="eyebrow text-brass-deep">Enquiry Sent</p>
        <h3 className="font-display text-3xl md:text-4xl mt-4 text-forest">
          Thank you.
        </h3>
        <p className="mt-4 text-charcoal leading-relaxed max-w-xl mx-auto">
          We&rsquo;ve passed your enquiry about the {productName} along. We&rsquo;ll
          be in touch with pricing and availability shortly. In the meantime, reach
          us any time at{" "}
          <a href="mailto:hello@indusequine.com" className="text-forest underline underline-offset-4">
            hello@indusequine.com
          </a>
          .
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field id="phone" label="Phone / WhatsApp (optional)" type="tel" />
      </div>

      <div>
        <label htmlFor="message" className="eyebrow text-charcoal mb-2 block">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          defaultValue={`I'm interested in the ${productName}. Please share pricing and availability.`}
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
        {pending ? "Sending…" : "Enquire About This Product"}
      </button>

      <p className="text-xs text-stone leading-relaxed">
        We&rsquo;ll only use this to get back to you about this product. No spam, ever.
      </p>
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
