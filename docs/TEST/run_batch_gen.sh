# model=sonnet
# --lang en
python docs/TEST/batch_gen_phrase.py --phrases docs/TEST/phrases-utube.txt --llm claude_cli:sonnet  2>&1 | tee -a docs/TEST/batch_gen-utube-EN.md

# --lang zh
python docs/TEST/batch_gen_phrase.py --phrases docs/TEST/phrases-utube.txt --llm claude_cli:sonnet --lang zh 2>&1 | tee -a  docs/TEST/batch_gen-utube-ZH.md


