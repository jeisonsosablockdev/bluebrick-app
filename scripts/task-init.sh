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
  ./scripts/task-init.sh feature shared single-issue-slice-planning --mode initiative --issue BRI-149

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
    echo "❌ El issue key es obligatorio para ramas initiative/slice."
    exit 1
  fi

  if [[ "${value}" =~ ^[0-9]+$ ]]; then
    printf 'bri-%s' "${value}"
    return 0
  fi

  if [[ "${value}" =~ ^[A-Z]+-[0-9]+$ ]]; then
    printf '%s' "${value}" | tr '[:upper:]' '[:lower:]'
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

  echo
  echo "Breakdown"
  echo "- Socratic pass complete."
  echo "- Problem: ${TASK_SUMMARY:-n/a}"
  echo "- Outcome: ${TASK_OUTCOME:-n/a}"
  if [[ "${BRANCH_MODE}" == "initiative" ]]; then
    echo "- Branch shape: initiative/${ISSUE_KEY}-${branch_slug}"
  elif [[ "${BRANCH_MODE}" == "slice" ]]; then
    echo "- Branch shape: ${branch_type}/${BRANCH_SCOPE}-${branch_slug}-${ISSUE_KEY}-sNN-<slice-slug>"
  else
    echo "- Branch shape: ${branch_type}/${BRANCH_SCOPE}-${branch_slug}"
  fi

  case "${branch_type}" in
    fix)
      echo "- Canonical docs: docs/fixes/fix-${branch_slug}.md and docs/fixes/fix-${branch_slug}-implementation.md"
      ;;
    feature|security|nft|refactor)
      echo "- Canonical docs: docs/features/feature-${branch_slug}.md"
      ;;
  esac

  if [[ "${BRANCH_MODE}" == "initiative" || "${BRANCH_MODE}" == "slice" ]]; then
    echo "- Multi-slice reminder: create the spec slice before delivery slices."
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
SLICE_ID=""
SLICE_SLUG=""

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
  prompt_required "Which branch family fits best (feature, fix, security, nft, refactor)?" "feature" BRANCH_TYPE
  prompt_required "Which scope does it touch (app, program, shared)?" "" BRANCH_SCOPE
  prompt_required "What short branch/doc slug should we use?" "" BRANCH_NAME
  prompt_required "What branch mode do we need (single, initiative, slice)?" "single" BRANCH_MODE

  if [[ "${BRANCH_MODE}" == "integration" ]]; then
    echo "⚠️  Branch mode integration is legacy; using initiative."
    BRANCH_MODE="initiative"
  fi

  case "${BRANCH_TYPE}" in
    feature|fix|security|nft|refactor) ;;
    *)
      echo "❌ Branch family inválida: ${BRANCH_TYPE}"
      exit 1
      ;;
  esac

  case "${BRANCH_MODE}" in
    single|initiative|slice) ;;
    *)
      echo "❌ Branch mode inválido: ${BRANCH_MODE}"
      exit 1
      ;;
  esac

  if [[ "${BRANCH_MODE}" =~ ^(initiative|slice)$ ]]; then
    prompt_required "What Linear issue key anchors the work (for example BRI-149)?" "" ISSUE_KEY
  fi

  if [[ "${BRANCH_MODE}" == "slice" ]]; then
    prompt_required "What slice id should this branch use (for example S01)?" "" SLICE_ID
    prompt_required "What slice slug should describe this slice?" "" SLICE_SLUG
  fi

  BRANCH_TYPE="${BRANCH_TYPE:-feature}"
  BRANCH_NAME="$(slugify "${BRANCH_NAME}")"
  if [[ -z "${BRANCH_NAME}" ]]; then
    echo "❌ El slug no puede quedar vacío después de normalizar."
    exit 1
  fi

  if [[ "${BRANCH_MODE}" == "initiative" ]]; then
    ISSUE_KEY="$(normalize_issue_key "${ISSUE_KEY}")"
  elif [[ "${BRANCH_MODE}" == "slice" ]]; then
    ISSUE_KEY="$(normalize_issue_key "${ISSUE_KEY}")"
    if [[ -z "${SLICE_ID}" || -z "${SLICE_SLUG}" ]]; then
      echo "❌ La slice branch necesita slice id y slice slug."
      exit 1
    fi
    if [[ ! "${SLICE_ID}" =~ ^[sS][0-9]{2}$ ]]; then
      echo "❌ El slice id debe usar formato S01."
      exit 1
    fi
  fi

  print_hint "${BRANCH_TYPE}" "${BRANCH_NAME}"

  echo
  read -r -p "Create the branch now? [Y/n]: " CONFIRM
  case "${CONFIRM:-Y}" in
    n|N|no|NO)
      echo "Aborted before branch creation."
      exit 0
      ;;
  esac

  GIT_START_ARGS=("${BRANCH_TYPE}" "${BRANCH_SCOPE}" "${BRANCH_NAME}")
  if [[ "${BRANCH_MODE}" != "single" ]]; then
    GIT_START_ARGS+=(--mode "${BRANCH_MODE}" --issue "${ISSUE_KEY}")
    if [[ "${BRANCH_MODE}" == "slice" ]]; then
      GIT_START_ARGS+=(--slice-id "${SLICE_ID}" --slice-slug "${SLICE_SLUG}")
    fi
  fi
else
  if [[ "${#POSITIONAL[@]}" -lt 2 ]]; then
    echo "❌ Falta información para crear la rama."
    usage
    exit 1
  fi
  GIT_START_ARGS=("${POSITIONAL[@]}")
  BRANCH_TYPE=""
  BRANCH_SCOPE=""
  BRANCH_NAME=""
fi

bash "${SCRIPT_DIR}/git-start.sh" "${GIT_START_ARGS[@]}" --base "${BASE_REF}"

if [[ "${ASK_MODE}" == "ask" ]]; then
  echo
  echo "Next steps"
  echo "- If this is a fix, create docs/fixes/fix-<slug>.md and docs/fixes/fix-<slug>-implementation.md."
  echo "- If this is feature/security/nft/refactor work, keep docs/features/feature-<slug>.md aligned with the branch."
  echo "- If the work is multi-slice, start with the spec slice before delivery slices."
fi
