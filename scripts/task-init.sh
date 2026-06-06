#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_REF="develop"
FETCH_REMOTE=1
ASK_MODE="auto"

usage() {
  cat <<'USAGE'
Uso:
  ./scripts/task-init.sh [--ask] [--no-fetch] [--base <branch>] [args git-start]

Ejemplos:
  ./scripts/task-init.sh --ask
  ./scripts/task-init.sh app initial-ui
  ./scripts/task-init.sh feature shared fix-ui-elements --mode parent --owner czambrano --issue BRI-38
  ./scripts/task-init.sh bugfix shared login-redirect-fix --mode parent --owner czambrano --issue BRI-171
  ./scripts/task-init.sh epic shared admin-collections-console --mode parent --owner czambrano --issue EPIC-011

Opciones del bootstrap:
  --ask         Fuerza el pase socrático de clarificación antes de crear la rama
  --no-fetch    Evita refrescar remotos durante el preflight
  --base <ref>   Base branch para el preflight y la rama (default: develop)

El resto de argumentos se pasan a ./scripts/git-start.sh.
USAGE
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
    echo "❌ El issue key es obligatorio para ramas parent/SPEC."
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

prompt_required() {
  local prompt="$1"
  local default_value="${2:-}"
  local __resultvar="$3"
  local reply=""

  if [[ -n "${default_value}" ]]; then
    read -r -p "${prompt} [${default_value}]: " reply
    reply="${reply:-${default_value}}"
  else
    read -r -p "${prompt}: " reply
  fi

  while [[ -z "${reply}" ]]; do
    read -r -p "${prompt}: " reply
  done

  printf -v "${__resultvar}" '%s' "${reply}"
}

print_hint() {
  local branch_type="$1"
  local branch_slug="$2"
  local branch_owner="${3:-}"
  local branch_issue="${4:-}"

  echo
  echo "Breakdown"
  echo "- Socratic pass complete."
  echo "- Problem: ${TASK_SUMMARY:-n/a}"
  echo "- Outcome: ${TASK_OUTCOME:-n/a}"
  if [[ "${BRANCH_MODE}" == "parent" ]]; then
    echo "- Branch shape: ${branch_type}/${branch_owner}-${branch_issue}-${branch_slug}"
  elif [[ "${BRANCH_MODE}" == "spec" ]]; then
    echo "- Branch shape: SPEC/${branch_owner}-${branch_issue}-${branch_slug}"
  else
    echo "- Branch shape: ${branch_type}/${BRANCH_SCOPE}-${branch_slug}"
  fi

  case "${branch_type}" in
    fix|bugfix|hotfix)
      echo "- Canonical docs: docs/fixes/fix-${branch_slug}.md and docs/fixes/fix-${branch_slug}-implementation.md"
      ;;
    epic)
      echo "- Canonical docs: docs/features/feature-${branch_slug}.md and the matching RFC story set when the epic is RFC-backed."
      ;;
    feature|security|nft|refactor)
      echo "- Canonical docs: docs/features/feature-${branch_slug}.md"
      ;;
  esac

  if [[ "${BRANCH_MODE}" == "parent" || "${BRANCH_MODE}" == "spec" ]]; then
    echo "- Multi-SPEC reminder: create one SPEC at a time and keep the parent work branch stable."
  fi
}

POSITIONAL=()
TASK_SUMMARY=""
TASK_OUTCOME=""
BRANCH_TYPE=""
BRANCH_SCOPE=""
BRANCH_NAME=""
BRANCH_MODE="single"
ISSUE_KEY=""
OWNER=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --ask)
      ASK_MODE="ask"
      shift
      ;;
    --no-ask)
      ASK_MODE="no-ask"
      shift
      ;;
    --base)
      BASE_REF="$2"
      shift 2
      ;;
    --fetch)
      FETCH_REMOTE=1
      shift
      ;;
    --no-fetch)
      FETCH_REMOTE=0
      shift
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

if [[ "${ASK_MODE}" == "auto" ]]; then
  if [[ -t 0 && "${#POSITIONAL[@]}" -lt 2 ]]; then
    ASK_MODE="ask"
  else
    ASK_MODE="no-ask"
  fi
fi

echo "== Task Bootstrap =="
PREFLIGHT_ARGS=("--base" "${BASE_REF}" "--bootstrap")
if [[ "${FETCH_REMOTE}" == "1" ]]; then
  PREFLIGHT_ARGS+=("--fetch")
fi
bash "${SCRIPT_DIR}/ci/preflight-start.sh" "${PREFLIGHT_ARGS[@]}"

if [[ "${ASK_MODE}" == "ask" ]]; then
  echo
  echo "Before we branch, let us make the shape of the work plain."
  prompt_required "What problem or change are we solving?" "" TASK_SUMMARY
  prompt_required "What outcome would make this feel finished?" "" TASK_OUTCOME
  prompt_required "Which Linear issue type / branch family fits best (feature, bugfix, fix, hotfix, epic, security, nft, refactor)?" "" BRANCH_TYPE
  prompt_required "Which scope does it touch (app, program, shared)?" "" BRANCH_SCOPE
  prompt_required "What short branch/doc slug should we use?" "" BRANCH_NAME
  prompt_required "What branch mode do we need (single, parent, spec)?" "parent" BRANCH_MODE
  if [[ "${BRANCH_MODE}" == "integration" ]]; then
    echo "⚠️  Branch mode integration is legacy; using parent."
    BRANCH_MODE="parent"
  fi

  case "${BRANCH_TYPE}" in
    feature|bugfix|fix|hotfix|epic|security|nft|refactor) ;;
    *)
      echo "❌ Branch family inválida: ${BRANCH_TYPE}"
      exit 1
      ;;
  esac

  case "${BRANCH_MODE}" in
    single|parent|spec) ;;
    *)
      echo "❌ Branch mode inválido: ${BRANCH_MODE}"
      exit 1
      ;;
  esac

  if [[ "${BRANCH_MODE}" =~ ^(parent|spec)$ ]]; then
    prompt_required "What Linear issue key anchors the work (for example BRI-149)?" "" ISSUE_KEY
    prompt_required "What developer handle owns the branch (for example czambrano)?" "czambrano" OWNER
    OWNER="$(printf '%s' "${OWNER}" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/-+/-/g')"
  fi

  if [[ "${BRANCH_MODE}" == "spec" ]]; then
    prompt_required "What parent work branch should this SPEC follow?" "" BASE_REF
  fi

  BRANCH_NAME="$(slugify "${BRANCH_NAME}")"
  if [[ -z "${BRANCH_NAME}" ]]; then
    echo "❌ El slug no puede quedar vacío después de normalizar."
    exit 1
  fi

  if [[ "${BRANCH_MODE}" == "parent" || "${BRANCH_MODE}" == "spec" ]]; then
    ISSUE_KEY="$(normalize_issue_key "${ISSUE_KEY}")"
  fi

  print_hint "${BRANCH_TYPE}" "${BRANCH_NAME}" "${OWNER}" "${ISSUE_KEY}"

  echo
  read -r -p "Create the branch now? [Y/n]: " CONFIRM
  case "${CONFIRM:-Y}" in
    n|N|no|NO)
      echo "Aborted before branch creation."
      exit 0
      ;;
  esac

  if [[ "${BRANCH_MODE}" == "spec" ]]; then
    GIT_START_ARGS=("SPEC" "${BRANCH_NAME}" --mode spec --owner "${OWNER}" --issue "${ISSUE_KEY}")
    GIT_START_BASE="${BASE_REF}"
  else
    GIT_START_ARGS=("${BRANCH_TYPE}" "${BRANCH_SCOPE}" "${BRANCH_NAME}")
    GIT_START_BASE="${BASE_REF}"
    if [[ "${BRANCH_MODE}" == "parent" ]]; then
      GIT_START_ARGS+=(--mode parent --owner "${OWNER}" --issue "${ISSUE_KEY}")
    fi
  fi
else
  if [[ "${#POSITIONAL[@]}" -lt 2 ]]; then
    echo "❌ Falta información para crear la rama."
    usage
    exit 1
  fi
  GIT_START_ARGS=("${POSITIONAL[@]}")
  GIT_START_BASE="${BASE_REF}"
  BRANCH_TYPE=""
  BRANCH_SCOPE=""
  BRANCH_NAME=""
fi

bash "${SCRIPT_DIR}/git-start.sh" "${GIT_START_ARGS[@]}" --base "${GIT_START_BASE}"

if [[ "${ASK_MODE}" == "ask" ]]; then
  echo
  echo "Next steps"
  echo "- If this is fix/bugfix/hotfix work, create docs/fixes/fix-<slug>.md and docs/fixes/fix-<slug>-implementation.md."
  echo "- If this is feature/security/nft/refactor/epic work, keep docs/features/feature-<slug>.md aligned with the branch and add RFC docs when the epic requires them."
  echo "- If the work is multi-SPEC, start with the planning SPEC before delivery SPECs and keep them one at a time."
fi
