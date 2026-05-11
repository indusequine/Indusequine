"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitWaitlist, type FormState } from "@/app/actions";

const roles = [
  { value: "rider", label: "I ride" },
  { value: "stable", label: "I own / run a stable" },
  { value: "service-provider", label: "I'm a service provider" },
  { value: "brand", label: "I represent a brand" },
  { value: "other", label: "Something else" },
];

export function WaitlistForm() {
  const [state, formAction] = useActionState<FormState, FormData>(submitWaitlist, null);

  if (state?.ok) {
    return (
      <div className="border border-forest/20 bg-cream p-10 md:p-14 text-center">
        <p className="eyebrow text-brass-deep">
          <span className="rule"></span>You&rsquo;re On The List
        </p>
        <h3 className="font-display text-3xl md:text-4xl mt-4 text-forest">
          Thank you.
        </h3>
        <p className="mt-4 text-charcoal leading-relaxed max-w-xl mx-auto">
          {state.message} In the meantime, follow our journey on Instagram or
          drop us a note at{" "}
          <a href="mailto:hello@indusequine.com" className="text-forest underline underline-offset-4">
            hello@indusequine.com
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field id="name" label="Your name" required />
        <Field id="email" label="Email" type="email" required />
      </div>

      <fieldset>
        <legend className="eyebrow text-charcoal mb-3">How will you ride with us?</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {roles.map((r) => (
            <label
              key={r.value}
              className="flex items-center gap-3 px-4 py-3 border border-forest/15 bg-cream-soft hover:border-forest/40 cursor-pointer transition-colors has-[input:checked]:border-forest has-[input:checked]:bg-forest/5"
            >
              <input
                type="radio"
                name="role"
                value={r.value}
                required
                className="accent-forest"
              />
              <span className="text-sm text-ink">{r.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field id="city" label="City (optional)" />
        <Field id="phone" label="Phone / WhatsApp (optional)" type="tel" />
      </div>

      {state?.message && !state.ok && (
        <p className="text-oxblood text-sm">{state.message}</p>
      )}

      <SubmitButton label="Join the Waitlist" />

      <p className="text-xs text-stone leading-relaxed">
        We&rsquo;ll only contact you about Indusequine&rsquo;s launch and an
        occasional, considered note. No spam, ever.
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

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center px-8 py-4 bg-forest text-cream-soft hover:bg-forest-deep transition-colors text-sm tracking-[0.15em] uppercase disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "Submitting…" : label}
    </button>
  );
}
