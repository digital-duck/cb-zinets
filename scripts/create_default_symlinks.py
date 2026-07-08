#!/usr/bin/env python3
"""Create/refresh 'default' symlinks -> sonnet, the read-time baseline model.

'default' is not a real generation target — it's a pure filesystem alias so
the Content/Book page's "-- default --" model selection resolves to real
content (sonnet: currently the model with the fullest, highest-quality
coverage) instead of a legacy no-model path that no longer exists.

Two symlink layers, mirroring the existing concept-symlink pattern (domains
already symlink concept_*.html to the shared canonical under public/concepts/;
this adds one directory level above that):

    public/concepts/{level}.{lang}/default -> sonnet
    public/domains/{domain}/output/{level}.{lang}/default -> sonnet

A domain-local 'default/html/book_*.html' resolves directly through its own
symlink; 'default/html/concept_*.html' resolves through two symlink hops
(domain default/ -> domain sonnet/ -> canonical concepts/.../sonnet/), same
as any other model's concept files.

Idempotent: a {level}.{lang} dir that already has a 'default' entry is
skipped unless --force. Safe to re-run after every generation batch — new
domains/languages generated later just need this run again.

Usage:
    python scripts/create_default_symlinks.py [--dry-run] [--force]
"""
import argparse
from pathlib import Path

from cb_config import ROOT as REPO_ROOT

BASELINE_MODEL = "sonnet"


def _link(parent: Path, dry_run: bool, force: bool) -> str:
    target = parent / BASELINE_MODEL
    link = parent / "default"
    if not target.is_dir():
        return "no-sonnet"
    if link.exists() or link.is_symlink():
        if not force:
            return "skipped"
        if not dry_run:
            link.unlink()
    if not dry_run:
        link.symlink_to(BASELINE_MODEL, target_is_directory=True)
    return "linked"


def create_default_symlinks(dry_run: bool = False, force: bool = False, verbose: bool = False) -> dict:
    """Create/refresh the two 'default -> sonnet' symlink layers.

    Callable from both the CLI below and the Settings page's "Sync Catalog"
    action (api/routers/domains.py), so the two stay in sync automatically
    without a separate script invocation. Returns counts by outcome:
    {linked, skipped, no-sonnet}.
    """
    counts: dict[str, int] = {}

    def _run(parent: Path):
        result = _link(parent, dry_run, force)
        counts[result] = counts.get(result, 0) + 1
        if verbose and result not in ("linked", "skipped"):
            print(f"  {result:12s} {parent.relative_to(REPO_ROOT)}")

    concepts_root = REPO_ROOT / "public" / "concepts"
    for level_lang_dir in sorted(concepts_root.glob("*.*")):
        if level_lang_dir.is_dir():
            _run(level_lang_dir)

    domains_root = REPO_ROOT / "public" / "domains"
    for output_dir in sorted(domains_root.glob("*/output/*.*")):
        if output_dir.is_dir():
            _run(output_dir)

    return counts


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--force", action="store_true", help="replace an existing default symlink")
    args = ap.parse_args()

    counts = create_default_symlinks(dry_run=args.dry_run, force=args.force, verbose=True)

    print(f"\n{'DRY RUN — ' if args.dry_run else ''}Summary:")
    for k, v in sorted(counts.items()):
        print(f"  {k}: {v}")


if __name__ == "__main__":
    main()
