import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { AgentRequestPayload, RegistrationProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LeadCaptureModalProps {
  open: boolean;
  registration: RegistrationProfile;
  loading: boolean;
  successMessage: string;
  onClose: () => void;
  onSubmit: (payload: Pick<AgentRequestPayload, "contact_name" | "contact_email" | "contact_phone" | "notes">) => Promise<void>;
}

export default function LeadCaptureModal({
  open,
  registration,
  loading,
  successMessage,
  onClose,
  onSubmit,
}: LeadCaptureModalProps) {
  const [contactName, setContactName] = useState(registration.contactName);
  const [contactEmail, setContactEmail] = useState(registration.contactEmail);
  const [contactPhone, setContactPhone] = useState(registration.contactPhone);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }
    setContactName(registration.contactName);
    setContactEmail(registration.contactEmail);
    setContactPhone(registration.contactPhone);
    setNotes("");
  }, [open, registration]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-2xl border-0 shadow-soft">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Funding Support</p>
              <CardTitle className="mt-2 text-2xl">Speak with a funding specialist</CardTitle>
            </div>
            <button
              type="button"
              aria-label="Close lead capture"
              className="rounded-full border p-2 text-muted-foreground transition-colors hover:text-foreground"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm leading-6 text-muted-foreground">
            Share the best contact details and anything important about timing, structure, or the type of funding you
            would like to discuss.
          </p>

          {successMessage ? (
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200">
              {successMessage}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lead_contact_name">Contact Name</Label>
              <Input id="lead_contact_name" value={contactName} onChange={(event) => setContactName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead_contact_email">Contact Email</Label>
              <Input
                id="lead_contact_email"
                type="email"
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="lead_contact_phone">Contact Phone</Label>
              <Input
                id="lead_contact_phone"
                value={contactPhone}
                onChange={(event) => setContactPhone(event.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="lead_notes">What should our team know?</Label>
              <textarea
                id="lead_notes"
                className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Tell us anything helpful about timing, urgency, structure, or the kind of support you want."
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              onClick={() =>
                void onSubmit({
                  contact_name: contactName,
                  contact_email: contactEmail,
                  contact_phone: contactPhone,
                  notes,
                })
              }
              disabled={loading}
            >
              {loading ? "Submitting..." : "Request Follow-Up"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
