import { AuthScreen } from "@/components/public/auth-screen";
import { simulateAuth } from "../../auth-actions";
import { FixturePublicLayout } from "../../public-layout";
export const dynamic = "force-dynamic";
export const metadata = { title: "ورود آزمایشی" };
export default function LoginPage() { return <FixturePublicLayout><AuthScreen simulate={simulateAuth} /></FixturePublicLayout>; }
