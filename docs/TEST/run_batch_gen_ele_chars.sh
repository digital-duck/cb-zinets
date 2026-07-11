# model=sonnet

# --lang en 
python docs/TEST/batch_gen_phrase.py --chars docs/TEST/elemental_chars.txt --llm claude_cli:sonnet --lang en 2>&1 | tee -a docs/TEST/batch_gen-ele_chars-EN.md

# --lang zh 
python docs/TEST/batch_gen_phrase.py --chars docs/TEST/elemental_chars.txt --llm claude_cli:sonnet --lang zh 2>&1 | tee -a  docs/TEST/batch_gen-ele_chars-ZH.md

# --lang ES 
python docs/TEST/batch_gen_phrase.py --chars docs/TEST/elemental_chars.txt --llm claude_cli:sonnet --lang es 2>&1 | tee -a  docs/TEST/batch_gen-ele_chars-ES.md

# --lang FR 
python docs/TEST/batch_gen_phrase.py --chars docs/TEST/elemental_chars.txt --llm claude_cli:sonnet --lang fr 2>&1 | tee -a  docs/TEST/batch_gen-ele_chars-FR.md

##  --lang PT
python docs/TEST/batch_gen_phrase.py --chars docs/TEST/elemental_chars.txt --llm claude_cli:sonnet --lang pt 2>&1 | tee -a  docs/TEST/batch_gen-ele_chars-PT.md

## --lang KO
python docs/TEST/batch_gen_phrase.py --chars docs/TEST/elemental_chars.txt --llm claude_cli:sonnet --lang ko 2>&1 | tee -a  docs/TEST/batch_gen-ele_chars-KO.md

## --lang DE
python docs/TEST/batch_gen_phrase.py --chars docs/TEST/elemental_chars.txt --llm claude_cli:sonnet --lang de 2>&1 | tee -a  docs/TEST/batch_gen-ele_chars-DE.md



