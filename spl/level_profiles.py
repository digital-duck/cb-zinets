"""Level profiles for concept-book content generation.

Four learner-progression levels — not tied to school systems.
Each profile defines tone, depth, audience, and structure for a level.
Pedagogical format (e.g. flashcard, feynman) is a runtime option,
not a directory-level concern.
"""

from __future__ import annotations

LEVEL_PROFILES: dict[str, dict[str, str]] = {
    "intro": {
        "label": "Introductory",
        "tone": "warm and encouraging; define every new term in plain words the moment it appears",
        "depth": "one idea at a time, concrete before abstract; heavy scaffolding, no formal proofs",
        "audience": "beginner with no prior background in this domain",
        "length": "150–250 words per section",
        "structure": "Everyday example → Picture this → Simple rule → Try it yourself",
    },
    "core": {
        "label": "Core",
        "tone": "clear and motivating; build toward formal reasoning without losing the reader",
        "depth": "definition, worked example, and a short justification — first steps toward proof",
        "audience": "learner comfortable with basic concepts, ready for structured reasoning",
        "length": "250–350 words per section",
        "structure": "Real-world hook → Definition → Worked example → Why it's true → Practice problem",
    },
    "college": {
        "label": "College",
        "tone": "precise and formal",
        "depth": "full definition, proof sketch, concrete worked example",
        "audience": "undergraduate student with foundational background in the domain",
        "length": "300–400 words per section",
        "structure": "Definition → Worked example → Key theorem → Lab exercise",
    },
    "research": {
        "label": "Research",
        "tone": "dense and formal; theorem-proof style; citation-ready",
        "depth": "full proof, connection to standard references, remarks on generality",
        "audience": "graduate student or researcher who needs a precise, citable statement",
        "length": "200–300 words per section",
        "structure": "Definition → Theorem → Proof → Remark (connections / generalisations)",
    },
}


def get_level_profile(level: str) -> dict[str, str]:
    profile = LEVEL_PROFILES.get(level)
    if profile is None:
        available = ", ".join(f"'{l}'" for l in LEVEL_PROFILES)
        raise ValueError(f"Unknown level: {level!r}. Available: {available}")
    return profile


def level_instruction(level: str) -> str:
    p = get_level_profile(level)
    return (
        f"STYLE GUIDE — {p['label']}\n"
        f"Tone      : {p['tone']}\n"
        f"Depth     : {p['depth']}\n"
        f"Audience  : {p['audience']}\n"
        f"Length    : {p['length']}\n"
        f"Structure : {p['structure']}"
    )


def available_levels() -> list[str]:
    return list(LEVEL_PROFILES.keys())


if __name__ == "__main__":
    for name in LEVEL_PROFILES:
        print(f"\n{'=' * 60}")
        print(level_instruction(name))
