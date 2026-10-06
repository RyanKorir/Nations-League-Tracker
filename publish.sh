#!/usr/bin/env bash
# Creates the GitHub repo "nations-league-tracker" and pushes this project. Needs: git + GitHub CLI (gh auth login).
set -e
git init -q -b main 2>/dev/null || git init -q
git add .
git commit -q -m "Nations League Tracker: live scores, tree view, top scorers, country-aware highlights" || true
gh repo create nations-league-tracker --public --source=. --push \
  --description "⚽ Live UEFA Nations League 2026/27 tracker: standings, tree view, top scorers, highlights"
gh repo edit --add-topic uefa-nations-league --add-topic football --add-topic nextjs --add-topic typescript --add-topic live-scores
echo "Done: $(gh repo view --json url -q .url)"
