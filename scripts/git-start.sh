#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Uso:
  ./scripts/git-start.sh <scope> <name>
  ./scripts/git-start.sh <type> <scope> <name> [options]
  ./scripts/git-start.sh SPEC <name> [options]

Ejemplos:
  ./scripts/git-start.sh app initial-ui
  ./scripts/git-start.sh feature shared fix-ui-elements --mode parent --owner czambrano --issue BRI-38
  ./scripts/git-start.sh bugfix shared login-redirect-fix --mode parent --owner czambrano --issue BRI-171
  ./scripts/git-start.sh epic shared admin-collections-console --mode parent --owner czambrano --issue EPIC-011
  ./scripts/git-start.sh SPEC hero-copy-tightening --mode spec --owner czambrano --issue BRI-38 --base feature/czambrano-BRI-38-fix-ui-elements

Options:
  --mode <single|parent|spec>
  --owner <handle>
  --issue <BRI-149>
  --base <branch>
USAGE
}

is_branch_type() {
  [[ "${1:-}" =~ ^(feature|bugfix|fix|hotfix|epic|security|nft|refactor)$ ]]
}

is_spec_type() {
  [[ "${1:-}" == "SPEC" ]]
}

is_legacy_feature_scope() {
  [[ "${1:-}" =~ ^(app|program|shared)$ ]]
}

slugify() {
  printf '%s' "${1:-}" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/-+/-/g'
}

normalize_issue_key() {
  local raw="${1:-}"
  local value
  value="$(printf '%s' "${raw}" | tr '[:lower:]' '[:upper:]')"

  if [[ -z "${value}" ]]; then
    echo "❌ --issue es obligatorio para ramas parent/SPEC."
    exit 1
  fi

  if [[ "${value}" =~ ^[0-9]+$ ]]; then
    printf 'BRI-%s' "${value}"
    return 0
  fi

  if [[ "${value}" =~ ^[A-Z]+-[0-9]+$ ]]; then
    printf '%s' "${value}"
    return 0
  fi

  echo "❌ Issue inválido: ${raw}. Usa formato BRI-149."
  exit 1
}

ensure_base_branch_available() {
  local base_branch="$1"

  if git show-ref --verify --quiet "refs/heads/${base_branch}"; then
    git checkout "${base_branch}"
    if [[ "${base_branch}" == "develop" ]] && git remote get-url origin >/dev/null 2>&1; then
      git pull --ff-only origin develop
    fi
    return 0
  fi

  if git remote get-url origin >/dev/null 2>&1; then
    git fetch origin "${base_branch}" --depth=1 >/dev/null 2>&1 || true
    if git show-ref --verify --quiet "refs/remotes/origin/${base_branch}"; then
      git checkout -b "${base_branch}" "origin/${base_branch}"
      return 0
    fi
  fi

  echo "❌ Base branch no disponible: ${base_branch}"
  exit 1
}

TYPE="feature"
SCOPE=""
NAME=""
MODE="single"
ISSUE_KEY=""
OWNER=""
BASE_BRANCH=""

POSITIONAL=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode)
      MODE="$2"
      shift 2
      ;;
    --issue)
      ISSUE_KEY="$2"
      shift 2
      ;;
    --owner)
      OWNER="$2"
      shift 2
      ;;
    --base)
      BASE_BRANCH="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      POSITIONAL+=("$1")
      shift
      ;;
  esac
done

if [[ "${#POSITIONAL[@]}" -lt 2 ]]; then
  usage
  exit 1
fi

if is_spec_type "${POSITIONAL[0]}"; then
  if [[ "${#POSITIONAL[@]}" -ne 2 ]]; then
    echo "❌ SPEC solo acepta <name> como argumento posicional."
    usage
    exit 1
  fi
  TYPE="SPEC"
  NAME="${POSITIONAL[1]}"
elif [[ "${#POSITIONAL[@]}" -ge 3 ]] && is_branch_type "${POSITIONAL[0]}" && is_legacy_feature_scope "${POSITIONAL[1]}"; then
  TYPE="${POSITIONAL[0]}"
  SCOPE="${POSITIONAL[1]}"
  NAME="${POSITIONAL[2]}"
elif is_legacy_feature_scope "${POSITIONAL[0]}"; then
  TYPE="feature"
  SCOPE="${POSITIONAL[0]}"
  NAME="${POSITIONAL[1]}"
else
  echo "❌ Argumentos inválidos."
  usage
  exit 1
fi

if [[ "${TYPE}" != "SPEC" ]] && ! is_branch_type "${TYPE}"; then
  echo "❌ Tipo inválido: ${TYPE}"
  exit 1
fi

if [[ -n "${SCOPE}" ]] && ! is_legacy_feature_scope "${SCOPE}"; then
  echo "❌ Scope inválido: ${SCOPE}"
  exit 1
fi

if [[ "${TYPE}" == "nft" && "${SCOPE}" != "program" ]]; then
  echo "❌ Las ramas nft solo permiten scope 'program'."
  exit 1
fi

if [[ "${MODE}" == "integration" ]]; then
  echo "⚠️  --mode integration es legacy; usa --mode parent."
  MODE="parent"
fi

if [[ "${MODE}" == "initiative" ]]; then
  echo "⚠️  --mode initiative es legacy; usa --mode parent."
  MODE="parent"
fi

if [[ "${MODE}" == "slice" ]]; then
  echo "⚠️  --mode slice es legacy; usa --mode spec."
  MODE="spec"
fi

if [[ "${TYPE}" == "SPEC" && "${MODE}" == "single" ]]; then
  MODE="spec"
fi

if [[ "${TYPE}" == "SPEC" && "${MODE}" != "spec" ]]; then
  echo "❌ El tipo SPEC solo permite --mode spec."
  exit 1
fi

if [[ ! "${MODE}" =~ ^(single|parent|spec)$ ]]; then
  echo "❌ --mode inválido: ${MODE}. Usa single, parent o spec."
  exit 1
fi

NAME_SLUG="$(slugify "${NAME}")"
if [[ -z "${NAME_SLUG}" ]]; then
  echo "❌ <name> no puede quedar vacío después de normalizar."
  exit 1
fi

if [[ "${MODE}" == "single" ]]; then
  BRANCH="${TYPE}/${SCOPE}-${NAME_SLUG}"
  BASE_BRANCH="${BASE_BRANCH:-develop}"
elif [[ "${MODE}" == "parent" ]]; then
  NORMALIZED_ISSUE="$(normalize_issue_key "${ISSUE_KEY}")"
  NORMALIZED_OWNER="$(slugify "${OWNER}")"
  if [[ -z "${NORMALIZED_OWNER}" ]]; then
    echo "❌ --owner es obligatorio para ramas parent."
    exit 1
  fi
  BRANCH="${TYPE}/${NORMALIZED_OWNER}-${NORMALIZED_ISSUE}-${NAME_SLUG}"
  BASE_BRANCH="${BASE_BRANCH:-develop}"
else
  NORMALIZED_ISSUE="$(normalize_issue_key "${ISSUE_KEY}")"
  NORMALIZED_OWNER="$(slugify "${OWNER}")"
  if [[ -z "${NORMALIZED_OWNER}" ]]; then
    echo "❌ --owner es obligatorio para ramas SPEC."
    exit 1
  fi

  if [[ -z "${BASE_BRANCH}" ]]; then
    echo "❌ --base es obligatorio para ramas SPEC."
    exit 1
  fi

  BRANCH="SPEC/${NORMALIZED_OWNER}-${NORMALIZED_ISSUE}-${NAME_SLUG}"
fi

if [[ "${MODE}" == "parent" || "${MODE}" == "spec" ]]; then
  # Capa 2: Validar handle del desarrollador
  HOOKS_FILE_PATH="$(git rev-parse --show-toplevel 2>/dev/null || pwd)/.agents/hooks.json"
  if [[ -f "${HOOKS_FILE_PATH}" ]]; then
    VALID_DEV="$(node -e '
      const fs = require("fs");
      try {
        const hooks = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
        const allowed = hooks.enforcement_rules?.allowed_developer_handles || ["jaymusicmachine", "jeisonsosa"];
        const owner = process.argv[2].toLowerCase();
        if (allowed.includes(owner)) {
          console.log("true");
        } else {
          console.log("false");
        }
      } catch (e) {
        console.log("false");
      }
    ' "${HOOKS_FILE_PATH}" "${NORMALIZED_OWNER}")"

    if [[ "${VALID_DEV}" != "true" ]]; then
      echo "❌ ERROR DE GOBERNANZA: El handle de desarrollador '\''${OWNER}'\'' no está permitido."
      echo "Los handles permitidos configurados en hooks.json son: [jaymusicmachine, jeisonsosa]."
      exit 1
    fi
  fi

  # Capa 2: Validar existencia del issue key en Linear
  if [[ -n "${LINEAR_API_KEY:-}" ]]; then
    echo "🔍 Validando existencia de issue ${NORMALIZED_ISSUE} en Linear..."
    ISSUE_EXISTS="$(node -e '
      const https = require("https");
      const apiKey = process.env.LINEAR_API_KEY;
      const issueKey = process.argv[1];

      const query = `
        query CheckIssue($id: String!) {
          issue(id: $id) {
            id
            identifier
            title
          }
        }
      `;

      const req = https.request("https://api.linear.app/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": apiKey
        }
      }, (res) => {
        let data = "";
        res.on("data", (chunk) => data += chunk);
        res.on("end", () => {
          try {
            const payload = JSON.parse(data);
            if (payload.data && payload.data.issue) {
              console.log("true");
            } else {
              console.log("false");
            }
          } catch (e) {
            console.log("error");
          }
          process.exit(0);
        });
      });

      req.setTimeout(5000, () => {
        req.destroy();
        console.log("error");
        process.exit(0);
      });

      req.on("error", () => {
        console.log("error");
        process.exit(0);
      });
      req.write(JSON.stringify({ query, variables: { id: issueKey } }));
      req.end();
    ' "${NORMALIZED_ISSUE}")"

    if [[ "${ISSUE_EXISTS}" == "false" ]]; then
      echo "❌ ERROR DE GOBERNANZA: El issue key '\''${NORMALIZED_ISSUE}'\'' no existe en la organización de Linear."
      exit 1
    elif [[ "${ISSUE_EXISTS}" == "error" ]]; then
      echo "⚠️ Warning: No se pudo conectar a Linear para validar el issue. Continuando..."
    else
      echo "✓ Issue ${NORMALIZED_ISSUE} confirmado en Linear."
    fi
  else
    echo "⚠️ Warning: LINEAR_API_KEY no está configurado. Omitiendo validación estricta de issue en Linear."
  fi
fi

git status --porcelain >/dev/null
ensure_base_branch_available "${BASE_BRANCH}"

git checkout -b "${BRANCH}"
if [[ "${MODE}" == "parent" || "${MODE}" == "spec" ]]; then
  git config "branch.${BRANCH}.linearIssueKey" "${NORMALIZED_ISSUE}"
  git config "branch.${BRANCH}.linearIssueType" "${TYPE}"

  # Capa 1: Inicialización automática del Motor de Estado de la Tarea (PHASE_1_BOOTSTRAP)
  STATE_FILE_PATH="$(git rev-parse --show-toplevel 2>/dev/null || pwd)/.agents/active_task_state.json"
  mkdir -p "$(dirname "${STATE_FILE_PATH}")"
  cat <<EOF > "${STATE_FILE_PATH}"
{
  "version": "1.0.0",
  "task_id": "${NORMALIZED_ISSUE}",
  "branch": "${BRANCH}",
  "current_phase": "PHASE_1_BOOTSTRAP",
  "phases": {
    "PHASE_1_BOOTSTRAP": { "completed": true },
    "PHASE_2_DOCS_FILLED": { "completed": false },
    "PHASE_3_ARCHITECT_GATE1": { "completed": false },
    "PHASE_4_HUMAN_DESIGN_APPROVED": { "completed": false },
    "PHASE_5_TESTS_RED": { "completed": false },
    "PHASE_6_CODE_GREEN": { "completed": false },
    "PHASE_7_VALIDATED": { "completed": false },
    "PHASE_8_HUMAN_MERGE_APPROVED": { "completed": false }
  }
}
EOF
fi
if [[ "${MODE}" == "spec" ]]; then
  git config "branch.${BRANCH}.parentWorkBranch" "${BASE_BRANCH}"
fi
echo "✅ Rama creada: ${BRANCH}"
echo "🌿 Base branch: ${BASE_BRANCH}"

# Generar automáticamente plantillas OKF si corresponde
DOC_SLUG=""
if [[ "${MODE}" == "parent" || "${MODE}" == "single" ]]; then
  if [[ "${MODE}" == "parent" ]]; then
    DOC_SLUG="${NORMALIZED_OWNER}-${NORMALIZED_ISSUE}-${NAME_SLUG}"
  else
    DOC_SLUG="${SCOPE}-${NAME_SLUG}"
  fi
fi

if [[ -n "${DOC_SLUG}" ]]; then
  TEMPLATE_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)/knowledge/templates"
  PROBLEM_TEMPLATE="${TEMPLATE_DIR}/problem-spec-template.md"
  SOLUTION_TEMPLATE="${TEMPLATE_DIR}/solution-spec-template.md"

  write_template() {
    local template_path="$1"
    local output_path="$2"
    local fallback_title="$3"
    local fallback_body="$4"
    
    if [[ -f "${template_path}" ]]; then
      node -e '
        const fs = require("fs");
        try {
          let content = fs.readFileSync(process.argv[1], "utf8");
          content = content.replace(/\$\{NAME\}/g, process.argv[3]);
          fs.writeFileSync(process.argv[2], content, "utf8");
        } catch (e) {
          process.exit(1);
        }
      ' "${template_path}" "${output_path}" "${NAME}"
    else
      cat <<EOF > "${output_path}"
# ${fallback_title}: ${NAME}

${fallback_body}
EOF
    fi
  }

  PROBLEM_FALLBACK_BODY="## What problem exists
<!-- Describir el problema o cambio que se está resolviendo -->

## Why it matters
<!-- Por qué es importante resolverlo y cuál es el impacto -->

## What outcome is expected
<!-- Qué resultado se espera para considerar esto como terminado -->

## What gaps exist today
<!-- Qué vacíos o limitaciones existen actualmente en el sistema -->

## What questions remain open
<!-- Qué preguntas o decisiones quedan abiertas -->"

  SOLUTION_FALLBACK_BODY="## How the work will be resolved
<!-- Cómo se resolverá el trabajo (paso a paso o arquitectura general) -->

## What slices and branches will be used
<!-- Qué rebanadas y ramas se utilizarán -->

## What tests go first
<!-- Qué pruebas se escribirán primero (fase RED) -->

## What tooling is required
<!-- Qué herramientas o MCP servers se requieren -->

## What gates must pass
<!-- Qué validaciones o compuertas deben aprobarse -->

## What will be synchronized to Linear
<!-- Qué información se sincronizará con Linear -->"

  if [[ "${TYPE}" =~ ^(feature|security|nft|refactor|epic)$ ]]; then
    PROBLEM_FILE="knowledge/features/feature-${DOC_SLUG}.md"
    SOLUTION_FILE="knowledge/features/feature-${DOC_SLUG}-implementation.md"
    
    mkdir -p knowledge/features
    
    if [[ ! -f "${PROBLEM_FILE}" ]]; then
      write_template "${PROBLEM_TEMPLATE}" "${PROBLEM_FILE}" "Problem Spec" "${PROBLEM_FALLBACK_BODY}"
      echo "📝 Creado archivo de problema: ${PROBLEM_FILE}"
    fi

    if [[ ! -f "${SOLUTION_FILE}" ]]; then
      write_template "${SOLUTION_TEMPLATE}" "${SOLUTION_FILE}" "Solution Spec" "${SOLUTION_FALLBACK_BODY}"
      echo "📝 Creado archivo de solución: ${SOLUTION_FILE}"
    fi
  elif [[ "${TYPE}" =~ ^(fix|bugfix|hotfix)$ ]]; then
    PROBLEM_FILE="knowledge/fixes/fix-${DOC_SLUG}.md"
    SOLUTION_FILE="knowledge/fixes/fix-${DOC_SLUG}-implementation.md"
    
    mkdir -p knowledge/fixes
    
    if [[ ! -f "${PROBLEM_FILE}" ]]; then
      write_template "${PROBLEM_TEMPLATE}" "${PROBLEM_FILE}" "Problem Spec" "${PROBLEM_FALLBACK_BODY}"
      echo "📝 Creado archivo de problema: ${PROBLEM_FILE}"
    fi

    if [[ ! -f "${SOLUTION_FILE}" ]]; then
      write_template "${SOLUTION_TEMPLATE}" "${SOLUTION_FILE}" "Solution Spec" "${SOLUTION_FALLBACK_BODY}"
      echo "📝 Creado archivo de solución: ${SOLUTION_FILE}"
    fi
  fi
fi

if [[ "${MODE}" == "spec" ]]; then
  echo "🧩 SPEC branch detectada. Siguiente PR objetivo: ${BASE_BRANCH}"
  echo "📝 Recuerda: la primera SPEC debe ser la de planificación y las siguientes salen una por una."
elif [[ "${MODE}" == "parent" ]]; then
  echo "🧭 Parent work branch detectada. Siguiente PR final objetivo: develop"
  echo "📝 Para trabajo multi-SPEC, crea primero la SPEC de planificación antes de abrir las demás."
fi

echo "🧪 Gate inicial obligatorio:"
echo "   1) Crea o actualiza el artefacto que gobierna el trabajo antes de implementar."
if [[ "${TYPE}" == "fix" ]]; then
  echo "      - knowledge/fixes/fix-<slug>.md"
  echo "      - knowledge/fixes/fix-<slug>-implementation.md"
elif [[ "${TYPE}" == "feature" || "${TYPE}" == "security" || "${TYPE}" == "nft" || "${TYPE}" == "refactor" ]]; then
  echo "      - knowledge/features/feature-<slug>.md"
  echo "      - knowledge/features/feature-<slug>-implementation.md"
fi

if [[ "${MODE}" == "parent" || "${MODE}" == "spec" ]]; then
  if npm run --silent | grep -q 'linear:issue-start'; then
    echo "🔄 Sincronizando Linear a 'In Progress' para ${NORMALIZED_ISSUE}."
    npm run linear:issue-start -- --issue "${NORMALIZED_ISSUE}"
  else
    echo "ℹ️ linear:issue-start no está disponible; omitiendo sincronización Linear."
  fi
fi
if [[ "${MODE}" == "spec" ]]; then
  echo "   2) Para trabajo multi-SPEC, resuelve la SPEC de planificación antes de delivery SPECs."
else
  echo "   2) Para trabajo multi-SPEC, separa cada SPEC y no las crees todas de una vez."
fi
echo "   3) Define o actualiza tests unitarios de la historia primero (fase RED)."
echo "   4) Implementa codigo solo despues de tener esos tests definidos."
echo "   5) Antes de merge final a develop, espera Human Acceptance despues de pruebas manuales del usuario."
