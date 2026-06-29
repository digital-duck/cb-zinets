#!/usr/bin/env python3
"""
Regenerate output/graph.html for every existing phrase domain.

Run from the repo root:
    conda run -n spl123 python docs/TEST/regen_graph_html.py

Only rebuilds graph.html from the already-present input/graph.yaml;
does NOT re-query the database or regenerate catalog.json.
"""
import importlib.util
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent.parent
DOMAINS_ROOT = REPO_ROOT / "public" / "domains"
SCRIPTS_DIR = REPO_ROOT / "scripts"

sys.path.insert(0, str(SCRIPTS_DIR))


def _load_generate_html():
    spec = importlib.util.spec_from_file_location(
        "zinets_to_graph", SCRIPTS_DIR / "zinets_to_graph.py"
    )
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.generate_html


def main():
    generate_html = _load_generate_html()

    domains = sorted(DOMAINS_ROOT.iterdir())
    phrase_domains = [
        d for d in domains
        if d.is_dir() and not d.name.startswith("zinet-setid-") and d.name != "chinese_characters"
    ]

    print(f"Found {len(phrase_domains)} phrase domain(s) to regenerate.\n")
    ok = failed = 0

    for domain_dir in phrase_domains:
        yaml_path = domain_dir / "input" / "graph.yaml"
        html_path = domain_dir / "output" / "graph.html"

        if not yaml_path.exists():
            print(f"  SKIP  {domain_dir.name}  (no input/graph.yaml)")
            continue

        try:
            generate_html(yaml_path, html_path, domain_dir.name)
            print(f"  OK    {domain_dir.name}")
            ok += 1
        except Exception as exc:
            print(f"  FAIL  {domain_dir.name}: {exc}")
            failed += 1

    print(f"\nDone — {ok} rebuilt, {failed} failed.")


if __name__ == "__main__":
    main()
