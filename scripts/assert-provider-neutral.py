#!/usr/bin/env python3
"""Fail CI if a retired third-party preview host is referenced in this repository."""

from pathlib import Path
import sys

RETIRED = "ver" + "cel"
IGNORED = {".git", "node_modules", "dist", "coverage"}


def main() -> int:
    hits: list[str] = []
    for path in Path(".").rglob("*"):
        if any(part in IGNORED for part in path.parts):
            continue
        lowered_path = str(path).replace("\\", "/").lower()
        if RETIRED in lowered_path:
            hits.append(str(path))
            continue
        if not path.is_file():
            continue
        try:
            text = path.read_text(encoding="utf-8", errors="ignore").lower()
        except OSError:
            continue
        if RETIRED in text:
            hits.append(str(path))

    if hits:
        print("Retired provider reference found in tracked source:")
        for hit in sorted(set(hits)):
            print(f" - {hit}")
        return 1

    print("Provider-neutral repository check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
