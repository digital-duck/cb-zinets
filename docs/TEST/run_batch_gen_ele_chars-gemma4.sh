# model=sonnet

# --lang de
python docs/TEST/batch_gen_phrase.py --chars docs/TEST/elemental_chars.txt --llm ollama:gemma4 --lang de 2>&1 | tee -a docs/TEST/batch_gen-ele_chars-DE.md

# # --lang en 
# python docs/TEST/batch_gen_phrase.py --chars docs/TEST/elemental_chars.txt --llm ollama:gemma4 --lang en 2>&1 | tee -a docs/TEST/batch_gen-ele_chars-EN.md

# # --lang zh 
# python docs/TEST/batch_gen_phrase.py --chars docs/TEST/elemental_chars.txt --llm ollama:gemma4 --lang zh 2>&1 | tee -a  docs/TEST/batch_gen-ele_chars-ZH.md

# # --lang ES 
# python docs/TEST/batch_gen_phrase.py --chars docs/TEST/elemental_chars.txt --llm ollama:gemma4 --lang es 2>&1 | tee -a  docs/TEST/batch_gen-ele_chars-ES.md

# # --lang FR 
# python docs/TEST/batch_gen_phrase.py --chars docs/TEST/elemental_chars.txt --llm ollama:gemma4 --lang fr 2>&1 | tee -a  docs/TEST/batch_gen-ele_chars-FR.md

# ##  --lang PT
# python docs/TEST/batch_gen_phrase.py --chars docs/TEST/elemental_chars.txt --llm ollama:gemma4 --lang pt 2>&1 | tee -a  docs/TEST/batch_gen-ele_chars-PT.md

# ## --lang KO
# python docs/TEST/batch_gen_phrase.py --chars docs/TEST/elemental_chars.txt --llm ollama:gemma4 --lang ko 2>&1 | tee -a  docs/TEST/batch_gen-ele_chars-KO.md




