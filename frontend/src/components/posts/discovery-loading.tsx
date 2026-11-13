import { FeedLoading } from "./feed-loading";
import { messages } from "@/i18n/messages/fa";

export function DiscoveryLoading() {
  return (
    <div className="space-y-6">
      <p role="status">{messages.discovery.loading}</p>
      <FeedLoading />
    </div>
  );
}
