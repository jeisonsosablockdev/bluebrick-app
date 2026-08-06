import type { Metadata } from "next";
import { getUserProfileQuery, ProfilePageTemplate } from "@/features/profile";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Investor Profile",
  description: "Manage your investor account settings, KYC status, and security preferences.",
  path: "/profile",
  section: "profile"
});

export default async function ProfilePage() {
  const profile = await getUserProfileQuery('SQDS426qUB5hZahVkWgwySsLqyZaKnpBxZBP5tWYW45');
  return <ProfilePageTemplate profile={profile} />;
}
