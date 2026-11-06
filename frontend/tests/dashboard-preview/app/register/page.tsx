import { AuthScreen } from "@/components/public/auth-screen";
import { simulateAuth } from "../../auth-actions";
import { FixturePublicLayout } from "../../public-layout";
export const dynamic = "force-dynamic";
export const metadata = { title: "ثبت‌نام آزمایشی" };
export default function RegisterPage() { return <FixturePublicLayout><AuthScreen registration simulate={simulateAuth} /></FixturePublicLayout>; }
