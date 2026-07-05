# Removing files from git history (with `git filter-repo`)

How to permanently remove a file from **every commit** in a repo's history and
from GitHub. Written after doing this twice in cb-zinets (2026-07-05):

- `db/cb_zinets.sqlite` — withheld the ZiNets source DB (repo shrank 82 MB → 25 MB)
- `spl/.spl/*.db` — withheld the SPL content caches until the YouTube launch (→ 20 MB)

Keep this doc for the next time. Every command runs from the repo root.

---

## 0. When you need this (and when you don't)

| Goal | What to do |
|---|---|
| Stop tracking a file **going forward** | `.gitignore` + `git rm --cached` — no history rewrite |
| File was **never committed** | just add to `.gitignore` |
| File is in **past commits** and must not be public | **this doc** — history rewrite + force push |

Two facts people trip on:

1. **`.gitignore` does nothing for already-tracked files.** It only stops
   *untracked* files from being added.
2. **Deleting a file in a new commit does not remove it from history** — every
   old commit still contains it, and GitHub serves old commits.

---

## 1. Understand the blast radius first

A history rewrite changes **every commit hash** from the first commit that
touched the file onward. Consequences:

- You must **force-push**; the remote history is replaced.
- **Every other clone of the repo becomes incompatible.** Don't `git pull`
  in them afterward (it would merge the old history back) — re-clone fresh.
- Anyone's **fork** keeps the old history; GitHub may also cache old commits
  for a while. For truly sensitive data (credentials), rotate the secret and,
  if needed, ask GitHub Support to run a server-side GC. For "withheld until
  launch" data like ours, the rewrite is enough.
- Open PRs/issues referencing old commit hashes will point at dead SHAs.

---

## 2. Install git-filter-repo (one-time)

`git filter-repo` is the tool git's own docs recommend (`filter-branch` is
deprecated and BFG is unmaintained). It's a single Python script:

```bash
python3 -m pip install --user git-filter-repo
# on Ubuntu 23+ / PEP-668 systems:
python3 -m pip install --user --break-system-packages git-filter-repo

# verify (either form works):
git filter-repo --version  ||  python3 -m git_filter_repo --version
```

---

## 3. The procedure

### Step 1 — commit or stash everything

filter-repo ends with a hard checkout of the rewritten HEAD. **Uncommitted
changes to tracked files will be lost.** Get to a clean tree:

```bash
git status --short          # must be empty (untracked files are OK)
git add -A && git commit -m "checkpoint before history rewrite"
```

### Step 2 — back up (two layers)

```bash
# 2a. full-history backup bundle (restorable clone, includes the file):
git bundle create ~/repo-backup-$(date +%Y%m%d).bundle --all

# 2b. ⚠ copy the on-disk file(s) somewhere safe:
mkdir -p ~/withheld && cp path/to/file.db ~/withheld/
```

**2b is not optional.** This is the step that saved us: after the rewrite,
git checks out the new HEAD — which no longer contains the file — **so the
file is deleted from your working directory too.** If you skip 2b, the only
surviving copy is inside the backup bundle.

### Step 3 — note your remote (filter-repo removes it)

```bash
ORIGIN=$(git remote get-url origin) && echo "$ORIGIN"
```

(Removing the remote is deliberate — it forces you to consciously decide to
push a rewritten history.)

### Step 4 — rewrite

```bash
git filter-repo --invert-paths --path path/to/file.db --force
```

- `--invert-paths --path X` = "keep everything **except** X".
  Repeat `--path` for multiple files:

  ```bash
  git filter-repo --invert-paths \
    --path spl/.spl/content_cache.db \
    --path spl/.spl/content_meta.db \
    --force
  ```

- A whole directory: `--path spl/.spl/` (trailing slash).
- A name wherever it appears: `--path-glob '*.sqlite'`.
- `--force` is needed because this isn't a fresh clone. That's exactly why
  Steps 1–2 exist.

Takes seconds even on large repos; it repacks and GCs automatically.

### Step 5 — verify locally before touching the remote

```bash
# every one of these must come back empty / zero:
git log --all --oneline -- path/to/file.db | wc -l
git ls-files | grep file.db

# repo should have shrunk:
du -sh .git

# restore the on-disk file(s) from Step 2b if you still need them locally:
cp ~/withheld/file.db path/to/
git status --short        # file must show as ignored/absent, NOT untracked
```

If the restored file shows as `??` (untracked), add it to `.gitignore` **now**,
or the next `git add -A` re-commits it and you're back where you started:

```bash
echo "path/to/file.db" >> .gitignore
git add .gitignore && git commit -m "ignore withheld file"
```

### Step 6 — force-push the rewritten history

```bash
git remote add origin "$ORIGIN"
git push --force --all origin
git push --force --tags origin

# confirm remote tip == local tip:
git ls-remote origin main | cut -c1-12
git rev-parse main        | cut -c1-12
```

### Step 7 — aftercare

- Re-clone (don't pull) any other checkout of this repo you have.
- Keep the backup bundle **private** — it contains the removed file.
- If the repo has a `gh-pages` branch or open PRs, they were rewritten/orphaned
  too; redeploy Pages if needed.

---

## 4. Quick reference (the whole thing)

```bash
git add -A && git commit -m "checkpoint"                  # 1 clean tree
git bundle create ~/backup-$(date +%Y%m%d).bundle --all   # 2a history backup
cp path/to/file.db ~/withheld/                            # 2b ⚠ file backup
ORIGIN=$(git remote get-url origin)                       # 3 save remote
git filter-repo --invert-paths --path path/to/file.db --force   # 4 rewrite
git log --all --oneline -- path/to/file.db | wc -l        # 5 verify → 0
cp ~/withheld/file.db path/to/ && echo "path/to/file.db" >> .gitignore
git add .gitignore && git commit -m "ignore withheld file"
git remote add origin "$ORIGIN"                           # 6 push
git push --force --all origin && git push --force --tags origin
```

---

## 5. Gotchas we actually hit (learn from us)

| Gotcha | What happened here |
|---|---|
| filter-repo **deletes the on-disk file** during its post-rewrite checkout | `spl/.spl/` vanished entirely; recovered from the Step-2b copies (content caches) and the Step-2a bundle (runtime caches) |
| `.gitignore`d but still tracked | The ignore entries did nothing until the files were out of the index — the rewrite handles that, but verify with `git ls-files` |
| Partial ignore coverage | Only 2 of 4 cache DBs were ignored; the other 2 would have been silently re-committed by the next `git add -A`. After restoring files, always run `git status` and check for `??` |
| A stale process resurrects the file | An API module still hardcoded the old DB path; `sqlite3.connect()` auto-created an empty file at the purged path. Grep the codebase for the filename after removing it |
| Hash drift breaks other clones | Every clone/pull elsewhere must be replaced by a fresh clone |

---

## 6. Restoring a withheld file later (e.g. at launch)

No history archaeology needed — the withheld file only has to *start* being
tracked again:

```bash
# remove its line from .gitignore, then:
git add path/to/file.db .gitignore
git commit -m "publish previously withheld file"
git push
```

Current withheld assets for this repo: `db/cbzinets.sqlite3` (source DB,
`db/*.sqlite3` ignore rule) and `spl/.spl/*.db` (SPL content caches); private
copies live in `~/cb-zinets-withheld/` and `~/cb-zinets-backup-20260705.bundle`.
