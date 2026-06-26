# Reasoning Cycle (S07)

## Trigger
- RFC creation o actualización para features complejos
- Feature planning que requiere arquitectura descubierta
- Debugging profundo con síntomas contradictorios
- Security threat modeling con múltiples stakeholders
- Algorithm design con procedimientos step-by-step
- Architecture Decision Records (ADRs) con trade-offs explícitos
- Task-init con `--reasoning-agent` flag explícito

## Participants
- `reasoning` (primary owner)
- `planner` (coordination)
- `docs` (artifact generation)
- `security` (quando threat modeling applies)
- `solana`, `frontend`, `nft` (domain adaptation output)
- `reviewer` (human-in-the-loop approval)

## Required Policies
- `docs-policy`
- `security-policy`
- `documentation-policy.md`
- `security-quality-policy.md`

## Execution Sequence
| Step | Owner | Goal | Gate |
| --- | --- | --- | --- |
| 1 | `planner` | Detect complex task requiring structured reasoning and activate this workflow | Task complexity threshold met (multi-slice, security-critical, architecture-new) |
| 2 | `reasoning` | **SELECT**: Identify problem type, goal, facts, constraints from task description | Problem classification explicit, domain adaptation strategy defined |
| 3 | `reasoning` | **ADAPT**: Rephrase 16 canonical modules for domain (solana/nft/compliance/security/architecture/debugging) | Domain-specific modules documented with concrete examples |
| 4 | `reasoning` | **IMPLEMENT**: Generate reasoning trace with step-by-step modules, counterexamples, consistency checks | Full trace stored as `reasoning-plan` knowledge entry with frontmatter compatible |
| 5 | `reasoning` | **SOLVE**: Produce final answer (RFC, feature spec, ADR, algorithm, threat model) | Answer includes Mermaid diagrams, decision tables, Linear slice plan when applicable |
| 6 | `docs` | Generate feature/fix artifact pair from reasoning output with proper frontmatter | Artifact follows canonical structure, RFC traceability explicit |
| 7 | `reviewer` | Human-in-the-loop review: approve / request changes / iterate | Human approval recorded, max iterations unlimited until trace sound |
| 8 | `reasoning` | If requested changes: re-reason with feedback, update trace, regenerate answer | Iteration log captured, consistency with previous trace documented |
| 9 | `planner` | Activate downstream workflows (blockchain-cycle, frontend-cycle, etc.) using reasoning output as governing artifact | Handoff inputs validated, domain context preserved |

## Required Evidence
- Full reasoning trace (SELECT/ADAPT/IMPLEMENT/SOLVE stages)
- Domain adaptation module list with examples
- Final answer (RFC, spec, ADR, algorithm, threat model)
- Mermaid diagrams, decision tables, Linear slice plans
- Human review decision (approve/request changes)
- Iteration log if re-reasoning occurred
- Knowledge system entry ID for reasoning-plan
- Updated artifact paths (feature/fix docs)

## Handoffs
- `planner -> reasoning`: task description, domain hints, Linear issue key, output mode preference
- `reasoning -> docs`: generated spec structure, frontmatter requirements, RFC metadata
- `reasoning -> reviewer`: full trace + answer for human approval
- `reasoning -> planner/specialists`: domain context, invariants, acceptance criteria, handoff inputs

## Blocking Gates
- RFC/feature spec no avanza a implementación sin human approval del reasoning trace
- Multi-slice work no inicia delivery slices sin el spec/documentation slice generado por reasoning
- Security threat modeling no se considera completo sin counterexample analysis explícito
- Architecture decisions no se comprometen sin trade-off table documentada

## Output Artifacts
- `knowledge/features/feature-<slug>.md` (business logic spec)
- `knowledge/features/feature-<slug>-implementation.md` (delivery plan with slices)
- `knowledge/rfc/rfc-<slug>.md` (when RFC required)
- `knowledge/adr/adr-<slug>.md` (architecture decisions)
- `knowledge/reasoning-plan-<timestamp>.md` (reasoning traces)
- Linear issue updates with slice breakdown

## Validation Requirements
1. Lint (ESLint) reasoning-agent code
2. Typecheck (TypeScript) for reasoning modules
3. Unit tests (≥80% coverage) for reasoning logic
4. Knowledge index validation (reasoning-plan entries indexable)
5. Clean-code audit of reasoning output structure
6. Human review de reasoning trace (mandatory)
7. Full `npm run validate` antes de activar downstream workflows

## Domain Adaptation Examples
**Solana Domain:**
- "List facts" → "List PDA seeds, rent-exempt lamports, signer requirements, authority constraints"
- "Consider counterexamples" → "What if signer is missing? What if rent-exempt check fails?"
- "Synthesize perspectives" → "Program perspective vs client perspective vs RPC perspective"

**NFT Domain:**
- "List facts" → "List mint authority, metadata URI, royalty bps, collection verification status"
- "Reverse-engineer" → "From verified collection state, what metadata fields must be immutable?"
- "Evaluate trade-offs" → "On-chain vs off-chain metadata, updateable vs immutable, single vs collection"

**Security Domain:**
- "List facts" → "List trust boundaries, authority hierarchies, CPI call chains, replay attack vectors"
- "Consider counterexamples" → "What if malicious actor controls signer? What if authority is rotated mid-transaction?"
- "Threat modeling" → "STRIDE categories, attack surface mapping, mitigation strategies"

**Architecture Domain:**
- "List facts" → "List components, interfaces, data flows, error modes, scaling constraints"
- "Make table/diagram" → "Component diagram, sequence diagram, C4 model context/container/code"
- "Devise algorithm" → "Data flow algorithm, error handling procedure, recovery strategy"

## Model Configuration
- Preferred model: `qwen/qwen3-235b-a22b-thinking-2507-fast`
- Reasoning effort: `high`
- Output modes: `trace` (full), `answer` (final only), `both` (default)
- Max iterations: unlimited (human approval required)
- Parallel safe: true (when multiple reasoning tasks independent)