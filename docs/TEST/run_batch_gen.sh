# model=sonnet
## --lang en
# python docs/TEST/batch_gen_phrase.py --phrases docs/TEST/phrases-utube.txt --llm claude_cli:sonnet  2>&1 | tee -a docs/TEST/batch_gen-utube-EN.md

## --lang zh
# python docs/TEST/batch_gen_phrase.py --phrases docs/TEST/phrases-utube.txt --llm claude_cli:sonnet --lang zh 2>&1 | tee -a  docs/TEST/batch_gen-utube-ZH.md


# model=gemma4
## --lang en
python docs/TEST/batch_gen_phrase.py --phrases docs/TEST/phrases-utube.txt --llm ollama:gemma4  2>&1 | tee -a docs/TEST/batch_gen-2026-07-04-EN-gemma4.md

## --lang zh
python docs/TEST/batch_gen_phrase.py --phrases docs/TEST/phrases-utube.txt --llm ollama:gemma4 --lang zh  2>&1 | tee -a docs/TEST/batch_gen-2026-07-04-ZH-gemma4.md

# model=gemma3
## --lang en
python docs/TEST/batch_gen_phrase.py --phrases docs/TEST/phrases-utube.txt --llm ollama:gemma3  2>&1 | tee -a docs/TEST/batch_gen-2026-07-04-EN-gemma3.md

## --lang zh
python docs/TEST/batch_gen_phrase.py --phrases docs/TEST/phrases-utube.txt --llm ollama:gemma3 --lang zh  2>&1 | tee -a docs/TEST/batch_gen-2026-07-04-ZH-gemma3.md

