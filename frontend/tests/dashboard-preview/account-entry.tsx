"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { logoutFixture } from "./auth-actions";

export function FixtureLogoutButton() {
  const router = useRouter();
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  return <>
    <Button size="lg" variant="outline" disabled={pending} onClick={async () => {
      if (busy.current) return;
      busy.current = true; setPending(true); setError(false);
      try { if (await logoutFixture()) { router.push("/"); router.refresh(); } else setError(true); }
      finally { busy.current = false; setPending(false); }
    }}>{pending ? "در حال خروج…" : "خروج"}</Button>
    {error && <p role="alert" className="mt-2 text-sm leading-5">خروج انجام نشد. دوباره تلاش کنید.</p>}
  </>;
}

export function FixtureAccountEntry({ role }: { role: "USER" | "AUTHOR" | "ADMIN" }) {
  return <>
    <Link href="/dashboard" className="inline-flex min-h-12 items-center rounded-control px-4 underline focus-visible:outline-2 focus-visible:outline-ring">حساب آزمایشی · {({ USER: "کاربر", AUTHOR: "نویسنده", ADMIN: "مدیر" })[role]}</Link>
    <FixtureLogoutButton />
  </>;
}
