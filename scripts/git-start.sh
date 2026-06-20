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

git status --porcelain >/dev/null
ensure_base_branch_available "${BASE_BRANCH}"

git checkout -b "${BRANCH}"
if [[ "${MODE}" == "parent" || "${MODE}" == "spec" ]]; then
  git config "branch.${BRANCH}.linearIssueKey" "${NORMALIZED_ISSUE}"
  git config "branch.${BRANCH}.linearIssueType" "${TYPE}"
fi
if [[ "${MODE}" == "spec" ]]; then
  git config "branch.${BRANCH}.parentWorkBranch" "${BASE_BRANCH}"
fi
echo "✅ Rama creada: ${BRANCH}"
echo "🌿 Base branch: ${BASE_BRANCH}"

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
  echo "      - docs/fixes/fix-<slug>.md"
  echo "      - docs/fixes/fix-<slug>-implementation.md"
elif [[ "${TYPE}" == "feature" || "${TYPE}" == "security" || "${TYPE}" == "nft" || "${TYPE}" == "refactor" ]]; then
  echo "      - docs/features/feature-<slug>.md"
  echo "      - docs/features/feature-<slug>-implementation.md"
fi

if [[ "${MODE}" == "parent" || "${MODE}" == "spec" ]]; then
  echo "🔄 Sincronizando Linear a 'In Progress' para ${NORMALIZED_ISSUE}."
  npm run linear:issue-start -- --issue "${NORMALIZED_ISSUE}"
fi
if [[ "${MODE}" == "spec" ]]; then
  echo "   2) Para trabajo multi-SPEC, resuelve la SPEC de planificación antes de delivery SPECs."
else
  echo "   2) Para trabajo multi-SPEC, separa cada SPEC y no las crees todas de una vez."
fi
echo "   3) Define o actualiza tests unitarios de la historia primero (fase RED)."
echo "   4) Implementa codigo solo despues de tener esos tests definidos."
echo "   5) Antes de merge final a develop, espera Human Acceptance despues de pruebas manuales del usuario."
