# Diagnostic sweep: does the LLM honor --lang reliably across target languages?
# See scripts/sweep_language_check.py for what this checks and why (forces a
# fresh skip_cache=True generation per language, inspects spl/tools.py's
# verify_language() outcome in the task log, and independently re-checks the
# saved concept_*.html on disk).

# concept=乙  model=sonnet  langs=fr,es,pt,ko,de
python scripts/sweep_language_check.py --concept 乙 --langs fr,es,pt,ko,de --llm claude_cli:sonnet 2>&1 | tee -a docs/TEST/sweep_language_check-乙.md


# # other concepts / language sets to spot-check later:

# # a different primitive, same language set
# python scripts/sweep_language_check.py --concept 一 --langs fr,es,pt,ko,de --llm claude_cli:sonnet 2>&1 | tee -a docs/TEST/sweep_language_check-一.md

# # AR once RTL support lands (see readme-roadmap.md)
# python scripts/sweep_language_check.py --concept 乙 --langs ar --llm claude_cli:sonnet 2>&1 | tee -a docs/TEST/sweep_language_check-乙.md
