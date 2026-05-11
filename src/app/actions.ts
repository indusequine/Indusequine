"use server";

export type FormState = {
  ok: boolean;
  message: string;
} | null;

const WEBHOOK_URL = process.env.SHEETS_WEBHOOK_URL;

async function postToSheet(payload: Record<string, string>): Promise<void> {
  if (!WEBHOOK_URL) {
    console.warn(
      "[Indusequine] SHEETS_WEBHOOK_URL not set — submission logged locally only.\n" +
        "Payload:",
      payload,
    );
    return;
  }

  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Sheets webhook returned ${res.status}`);
  }
}

function clean(raw: FormDataEntryValue | null, maxLen = 500): string {
  if (typeof raw !== "string") return "";
  return raw.trim().slice(0, maxLen);
}

function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function submitWaitlist(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = clean(formData.get("name"), 100);
  const email = clean(formData.get("email"), 200);
  const role = clean(formData.get("role"), 50);
  const city = clean(formData.get("city"), 100);
  const phone = clean(formData.get("phone"), 30);

  if (!name) return { ok: false, message: "Please share your name." };
  if (!email || !validEmail(email))
    return { ok: false, message: "Please share a valid email address." };
  if (!role)
    return { ok: false, message: "Please tell us how you ride with us." };

  try {
    await postToSheet({
      form: "waitlist",
      timestamp: new Date().toISOString(),
      name,
      email,
      role,
      city,
      phone,
    });
    return {
      ok: true,
      message:
        "You're on the list. We'll be in touch as soon as we open the gates.",
    };
  } catch (err) {
    console.error("[Indusequine] waitlist submission failed", err);
    return {
      ok: false,
      message:
        "Something went wrong on our side. Please try again, or email hello@indusequine.com.",
    };
  }
}

export async function submitContact(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = clean(formData.get("name"), 100);
  const email = clean(formData.get("email"), 200);
  const organisation = clean(formData.get("organisation"), 150);
  const kind = clean(formData.get("kind"), 50);
  const message = clean(formData.get("message"), 2000);

  if (!name) return { ok: false, message: "Please share your name." };
  if (!email || !validEmail(email))
    return { ok: false, message: "Please share a valid email address." };
  if (!message || message.length < 10)
    return { ok: false, message: "Please share a bit more in your message." };

  try {
    await postToSheet({
      form: "contact",
      timestamp: new Date().toISOString(),
      name,
      email,
      organisation,
      kind,
      message,
    });
    return {
      ok: true,
      message: "Thank you — we've received your note and will reply soon.",
    };
  } catch (err) {
    console.error("[Indusequine] contact submission failed", err);
    return {
      ok: false,
      message:
        "Something went wrong on our side. Please try again, or email hello@indusequine.com.",
    };
  }
}
