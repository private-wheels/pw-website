import { MinimalChrome } from "@/components/minimal-chrome";
import { ListAccountLink } from "@/components/list-account-link";

/** The /list funnel: logo, a sign-in / "My listings" link, and no site navigation. */
export default function ListLayout({ children }: { children: React.ReactNode }) {
  return (
    <MinimalChrome homeHref="/list" actions={<ListAccountLink />}>
      {children}
    </MinimalChrome>
  );
}
