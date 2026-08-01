"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { submitContactAction } from "@/server/actions/contact.actions";
import { CONTACT_SUBJECTS } from "@/server/validators/contact.schema";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { normalizeKenyaPhone } from "@/lib/phone";

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContactAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const { push } = useToast();
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (state?.success) {
      push("Message sent : we'll get back to you within 4 hours.", "success");
      formRef.current?.reset();
      setPhone("");
    }
  }, [state?.success, push]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Name" name="name" placeholder="Jefferson Kimotho" required />
        <Input label="Email" name="email" type="email" placeholder="you@example.com" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Phone (optional)"
          name="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onBlur={() => setPhone((v) => (v ? normalizeKenyaPhone(v) ?? v : v))}
          prefix="+254"
          placeholder="712 345 678"
        />
        <Select label="Subject" name="subject" defaultValue={CONTACT_SUBJECTS[0]}>
          {CONTACT_SUBJECTS.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </Select>
      </div>
      <Textarea
        label="Message"
        name="message"
        rows={5}
        placeholder="Tell us about your portfolio and what you're looking for…"
        required
      />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" loading={pending} className="mt-2 self-start">
        Send message
      </Button>
    </form>
  );
}
