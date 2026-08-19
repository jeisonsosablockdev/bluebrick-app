import type { ReactElement } from "react";

import { Card } from "@/components/ui/card";

type ModulePlaceholderProps = {
  moduleName: string;
  subtitle: string;
  bullets: string[];
};

export function ModulePlaceholder({ moduleName, subtitle, bullets }: ModulePlaceholderProps): ReactElement {
  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <h2 className="text-lg font-semibold text-white">{moduleName}</h2>
        <p className="text-sm text-white/75">{subtitle}</p>
      </Card>
      <Card className="space-y-2">
        <p className="text-sm font-medium text-white">Contenido del modulo</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-white/70">
          {bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
