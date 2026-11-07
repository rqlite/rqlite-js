#!/usr/bin/env bash
# One-shot admin migration: default branch → main, protect main, delete master.
# Requires: gh auth as a user with Admin on rqlite/rqlite-js
set -euo pipefail

REPO="${REPO:-rqlite/rqlite-js}"

echo "==> Checking admin on $REPO"
perm="$(gh api "repos/$REPO/collaborators/$(gh api user --jq .login)/permission" --jq .role_name)"
echo "    role: $perm"
if [[ "$perm" != "admin" ]]; then
  echo "ERROR: need Admin on $REPO (got $perm)." >&2
  exit 1
fi

echo "==> Ensuring origin/main exists"
git fetch origin --prune
if ! git ls-remote --heads origin main | grep -q main; then
  git push origin "refs/heads/master:refs/heads/main"
fi

echo "==> Set default branch to main"
gh api -X PATCH "repos/$REPO" -f default_branch=main --jq .default_branch

echo "==> Protect main (no force-push, no delete; PR required; CI status checks)"
# Classic branch protection — clear and widely supported.
gh api -X PUT "repos/$REPO/branches/main/protection" \
  -H "Accept: application/vnd.github+json" \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "verify (20)",
      "verify (22)",
      "verify (24)",
      "integrations"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 0,
    "dismiss_stale_reviews": true,
    "require_code_owner_review": false
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_linear_history": false,
  "block_creations": false,
  "required_conversation_resolution": false
}
EOF

echo "==> Verify release tags still resolve on main history"
git fetch origin --tags --prune
for t in v2.6.0 v3.0.0 v3.0.1; do
  git merge-base --is-ancestor "$t" origin/main \
    && echo "    $t OK ($(git rev-list -1 "$t"))" \
    || { echo "    ERROR: $t not on main history" >&2; exit 1; }
done

echo "==> Delete origin/master"
git push origin --delete master

echo "==> Done. Default=$(gh api repos/$REPO --jq .default_branch); heads:"
git ls-remote --heads origin | grep -E 'main|master' || true
echo "Next: merge/push workflow trigger cleanup so CI only listens on main."
