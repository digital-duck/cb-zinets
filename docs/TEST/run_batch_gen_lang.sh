# run_batch_gen_lang.sh — full workload for ONE target language:
#   1. elemental characters (422, --chars — no decomposition, ~30s/char observed)
#   2. YouTube-prep phrases (~111, --phrases — includes domain lookup/creation)
#
# Meant for ES, FR, PT, KO, run one at a time, by hand. Not looped
# automatically: rate limits are expected, and running one language per
# session/day is the plan, not barreling through all four unattended.
#
# Usage:
#   bash docs/TEST/run_batch_gen_lang.sh --lang en --llm claude_cli:sonnet
#   bash docs/TEST/run_batch_gen_lang.sh --lang zh --llm claude_cli:sonnet
#   bash docs/TEST/run_batch_gen_lang.sh --lang es --llm openrouter:gemma4
#   bash docs/TEST/run_batch_gen_lang.sh --lang de --llm ollama:llama3.2
#
# Run from the repo root (cb-zinets/). Resumable — safe to re-run after a
# rate-limit stop; already-done items (per docs/TEST/batch_gen_progress_*.json)
# are skipped automatically. To run detached (survives closing the terminal):
#   nohup bash docs/TEST/run_batch_gen_lang.sh --lang es --llm claude_cli:sonnet \
#     > docs/TEST/run_batch_gen_lang-es.out 2>&1 &

# LANG_CODE="en"
# LLM="claude_cli:sonnet"

# LANG_CODE="ar"
# LLM="ollama:gemma4"

LANG_CODE="es"
LLM="claude_cli:sonnet"

# LANG_CODE="ar"
# LLM="claude_cli:sonnet"


while [[ $# -gt 0 ]]; do
  case "$1" in
    --lang) LANG_CODE="$2"; shift 2 ;;
    --llm)  LLM="$2";       shift 2 ;;
    *) echo "Unknown argument: $1" >&2; exit 1 ;;
  esac
done

if [ -z "$LANG_CODE" ] || [ -z "$LLM" ]; then
  echo "Usage: $0 [--lang <code>] [--llm <adapter:model>]" >&2
  echo "  defaults: --lang en --llm claude_cli:sonnet" >&2
  exit 1
fi

LANG_UPPER=$(echo "$LANG_CODE" | tr '[:lower:]' '[:upper:]')

echo "=== [$LANG_UPPER / $LLM] 1/2 — YouTube-prep phrases (~111 phrases, with decomposition) ==="
python docs/TEST/batch_gen_phrase.py \
  --phrases docs/TEST/phrases-utube.txt \
  --llm "$LLM" \
  --lang "$LANG_CODE" \
  2>&1 | tee -a "docs/TEST/batch_gen-utube-${LANG_UPPER}.md"

echo "=== [$LANG_UPPER / $LLM] 2/2 — elemental characters (422 chars) ==="
python docs/TEST/batch_gen_phrase.py \
  --chars docs/TEST/elemental_chars.txt \
  --llm "$LLM" \
  --lang "$LANG_CODE" \
  2>&1 | tee -a "docs/TEST/batch_gen-ele_chars-${LANG_UPPER}.md"


echo "=== [$LANG_UPPER / $LLM] done ==="
