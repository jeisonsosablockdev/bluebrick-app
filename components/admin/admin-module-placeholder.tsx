import type { ReactElement } from "react";

import { Card } from "@/components/ui/card";

type AdminModulePlaceholderProps = {
  title: string;
  subtitle: string;
  highlights: string[];
};

export function AdminModulePlaceholder({ title, subtitle, highlights }: AdminModulePlaceholderProps): ReactElement {
  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="text-sm text-white/75">{subtitle}</p>
      </Card>
      <Card className="space-y-2">
        <p className="text-sm font-medium text-white">Contenido inicial del modulo</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-white/70">
          {highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
