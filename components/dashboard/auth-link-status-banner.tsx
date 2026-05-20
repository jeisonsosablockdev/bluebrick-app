"use client";

import type { ReactElement } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { getAuthLinkStatusContent, type AuthLinkStatus } from "@/lib/auth-link-status";

type AuthLinkStatusBannerProps = {
  status: AuthLinkStatus | null;
};

export function AuthLinkStatusBanner({ status }: AuthLinkStatusBannerProps): ReactElement | null {
  const { t } = useI18n();
  const content = getAuthLinkStatusContent(status, t);
  if (!content) {
    return null;
  }

  return (
    <Card className={content.tone === "success" ? "border-cyan-300/25 bg-cyan-400/10 text-cyan-100" : "border-amber-300/25 bg-amber-400/10 text-amber-100"}>
      {content.message}
    </Card>
  );
}
