import { requireUser } from "@/lib/auth-helpers";
import { getActiveVehicle } from "@/lib/app-context";
import { AppNav } from "@/components/app/AppNav";
import { VehicleSwitcher } from "@/components/app/VehicleSwitcher";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const { active, vehicles } = await getActiveVehicle(user.id);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-hairline md:block">
        <AppNav />
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-hairline bg-ink/85 px-5 py-3 backdrop-blur">
          <div className="md:hidden">
            <span className="text-sm font-medium text-chalk">GloveBox</span>
          </div>
          <div className="ml-auto">
            <VehicleSwitcher
              vehicles={vehicles.map((v) => ({ id: v.id, year: v.year, make: v.make, model: v.model, nickname: v.nickname }))}
              activeId={active?.id ?? null}
            />
          </div>
        </header>
        <main className="flex-1 px-5 py-8 md:px-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
