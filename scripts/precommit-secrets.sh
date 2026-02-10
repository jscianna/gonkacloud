#!/usr/bin/env sh
set -eu

echo "[secret-scan] Checking staged changes for sensitive patterns..."

ADDED_LINES="$(git diff --cached --no-color --unified=0 | grep '^+' | grep -v '^+++' || true)"
SECRET_REGEX='(sk_[A-Za-z0-9_-]{8,}|pk_(test|live)_[A-Za-z0-9_-]{8,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|whsec_[A-Za-z0-9_-]{8,}|postgres(ql)?://[^[:space:]]+)'
FILTERED_LINES="$(printf '%s\n' "$ADDED_LINES" | grep -v 'SECRET_REGEX=' | grep -v 'Patterns checked:' || true)"

if [ -n "$FILTERED_LINES" ] && printf '%s\n' "$FILTERED_LINES" | grep -E -q "$SECRET_REGEX"; then
  echo ""
  echo "WARNING: Potential secrets detected in staged changes."
  echo "Commit aborted. Remove or rotate exposed keys before committing."
  echo ""
  echo "Matched lines:"
  printf '%s\n' "$FILTERED_LINES" | grep -E "$SECRET_REGEX" | sed 's/^+//' | sed 's/=.*/=[REDACTED]/'
  echo ""
  echo "Patterns checked: sk_, pk_, ghp_, github_pat_, whsec_, postgresql://"
  exit 1
fi

if command -v gitleaks >/dev/null 2>&1; then
  echo "[secret-scan] Running gitleaks on staged changes..."
  if gitleaks git --help >/dev/null 2>&1; then
    gitleaks git --staged --redact --verbose
  else
    gitleaks protect --staged --redact --verbose
  fi
else
  echo "[secret-scan] gitleaks not installed; pattern check completed."
fi
