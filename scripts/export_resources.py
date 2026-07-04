#!/usr/bin/env python3
"""Export config.yaml's resources: list to public/resources.json.

The frontend Resources page (src/pages/Resources.js) has no YAML parser, so
this generates a plain JSON copy it can fetch — the same pattern catalog.json
uses for domain data. Re-run this whenever config.yaml's resources change.
"""
import json
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = ROOT / "config.yaml"
OUTPUT_PATH = ROOT / "public" / "resources.json"


def main():
    if not CONFIG_PATH.exists():
        sys.exit(f"Config not found: {CONFIG_PATH}")

    config = yaml.safe_load(CONFIG_PATH.read_text(encoding="utf-8")) or {}
    resources = config.get("resources", [])

    OUTPUT_PATH.write_text(
        json.dumps(resources, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Exported {len(resources)} resources -> {OUTPUT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
