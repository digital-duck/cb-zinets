import asyncio
from pathlib import Path

from api.config import settings

_REPO_ROOT = Path(__file__).parent.parent.parent
_HTML2PDF = _REPO_ROOT / "scripts" / "html2pdf.js"


async def generate_pdf(
    domain_id: str, target: str, level: str = "intro", language: str = "en"
) -> dict:
    variant = f"{level}.{language}"
    html_dir = settings.public_domains / domain_id / "output" / variant / "html"
    pdf_dir = settings.public_domains / domain_id / "output" / variant / "pdf"
    pdf_dir.mkdir(parents=True, exist_ok=True)

    html_file = html_dir / f"book_{target}.html"
    pdf_file = pdf_dir / f"book_{target}.pdf"

    if not html_file.exists():
        return {"ok": False, "error": f"HTML not found: {html_file}. Generate the book first."}

    cmd = ["node", str(_HTML2PDF), "--input", str(html_file), "--output", str(pdf_file)]
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.STDOUT,
    )
    stdout, _ = await proc.communicate()

    if proc.returncode != 0:
        return {"ok": False, "error": stdout.decode(errors="replace")}

    rel_path = f"output/{variant}/pdf/book_{target}.pdf"
    _mark_pdf_generated(domain_id, target, level, language, rel_path)
    return {"ok": True, "file": rel_path}


def _mark_pdf_generated(
    domain_id: str, target: str, level: str, language: str, rel_path: str
) -> None:
    import json
    catalog_path = settings.public_domains / "catalog.json"
    catalog = json.loads(catalog_path.read_text())
    for d in catalog:
        if d["id"] != domain_id:
            continue
        pdfs: list[dict] = d.setdefault("pdfs", [])
        if not any(p["target"] == target for p in pdfs):
            pdfs.append({"target": target, "file": rel_path})
        break
    catalog_path.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n")
