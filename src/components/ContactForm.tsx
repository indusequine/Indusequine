"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitContact, type FormState } from "@/app/actions";

const kinds = [
  { value: "brand", label: "I represent a brand" },
  { value: "service-provider", label: "I'm a coach / vet / farrier / trainer" },
  { value: "stable", label: "I run a stable or riding school" },
  { value: "press", label: "Press / partnerships" },
  { value: "other", label: "Something else" },
];

export function ContactForm() {
  const [state, formAction] = useActionState<FormState, FormData>(submitContact, null);

  if (state?.ok) {
    return (
      <div className="border border-forest/20 bg-cream p-10 md:p-14 text-center">
        <p className="eyebrow text-brass-deep">
          <span className="rule"></span>Message Received
        </p>
        <h3 className="font-display text-3xl md:text-4xl mt-4 text-forest">
          Thank you.
        </h3>
        <p className="mt-4 text-charcoal leading-relaxed max-w-xl mx-auto">
          {state.message}
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

      {state?.message && !state.ok && (
        <p className="text-oxblood text-sm">{state.message}</p>
      )}

      <SubmitButton />
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

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center px-8 py-4 bg-forest text-cream-soft hover:bg-forest-deep transition-colors text-sm tracking-[0.15em] uppercase disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "Sending…" : "Send Message"}
    </button>
  );
}
