import type { ReactElement, ReactNode } from "react";

import { Card } from "@/components/ui/card";

type AdminModulePlaceholderProps = {
  title: string;
  subtitle: string;
  highlights: string[];
  listTitle: string;
  metaBadges?: string[];
  children?: ReactNode;
};

export function AdminModulePlaceholder({
  title,
  subtitle,
  highlights,
  listTitle,
  metaBadges,
  children
}: AdminModulePlaceholderProps): ReactElement {
  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="text-sm text-white/75">{subtitle}</p>
        {metaBadges && metaBadges.length > 0 ? (
          <div className="flex flex-wrap gap-2 text-xs text-white/70">
            {metaBadges.map((badge) => (
              <span key={badge} className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
                {badge}
              </span>
            ))}
          </div>
        ) : null}
      </Card>
      <Card className="space-y-2">
        <p className="text-sm font-medium text-white">{listTitle}</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-white/70">
          {highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>
      {children}
    </div>
  );
}
