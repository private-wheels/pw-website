import { MinimalChrome } from "@/components/minimal-chrome";

/** The /list funnel: logo and essentials only, no site navigation. */
export default function ListLayout({ children }: { children: React.ReactNode }) {
  return <MinimalChrome homeHref="/list">{children}</MinimalChrome>;
}
