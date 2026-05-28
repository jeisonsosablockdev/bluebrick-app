"use client";

import type { ReactElement } from "react";
import { motion } from "motion/react";

import { useI18n } from "@/components/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { getAuthLinkStatusContent, type AuthLinkStatus } from "@/lib/auth-link-status";
import { createPanelMotionVariants } from "@/lib/motion";

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
    <motion.div
      variants={createPanelMotionVariants()}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <Card className={content.tone === "success" ? "border-cyan-300/25 bg-cyan-400/10 text-cyan-100" : "border-amber-300/25 bg-amber-400/10 text-amber-100"}>
        {content.message}
      </Card>
    </motion.div>
  );
}
