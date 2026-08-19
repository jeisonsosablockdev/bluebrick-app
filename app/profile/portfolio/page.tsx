import type { Metadata } from "next";
import { getInvestorPortfolioQuery, PortfolioPageClient, PortfolioModule } from "@/features/investor-portfolio";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "My Portfolio",
  description: "Review your property fractions, current valuation, and yield performance.",
  path: "/profile/portfolio",
  section: "profile"
});

export default async function ProfilePortfolioPage() {
  const { holdings, analytics } = await getInvestorPortfolioQuery('SQDS426qUB5hZahVkWgwySsLqyZaKnpBxZBP5tWYW45');

  return (
    <div className="space-y-6">
      <PortfolioPageClient holdings={holdings} analytics={analytics} />
      <PortfolioModule />
    </div>
  );
}
