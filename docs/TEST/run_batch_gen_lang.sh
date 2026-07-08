# run_batch_gen_lang.sh — full workload for ONE target language:
#   1. elemental characters (422, --chars — no decomposition, ~30s/char observed)
#   2. YouTube-prep phrases (~111, --phrases — includes domain lookup/creation)
#
# Meant for ES, FR, PT, KO, run one at a time, by hand — pass the language
# code as the first argument. Not looped automatically: rate limits are
# expected, and running one language per session/day is the plan, not
# barreling through all four unattended.
#
# Usage:
#   bash docs/TEST/run_batch_gen_lang.sh es
#   bash docs/TEST/run_batch_gen_lang.sh fr
#   bash docs/TEST/run_batch_gen_lang.sh pt
#   bash docs/TEST/run_batch_gen_lang.sh ko
#
# Run from the repo root (cb-zinets/). Resumable — safe to re-run after a
# rate-limit stop; already-done items (per docs/TEST/batch_gen_progress_*.json)
# are skipped automatically. To run detached (survives closing the terminal):
#   nohup bash docs/TEST/run_batch_gen_lang.sh es > docs/TEST/run_batch_gen_lang-es.out 2>&1 &

LANG_CODE="$1"
if [ -z "$LANG_CODE" ]; then
  echo "Usage: $0 <es|fr|pt|ko|...>" >&2
  exit 1
fi
LANG_UPPER=$(echo "$LANG_CODE" | tr '[:lower:]' '[:upper:]')

echo "=== [$LANG_UPPER] 1/2 — elemental characters (422 chars) ==="
python docs/TEST/batch_gen_phrase.py \
  --chars docs/TEST/elemental_chars.txt \
  --llm claude_cli:sonnet \
  --lang "$LANG_CODE" \
  2>&1 | tee -a "docs/TEST/batch_gen-ele_chars-${LANG_UPPER}.md"

echo "=== [$LANG_UPPER] 2/2 — YouTube-prep phrases (~111 phrases, with decomposition) ==="
python docs/TEST/batch_gen_phrase.py \
  --phrases docs/TEST/phrases-utube.txt \
  --llm claude_cli:sonnet \
  --lang "$LANG_CODE" \
  2>&1 | tee -a "docs/TEST/batch_gen-utube-${LANG_UPPER}.md"

echo "=== [$LANG_UPPER] done ==="
