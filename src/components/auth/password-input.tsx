"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";

export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      {...props}
      type={visible ? "text" : "password"}
      icon="lock"
      endAdornment={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="text-ink-muted hover:text-ink"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          <Icon name={visible ? "visibilityOff" : "visibility"} size={20} />
        </button>
      }
    />
  );
}
