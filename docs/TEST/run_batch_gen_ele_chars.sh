# model=sonnet
# # --lang ES (X)
# python docs/TEST/batch_gen_phrase.py --chars docs/TEST/elemental_chars.txt --llm claude_cli:sonnet --lang es 2>&1 | tee -a  docs/TEST/batch_gen-ele_chars-ES.md

# # --lang FR (X)
# python docs/TEST/batch_gen_phrase.py --chars docs/TEST/elemental_chars.txt --llm claude_cli:sonnet --lang fr 2>&1 | tee -a  docs/TEST/batch_gen-ele_chars-FR.md

# --lang PT
python docs/TEST/batch_gen_phrase.py --chars docs/TEST/elemental_chars.txt --llm claude_cli:sonnet --lang pt 2>&1 | tee -a  docs/TEST/batch_gen-ele_chars-PT.md

# --lang KO
python docs/TEST/batch_gen_phrase.py --chars docs/TEST/elemental_chars.txt --llm claude_cli:sonnet --lang ko 2>&1 | tee -a  docs/TEST/batch_gen-ele_chars-KO.md


# # --lang en (X)
# python docs/TEST/batch_gen_phrase.py --chars docs/TEST/elemental_chars.txt --llm claude_cli:sonnet  2>&1 | tee -a docs/TEST/batch_gen-ele_chars-EN.md

# # --lang zh (X)
# python docs/TEST/batch_gen_phrase.py --chars docs/TEST/elemental_chars.txt --llm claude_cli:sonnet --lang zh 2>&1 | tee -a  docs/TEST/batch_gen-ele_chars-ZH.md



