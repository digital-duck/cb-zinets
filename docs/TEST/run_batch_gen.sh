# model=sonnet

# --lang ar
python docs/TEST/batch_gen_phrase.py --phrases docs/TEST/phrases-utube.txt --llm claude_cli:sonnet --lang ar  2>&1 | tee -a docs/TEST/batch_gen-utube-AR.md

# # --lang de
# python docs/TEST/batch_gen_phrase.py --phrases docs/TEST/phrases-utube.txt --llm claude_cli:sonnet --lang de  2>&1 | tee -a docs/TEST/batch_gen-utube-DE.md

# # --lang en
# python docs/TEST/batch_gen_phrase.py --phrases docs/TEST/phrases-utube.txt --llm claude_cli:sonnet --lang en  2>&1 | tee -a docs/TEST/batch_gen-utube-EN.md

# # --lang zh
# python docs/TEST/batch_gen_phrase.py --phrases docs/TEST/phrases-utube.txt --llm claude_cli:sonnet --lang zh 2>&1 | tee -a  docs/TEST/batch_gen-utube-ZH.md

# # --lang es
# python docs/TEST/batch_gen_phrase.py --phrases docs/TEST/phrases-utube.txt --llm claude_cli:sonnet --lang es 2>&1 | tee -a  docs/TEST/batch_gen-utube-ES.md

# # --lang fr
# python docs/TEST/batch_gen_phrase.py --phrases docs/TEST/phrases-utube.txt --llm claude_cli:sonnet --lang fr 2>&1 | tee -a  docs/TEST/batch_gen-utube-FR.md


