import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, Plus, Users } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/sign-out-button";
import brandIcon from "@/app/icon.png";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/patients/new", label: "Add patient", icon: Plus },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-card/80 p-5 backdrop-blur-xl md:block">
        <Link href="/dashboard" className="mb-10 flex items-center gap-3 font-bold">
          <span className="grid size-10 place-items-center overflow-hidden rounded-2xl border bg-white p-1 shadow-sm"><Image src={brandIcon} alt="" className="size-full object-contain" /></span>
          OrthoRegistry
        </Link>
        <nav className="space-y-2">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-foreground/5 hover:text-foreground">
              <Icon className="size-4" />{label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between"><SignOutButton /><ThemeToggle /></div>
      </aside>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-xl md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold"><span className="grid size-9 place-items-center overflow-hidden rounded-xl border bg-white p-1"><Image src={brandIcon} alt="" className="size-full object-contain" /></span>OrthoRegistry</Link>
        <ThemeToggle />
      </header>
      <main className="mx-auto max-w-7xl p-4 pb-24 md:ml-64 md:p-8">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t bg-card/95 px-2 py-2 backdrop-blur-xl md:hidden">
        {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex min-w-20 flex-col items-center gap-1 rounded-xl py-1 text-xs text-muted"><Icon className="size-5" />{label}</Link>)}
      </nav>
    </div>
  );
}
