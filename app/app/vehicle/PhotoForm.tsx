"use client";
import { useActionState } from "react";
import { ImagePlus } from "lucide-react";
import { setVehiclePhotoAction, type FormResult } from "./actions";

/** Set the car's profile photo — auto-submits when an image is chosen. */
export function PhotoForm({
  vehicleId,
  photoUrl,
  label,
}: {
  vehicleId: string;
  photoUrl: string | null;
  label: string;
}) {
  const [state, action] = useActionState<FormResult, FormData>(setVehiclePhotoAction, { ok: false });

  return (
    <div className="rounded-card border border-hairline bg-surface p-5">
      <h2 className="mb-4 text-base font-medium text-chalk">Photo</h2>
      <div className="flex items-center gap-5">
        <div className="size-24 shrink-0 overflow-hidden rounded-card border border-hairline bg-ink/40">
          {photoUrl ? (
            // authed dynamic endpoint — plain img (next/image can't carry the session)
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt={`Photo of ${label}`} className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-ash">
              <ImagePlus size={22} aria-hidden />
            </div>
          )}
        </div>
        <form action={action} className="space-y-2">
          <input type="hidden" name="vehicleId" value={vehicleId} />
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-btn border border-hairline px-3 py-2 text-sm text-ash transition-colors hover:border-chalk/30 hover:text-chalk focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-sage">
            <ImagePlus size={15} aria-hidden /> {photoUrl ? "Change photo" : "Add a photo"}
            <input
              type="file"
              name="photo"
              accept="image/*"
              className="sr-only"
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
            />
          </label>
          {state?.message && (
            <p className={`text-xs ${state.ok ? "text-ok" : "text-alert"}`}>{state.message}</p>
          )}
        </form>
      </div>
    </div>
  );
}
