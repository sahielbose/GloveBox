import { Eyebrow } from "@/components/ui";
import { OnboardingForm } from "./OnboardingForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Add your car" };

export default function OnboardingPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Eyebrow>Add your car</Eyebrow>
      <h1 className="display-l mt-3 text-chalk">Let&apos;s find your car.</h1>
      <p className="lead mt-3 max-w-xl text-ash">
        Enter your VIN, or just the year, make, and model. We&apos;ll decode it, you confirm, add
        your mileage — about thirty seconds.
      </p>

      <div className="mt-10">
        <OnboardingForm />
      </div>
    </div>
  );
}
