
# ConceptBook content generation

```bash
conda activate spl123
python docs/TEST/batch_gen_phrase.py --phrases docs/TEST/phrases.txt --llm claude_cli:sonnet --skip-cache

python docs/TEST/batch_gen_phrase.py --phrases docs/TEST/phrases.txt --llm ollama:gemma3

python docs/TEST/batch_gen_phrase.py --phrases docs/TEST/phrases.txt --llm ollama:gemma4

```

each claude session has limited data quota, see below log

```output

(spl123) gongai@ducklover1:~/projects/digital-duck/cb_zinets$ python docs/TEST/batch_gen_phrase.py --phrases docs/TEST/phrases.txt --llm claude_cli:sonnet 
03:01:45  Batch gen  llm=claude_cli:sonnet  model=sonnet  level=intro  lang=en  skip_cache=False
03:01:45  Phrases: 57  |  Progress file: /home/gongai/projects/digital-duck/cb_zinets/docs/TEST/batch_gen_progress_sonnet.json
03:01:45  
03:01:45  SKIP   无中生有  (done in progress file)
03:01:45  SKIP   日新月异  (done in progress file)
03:01:45  SKIP   天长地久  (done in progress file)
03:01:45  Queue  争分夺秒  domain=争分夺秒  target=phrase_争分夺秒
03:01:45         task_id=a9ca3f79 ...
03:02:45         ✓ done
03:02:45         catalog updated: books=3, concepts=51
03:02:45  SKIP   水落石出  (done in progress file)
03:02:45  SKIP   火上加油  (done in progress file)
03:02:45  SKIP   卷土重来  (done in progress file)
03:02:45  SKIP   狗急跳墙  (done in progress file)
03:02:45  SKIP   鸡飞狗跳  (done in progress file)
03:02:45  SKIP   水火不容  (done in progress file)
03:02:45  Queue  金口玉言  domain=金口玉言  target=phrase_金口玉言
03:02:45         task_id=bde4ddcf ...
03:05:15         ✓ done
03:05:15         catalog updated: books=3, concepts=36
03:05:16  Queue  耳目一新  domain=耳目一新  target=phrase_耳目一新
03:05:16         task_id=ef197b65 ...
03:09:16         ✓ done
03:09:16         catalog updated: books=3, concepts=30
03:09:16  Queue  手忙脚乱  domain=手忙脚乱  target=phrase_手忙脚乱
03:09:16         task_id=4914c8b7 ...
03:12:31         ✗ spl3 exited 1
03:12:31  Queue  目瞪口呆  domain=目瞪口呆  target=phrase_目瞪口呆
03:12:31         task_id=d31d7f5a ...
03:17:16         ✓ done
03:17:17         catalog updated: books=3, concepts=30
03:17:17  Queue  口是心非  domain=口是心非  target=phrase_口是心非
03:17:17         task_id=71e73290 ...
03:23:02         ✓ done
03:23:02         catalog updated: books=3, concepts=27
03:23:02  Queue  鸡犬不宁  domain=鸡犬不宁  target=phrase_鸡犬不宁
03:23:02         task_id=6d180315 ...
03:26:47         ✓ done
03:26:47         catalog updated: books=3, concepts=27
03:26:47  Queue  呆若木鸡  domain=呆若木鸡  target=phrase_呆若木鸡
03:26:47         task_id=fc11b92f ...
03:30:47         ✓ done
03:30:47         catalog updated: books=2, concepts=22
03:30:47  Queue  狼心狗肺  domain=狼心狗肺  target=phrase_狼心狗肺
03:30:47         task_id=b7ee4503 ...
03:35:48         ✓ done
03:35:48         catalog updated: books=2, concepts=28
03:35:48  Queue  人山人海  domain=人山人海  target=phrase_人山海
03:35:48         task_id=bb2303d4 ...
03:37:33         ✗ spl3 exited 1
03:37:33  Queue  没头没脑  domain=没头没脑  target=phrase_没头脑
03:37:33         task_id=1f96aa27 ...
03:37:48         ✗ spl3 exited 1
03:37:48  Queue  垂头丧气  domain=垂头丧气  target=phrase_垂头丧气
03:37:48         task_id=9270bb31 ...
03:38:03         ✗ spl3 exited 1
03:38:03  Queue  不见不散  domain=不见不散  target=phrase_不见散
03:38:03         task_id=16a6d683 ...
03:38:18         ✗ spl3 exited 1
03:38:18  Queue  山珍海味  domain=山珍海味  target=phrase_山珍海味
03:38:18         task_id=9a4c2d3e ...
03:38:33         ✗ spl3 exited 1
03:38:33  Queue  才气过人  domain=才气过人  target=phrase_才气过人
03:38:33         task_id=53737544 ...
03:38:48         ✗ spl3 exited 1
03:38:48  SKIP   一分为二  (done in progress file)
03:38:48  SKIP   以一当十  (done in progress file)

```