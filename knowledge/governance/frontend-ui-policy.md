---
type: Policy
title: Frontend Ui Policy
description: Frontend Ui Policy - migrated from knowledge/
tags: [governance]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/governance/frontend-ui-policy.md
---

📱 FRONTEND UI POLICY

(MANDATORY – NON-NEGOTIABLE)

⸻

📱 RESPONSIVE DESIGN POLICY (MANDATORY — DESKTOP + MOBILE)

All frontend work must be responsive and usable on both mobile and desktop.

Requirements:
	1.	Mobile-first layout with progressive enhancement for larger screens.
	2.	Must work at 320px width minimum (small phones).
	3.	No horizontal overflow (no sideways scrolling).
	4.	Use Tailwind responsive utilities: sm, md, lg, xl.
	5.	Touch targets must be accessible: >= 44px height for primary actions.
	6.	Modals must be usable on mobile:
	•	Full width on small screens
	•	Internal scroll if content exceeds viewport height
	•	Close button visible at all times
	7.	Test these viewport widths before marking complete:
	•	320px
	•	375px
	•	768px
	•	1024px
	8.	Provide a short “Responsive QA checklist” result in the PR description.

If UI breaks at any of the widths above → task incomplete.

⸻

🎞️ MOTION LANGUAGE POLICY (MANDATORY)

For motion-driven UX/UI work:
	1.	Use Motion 12 (`motion.dev`) as the preferred motion system.
	2.	Use the current `motion` syntax only.
	•	Do not reintroduce legacy `framer-motion` imports, examples, or patterns.
	3.	Use motion to communicate refresh, navigation, expansion, activation, theme shift, login, loading progression, and property opening.
	4.	Preserve current Core Web Vitals, especially on landing and other public entry surfaces.
	5.	Respect `prefers-reduced-motion`.
	6.	When a SPEC needs AI-assisted UI/tooling guidance, follow the OpenAI Developers docs-first workflow before implementation closes.

If motion makes the interface feel heavier or slower instead of clearer or more directional → task incomplete.

⸻

🟢 RESPONSIVE QA MACRO

Trigger

Run @responsive-qa

Mandatory Checklist
	1.	Validate layout at 320px, 375px, 768px, 1024px.
	2.	Confirm no horizontal overflow at all tested widths.
	3.	Confirm primary actions have touch target height >= 44px.
	4.	Confirm modals are mobile-safe:
	•	Full width on small screens
	•	Internal scroll for long content
	•	Close button always visible
	5.	Attach short “Responsive QA checklist” result in PR description.

Strict Rule
If any viewport fails or checklist is missing in PR → task incomplete.
