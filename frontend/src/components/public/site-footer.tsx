import Image from "next/image";
import { messages } from "@/i18n/messages/fa";

// Explicit configuration only; malformed or unsafe URLs never become links.
function socialUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

export function SiteFooter() {
  // Official white marks from the GitHub, LinkedIn and Twitter brand download kits.
  const social = [
    { name: messages.public.socialGithub, src: "/social/github.svg", href: socialUrl(process.env.SOCIAL_GITHUB_URL) },
    { name: messages.public.socialLinkedin, src: "/social/linkedin.png", href: socialUrl(process.env.SOCIAL_LINKEDIN_URL) },
    { name: messages.public.socialTwitter, src: "/social/twitter.svg", href: socialUrl(process.env.SOCIAL_TWITTER_URL) },
  ];
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6">
        <p className="font-semibold">{messages.metadata.title}</p>
        <p className="max-w-xl text-sm">{messages.public.footerDescription}</p>
        <ul aria-label={messages.public.socialLinks} className="flex items-center gap-2">
          {social.map(({ name, src, href }) => {
            const icon = <Image src={src} alt="" width={24} height={24} className="social-brand-icon size-6 object-contain" />;
            return <li key={src}>{href ? (
              <a href={href} aria-label={name} target="_blank" rel="noopener noreferrer" className="inline-flex size-12 items-center justify-center rounded-control focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">{icon}</a>
            ) : (
              <span aria-hidden="true" className="inline-flex size-12 items-center justify-center">{icon}</span>
            )}</li>;
          })}
        </ul>
      </div>
    </footer>
  );
}
