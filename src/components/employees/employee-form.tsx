"use client";

import { useActionState, useEffect } from "react";
import { createEmployeeAction } from "@/server/actions/employee.actions";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type PropertyOption = { id: string; name: string; town: string };

export function EmployeeForm({ properties }: { properties: PropertyOption[] }) {
  const { push } = useToast();
  const [state, formAction, pending] = useActionState(createEmployeeAction, undefined);

  useEffect(() => {
    if (state?.success) {
      push("Employee account created.", "success");
    }
  }, [state?.success, push]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input label="Full name" name="fullName" placeholder="Jane Wanjiku" required />
      <Input label="Email address" icon="email" name="email" type="email" placeholder="name@example.com" required />
      <Input label="Phone" name="phone" prefix="+254" placeholder="712345678" />
      <Select name="roleType" label="Role" required>
        <option value="CARETAKER">Caretaker</option>
        <option value="MANAGER">Manager</option>
        <option value="FINANCE">Finance</option>
        <option value="CUSTOMER_CARE">Customer care</option>
        <option value="OWNER_MANAGER">Owner manager</option>
      </Select>
      <PasswordInput label="Temporary password" name="password" placeholder="At least 8 characters" required />
      <Select
        name="propertyIds"
        label="Assigned buildings"
        multiple
        className="min-h-32 py-2"
        hint="Hold Ctrl to choose more than one building."
      >
        {properties.map((property) => (
          <option key={property.id} value={property.id}>
            {property.name} - {property.town}
          </option>
        ))}
      </Select>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" loading={pending} className="mt-2 w-full">
        Add employee
      </Button>
    </form>
  );
}
