
# ConceptBook content generation

```bash
conda activate spl123
python docs/TEST/batch_gen_phrase.py --phrases docs/TEST/phrases.txt --llm claude_cli:sonnet --skip-cache

python docs/TEST/batch_gen_phrase.py --phrases docs/TEST/phrases.txt --llm ollama:gemma3

python docs/TEST/batch_gen_phrase.py --phrases docs/TEST/phrases.txt --llm ollama:gemma4

```