"""Tools for recipe 74 — concept-book generator.

Component-based HTML output:
  write_concept_html  — one standalone page per concept (called inside the loop)
  build_book_index    — TOC index page linking to concept pages (called at end)

Domain wrapper tools: graph_lib and level_profiles functions are wrapped here
as @spl_tool callables so they can be used with CALL in build_concept_book.spl.
The loaded domain graph is cached in _DOMAIN_CACHE for the process lifetime.
"""
from __future__ import annotations

import re
import time
from pathlib import Path

from spl.tools import spl_tool

# ── Module-level domain cache ─────────────────────────────────────────────────
# Keyed by domain_yaml filename.  Populated by setup_domain() on first CALL.

_CB_DIR = Path(__file__).parent
_DOMAIN_CACHE: dict[str, dict] = {}
_MODULE_CACHE: dict[str, object] = {}


def _cb_module(name: str):
    """Import a module from the cookbook/74_concept_book/ directory (cached)."""
    if name not in _MODULE_CACHE:
        import importlib.util
        spec = importlib.util.spec_from_file_location(name, _CB_DIR / f"{name}.py")
        mod = importlib.util.module_from_spec(spec)  # type: ignore[arg-type]
        spec.loader.exec_module(mod)  # type: ignore[union-attr]
        _MODULE_CACHE[name] = mod
    return _MODULE_CACHE[name]


def _domain(domain_yaml: str) -> dict:
    """Return cached domain entry; raises KeyError if setup_domain not called yet."""
    return _DOMAIN_CACHE[domain_yaml]


# ── Domain lifecycle tool ─────────────────────────────────────────────────────

@spl_tool
def setup_domain(domain_yaml: str, target: str, payoff_weight: str = "1.5") -> str:
    """Load domain, validate graph, compute teaching order.

    Caches the loaded graph, domain data, primitives, and teaching order.
    Raises ValueError if the graph is cyclic or not reducible to primitives.
    Returns the teaching order as a newline-separated list.
    """
    gl = _cb_module("graph_lib")
    data = gl.load_domain(domain_yaml)  # type: ignore[attr-defined]
    graph = gl.build(data)  # type: ignore[attr-defined]
    primitives = list(data.get("primitives", {}).keys())

    if not gl.acyclic(graph):  # type: ignore[attr-defined]
        raise ValueError(f"Domain graph '{domain_yaml}' has cycles — fix the YAML before generating")
    if not gl.reducible(graph, primitives):  # type: ignore[attr-defined]
        raise ValueError(f"Domain graph '{domain_yaml}' has concepts that don't reduce to primitives")

    needed = gl.ancestors(graph, target) | {target}  # type: ignore[attr-defined]
    restricted = gl.restrict(graph, needed)  # type: ignore[attr-defined]
    order = gl.productivity_order(restricted, weight=float(payoff_weight))  # type: ignore[attr-defined]
    apps = gl.applications_of(graph, target)  # type: ignore[attr-defined]

    _DOMAIN_CACHE[domain_yaml] = {
        "gl": gl,
        "data": data,
        "graph": graph,
        "primitives": primitives,
        "order": order,
        "target": target,
        "apps": apps,
    }
    return "\n".join(order)


# ── Order accessors ───────────────────────────────────────────────────────────

@spl_tool
def order_length(domain_yaml: str) -> str:
    """Return the number of concepts in the teaching order as a string integer."""
    return str(len(_domain(domain_yaml)["order"]))


@spl_tool
def order_item(domain_yaml: str, index: str) -> str:
    """Return the concept at position index (0-based) in the teaching order."""
    return _domain(domain_yaml)["order"][int(index)]


@spl_tool
def order_bullets(domain_yaml: str) -> str:
    """Return the teaching order as a markdown bullet list."""
    return "\n".join(f"- {c}" for c in _domain(domain_yaml)["order"])


@spl_tool
def apps_list(domain_yaml: str) -> str:
    """Return applications of the target concept as human-readable labels (comma-separated)."""
    return ", ".join(a.replace("_", " ").title() for a in _domain(domain_yaml)["apps"])


@spl_tool
def get_domain_name(domain_yaml: str) -> str:
    """Return the human-readable domain name (e.g. 'English Morphology')."""
    data = _domain(domain_yaml)["data"]
    domain_id = data.get("domain", "")
    return domain_id.replace("_", " ").title()


# ── Content checks ────────────────────────────────────────────────────────────

@spl_tool
def count_new_primitives(section: str, domain_yaml: str) -> str:
    """Return the number of primitive names found in section text."""
    cache = _domain(domain_yaml)
    count = cache["gl"].new_primitives(section, cache["primitives"])  # type: ignore[attr-defined]
    return str(count)


@spl_tool
def verify_section(section: str, domain_yaml: str) -> str:
    """Run domain-specific content verification; returns 'ok' or a failure message."""
    cache = _domain(domain_yaml)
    return cache["gl"].verify_content(section, cache["data"])  # type: ignore[attr-defined]


# ── Level ─────────────────────────────────────────────────────────────────────

@spl_tool
def get_level_guide(level: str) -> str:
    """Return the level instruction text for the given level profile name."""
    lp = _cb_module("level_profiles")
    return lp.level_instruction(level)  # type: ignore[attr-defined]


# ── Answer-on-demand (personalised learning path) ────────────────────────────

def _ensure_domain(domain_yaml: str) -> dict:
    """Load, validate, and cache a domain graph without computing a teaching order.

    Used by answer_on_demand tools so they don't depend on setup_domain being
    called first. If setup_domain was already called the richer cache entry is
    reused as-is.
    """
    if domain_yaml not in _DOMAIN_CACHE:
        gl = _cb_module("graph_lib")
        data = gl.load_domain(domain_yaml)  # type: ignore[attr-defined]
        graph = gl.build(data)  # type: ignore[attr-defined]
        primitives = list(data.get("primitives", {}).keys())
        if not gl.acyclic(graph):  # type: ignore[attr-defined]
            raise ValueError(f"Domain graph '{domain_yaml}' has cycles — fix the YAML before generating")
        if not gl.reducible(graph, primitives):  # type: ignore[attr-defined]
            raise ValueError(f"Domain graph '{domain_yaml}' has concepts that don't reduce to primitives")
        _DOMAIN_CACHE[domain_yaml] = {
            "gl": gl, "data": data, "graph": graph,
            "primitives": primitives,
            "order": [], "target": None, "apps": [],
        }
    return _DOMAIN_CACHE[domain_yaml]


@spl_tool
def concept_names_list(domain_yaml: str) -> str:
    """Return all learnable node names (primitives + concepts) as a newline-separated list.

    Loads and validates the domain if not already cached; safe to call before setup_domain.
    """
    cache = _ensure_domain(domain_yaml)
    data = cache["data"]
    names = (
        list(data.get("primitives", {}).keys()) +
        list(data.get("concepts", {}).keys())
    )
    return "\n".join(names)


@spl_tool
def in_graph(domain_yaml: str, target: str) -> str:
    """Return 'yes' if target is a node in the domain graph, '' otherwise.

    Returns '' (falsy) on miss so ASSERT in_graph(...) OTHERWISE ... works correctly.
    """
    cache = _ensure_domain(domain_yaml)
    return "yes" if target in cache["graph"] else ""


@spl_tool
def setup_answer_path(domain_yaml: str, target: str, learner_state_json: str = "[]") -> str:
    """Compute the personalised learning gap for target given the learner's known concepts.

    learner_state_json: JSON array of concept IDs the learner already knows (e.g. '["vector_addition"]').
    Stores the prerequisite sequence (excluding target itself) under cache['answer_order'].
    Returns the gap length as a string integer.
    """
    import json
    cache = _ensure_domain(domain_yaml)
    gl = cache["gl"]
    graph = cache["graph"]
    known: set[str] = set(json.loads(learner_state_json)) if learner_state_json and learner_state_json != "[]" else set()
    path = gl.learning_path(graph, target, known)  # type: ignore[attr-defined]
    cache["answer_order"] = [c for c in path if c != target]
    return str(len(cache["answer_order"]))


@spl_tool
def answer_path_item(domain_yaml: str, index: str) -> str:
    """Return the concept at position index in the personalised learning gap."""
    return _domain(domain_yaml)["answer_order"][int(index)]


# ── File utilities ───────────────────────────────────────────────────────────

@spl_tool
def read_text_file(path: str) -> str:
    """Read a text file and return its full content."""
    return Path(path).read_text(encoding='utf-8')


@spl_tool
def dir_of_file(path: str) -> str:
    """Return the parent directory of a file path (creates it if needed)."""
    p = Path(path).parent
    p.mkdir(parents=True, exist_ok=True)
    return str(p)


@spl_tool
def copy_file(src: str, dst: str) -> str:
    """Copy src to dst (creates parent dirs). Returns dst path."""
    import shutil
    dst_path = Path(dst)
    dst_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst_path)
    return str(dst_path)


# ── Timing ────────────────────────────────────────────────────────────────────

@spl_tool
def now_float() -> str:
    """Return the current monotonic time as a float string (for elapsed timing)."""
    return str(time.monotonic())


@spl_tool
def elapsed_secs(start: str) -> str:
    """Return seconds elapsed since the monotonic time stored in start."""
    return f"{time.monotonic() - float(start):.1f}"


@spl_tool
def sanitize_ts(ts: str) -> str:
    """Convert an ISO timestamp to a filename-safe string (colons and T replaced)."""
    return ts.replace(":", "-").replace("T", "_")


@spl_tool
def make_log_path(log_dir: str, ts_safe: str) -> str:
    """Construct the chain-trace log file path from directory and safe timestamp."""
    return f"{log_dir}/chain_trace-{ts_safe}.md"


@spl_tool
def needs_primitive_refinement(count: str, budget: str) -> str:
    """Return 'yes' if count exceeds budget, else 'no'."""
    return "yes" if int(count) > int(budget) else "no"


# ── HTML builder — component-based ───────────────────────────────────────────

def _render(template: str, **kwargs: str) -> str:
    """Substitute {key} placeholders; safe with CSS/JS that contain literal braces."""
    for k, v in kwargs.items():
        template = template.replace('{' + k + '}', v)
    return template


@spl_tool
def concept_label(concept: str) -> str:
    """Return the human-readable label for a concept ID (underscores → spaces, title-case)."""
    return concept.replace('_', ' ').title()


# 🌱 primitive  🍃 concept  🌸 application
_KIND_EMOJI: dict[str, str] = {"primitive": "🌱", "concept": "🍃", "application": "🌸"}


def _node_kind(concept: str, domain_yaml: str) -> str:
    """Return 'primitive', 'concept', or 'application' for a node ID."""
    data = _domain(domain_yaml)["data"]
    if concept in (data.get("primitives") or {}):
        return "primitive"
    if concept in (data.get("applications") or {}):
        return "application"
    return "concept"


@spl_tool
def write_concept_html(concept: str, section: str, domain_yaml: str, output_dir: str, language: str = "en") -> str:
    """Write a concept page with sidebar listing sibling concepts."""
    if not output_dir:
        return ""
    cache = _domain(domain_yaml)
    order: list[str] = cache["order"]
    domain_id = re.sub(r'(_graph)?\.(ya?ml|json|py)$', '', domain_yaml)
    domain_title = _esc(domain_id.replace('_', ' ').title())
    label = concept.replace('_', ' ').title()
    section = re.sub(
        r'^##\s+' + re.escape(concept) + r'[ \t]*$',
        f'## {label}',
        section, count=1, flags=re.MULTILINE,
    )
    back_url = f'../../../../#/domain/{domain_id}'
    lang_attr = f' lang="{language}"' if language else ' lang="en"'

    toc_items = []
    for c in order:
        c_label = _esc(c.replace('_', ' ').title())
        cls = ' class="toc-target"' if c == concept else ''
        emoji = _KIND_EMOJI[_node_kind(c, domain_yaml)]
        toc_items.append(f'<li{cls}><a href="concept_{c}.html">{emoji} {c_label}</a></li>')
    toc_html = '<ol>\n' + '\n'.join(toc_items) + '\n</ol>'

    emoji = _KIND_EMOJI[_node_kind(concept, domain_yaml)]
    section = re.sub(r'^(##\s+)', rf'\1{emoji} ', section, count=1, flags=re.MULTILINE)

    html = _render(
        _BOOK_INDEX_TEMPLATE,
        lang_attr=lang_attr,
        domain_title=domain_title,
        target_title=f'{emoji} {_esc(label)}',
        back_url=back_url,
        toc=toc_html,
        sections=f'<section>\n{_md_to_html(section)}\n</section>',
    )
    out = Path(output_dir) / f"concept_{concept}.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    return str(out)


@spl_tool
def build_book_index(domain_yaml: str, target: str, language: str, output_dir: str, payoff: str) -> str:
    """Build book_{target}.html — single-page book with all concepts inline."""
    if not output_dir:
        return ""
    cache = _domain(domain_yaml)
    order: list[str] = cache["order"]
    domain = re.sub(r'(_graph)?\.(ya?ml|json|py)$', '', domain_yaml)
    domain_title = _esc(domain.replace('_', ' ').title())
    lang_attr = f' lang="{language}"' if language and language != 'en' else ' lang="en"'

    toc_items = []
    sections_html = []
    out_dir = Path(output_dir)
    for concept in order:
        label = _esc(concept.replace('_', ' ').title())
        slug = re.sub(r'\W+', '-', concept.lower()).strip('-')
        cls = ' class="toc-target"' if concept == target else ''
        emoji = _KIND_EMOJI[_node_kind(concept, domain_yaml)]
        toc_items.append(f'<li{cls}><a href="#{slug}">{emoji} {label}</a></li>')
        concept_file = out_dir / f"concept_{concept}.html"
        if concept_file.exists():
            raw = concept_file.read_text(encoding="utf-8")
            m = re.search(r'<main>(.*?)</main>', raw, re.DOTALL)
            body = m.group(1).strip() if m else ''
        else:
            body = f'<h2>{label}</h2><p>(content not generated)</p>'
        sections_html.append(f'<section id="{slug}">\n{body}\n</section>')

    toc_items.append('<li class="toc-target"><a href="#payoff">🎯 Payoff</a></li>')
    toc_html = '<ol>\n' + '\n'.join(toc_items) + '\n</ol>'
    payoff_decorated = re.sub(r'^(##\s+Payoff)', r'\1 🎯', payoff, count=1, flags=re.MULTILINE)
    sections_html.append(f'<section id="payoff">\n{_md_to_html(payoff_decorated)}\n</section>')

    domain_id = re.sub(r'(_graph)?\.(ya?ml|json|py)$', '', domain_yaml)
    back_url = f'../../../../#/domain/{domain_id}'
    html = _render(
        _BOOK_INDEX_TEMPLATE,
        lang_attr=lang_attr,
        domain_title=domain_title,
        target_title=_esc(target.replace('_', ' ').title()),
        back_url=back_url,
        toc=toc_html,
        sections='\n'.join(sections_html),
    )
    out = out_dir / f"book_{target}.html"
    out.write_text(html, encoding="utf-8")
    return str(out)


# ── internal helpers ──────────────────────────────────────────────────────────

def _esc(text: str) -> str:
    return text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


# ── LaTeX sanitizer ──────────────────────────────────────────────────────────

_KNOWN_LATEX_CMDS: frozenset[str] = frozenset({
    # Greek lowercase
    'alpha','beta','gamma','delta','epsilon','varepsilon','zeta','eta',
    'theta','vartheta','iota','kappa','lambda','mu','nu','xi','pi',
    'varpi','rho','varrho','sigma','varsigma','tau','upsilon','phi',
    'varphi','chi','psi','omega',
    # Greek uppercase
    'Gamma','Delta','Theta','Lambda','Xi','Pi','Sigma','Upsilon',
    'Phi','Psi','Omega',
    # Math functions
    'sin','cos','tan','cot','sec','csc','arcsin','arccos','arctan',
    'sinh','cosh','tanh','coth','log','ln','lg','exp','arg','det',
    'dim','gcd','hom','ker','lim','liminf','limsup','max','min',
    'inf','sup','Pr','deg','lcm','tr','mod','pmod','bmod',
    # Structural
    'frac','dfrac','tfrac','cfrac','binom','dbinom','tbinom',
    'sqrt','over','atop','choose','underset','overset','stackrel',
    'substack','phantom','hphantom','vphantom','smash',
    # Large operators
    'sum','prod','coprod','int','oint','iint','iiint',
    'bigcap','bigcup','bigsqcup','bigvee','bigwedge',
    'bigoplus','bigotimes','bigodot','biguplus',
    # Binary operators
    'pm','mp','times','div','cdot','ast','star','circ','bullet',
    'cap','cup','sqcap','sqcup','vee','wedge','oplus','ominus',
    'otimes','oslash','odot','dagger','ddagger','amalg','setminus',
    'wr','triangleleft','triangleright',
    # Relations
    'leq','le','geq','ge','neq','ne','equiv','sim','simeq',
    'approx','cong','asymp','doteq','prec','succ','preceq','succeq',
    'subset','supset','subseteq','supseteq','sqsubseteq','sqsupseteq',
    'in','notin','ni','propto','vdash','dashv','models','perp',
    'mid','parallel','bowtie','smile','frown',
    'leqq','geqq','thicksim','thickapprox','backsim','backsimeq',
    'subseteqq','supseteqq','Subset','Supset',
    'triangleq','approxeq','eqslantless','eqslantgtr',
    'lesssim','gtrsim','lessgtr','gtrless',
    'preccurlyeq','succcurlyeq','precsim','succsim',
    'between','varpropto','Vdash','vDash','bumpeq','Bumpeq',
    # Arrows
    'to','gets','leftarrow','rightarrow','leftrightarrow',
    'Leftarrow','Rightarrow','Leftrightarrow','iff','implies',
    'longleftarrow','longrightarrow','longleftrightarrow',
    'Longleftarrow','Longrightarrow','Longleftrightarrow',
    'nearrow','searrow','swarrow','nwarrow',
    'uparrow','downarrow','updownarrow',
    'Uparrow','Downarrow','Updownarrow',
    'mapsto','longmapsto','hookleftarrow','hookrightarrow',
    'leftharpoonup','leftharpoondown','rightharpoonup','rightharpoondown',
    'rightleftharpoons','leftrightharpoons','leadsto',
    'twoheadleftarrow','twoheadrightarrow',
    'Lleftarrow','Rrightarrow','multimap',
    'curvearrowleft','curvearrowright',
    'lookarrowleft','looparrowleft','looparrowright',
    'upharpoonleft','upharpoonright','restriction',
    # Negations
    'nless','ngtr','nleq','ngeq','nprec','nsucc','npreceq','nsucceq',
    'subsetneq','supsetneq','nmid','nparallel','nvdash','ncong','nsim',
    'ntriangleleft','ntriangleright','ntrianglelefteq','ntrianglerighteq',
    'not','notin',
    # Delimiters / brackets
    'langle','rangle','lfloor','rfloor','lceil','rceil',
    'lvert','rvert','lVert','rVert','lbrace','rbrace',
    'left','right','middle',
    'big','Big','bigg','Bigg',
    'bigl','bigr','Bigl','Bigr','biggl','biggr','Biggl','Biggr',
    # Symbols
    'infty','partial','nabla','forall','exists','nexists',
    'emptyset','varnothing','wp','Re','Im','aleph','beth','gimel',
    'ell','hbar','hslash','imath','jmath',
    'top','bot','vdots','cdots','ldots','ddots',
    'dots','dotsb','dotsc','dotsi','dotsm','dotso',
    'prime','backprime','flat','natural','sharp',
    'angle','measuredangle','sphericalangle',
    'triangle','triangledown','square','lozenge',
    'therefore','because','checkmark',
    'clubsuit','diamondsuit','heartsuit','spadesuit',
    # Accents
    'hat','widehat','check','tilde','widetilde','acute','grave',
    'dot','ddot','dddot','ddddot','breve','bar','vec','mathring',
    'overline','underline','overbrace','underbrace',
    'overrightarrow','overleftarrow','overleftrightarrow',
    'wideoverline',
    # Font / style
    'mathbf','mathbb','mathcal','mathfrak','mathit','mathrm',
    'mathsf','mathtt','mathop','mathbin','mathrel','mathpunct',
    'text','textrm','textit','textbf','textsf','texttt',
    'boldsymbol','pmb','operatorname','DeclareMathOperator',
    'displaystyle','textstyle','scriptstyle','scriptscriptstyle',
    'limits','nolimits','displaylimits',
    # Spacing
    'quad','qquad','enspace','thinspace','medspace','thickspace',
    'negthinspace','negmedspace','negthickspace',
    # Misc
    'tag','label','ref','eqref','boxed','fbox',
    'color','textcolor','colorbox',
    # Environments
    'begin','end',
})


def _sanitize_math_expr(expr: str) -> str:
    """Replace unknown \\cmd tokens in a LaTeX math expression with \\operatorname{cmd}.

    Prevents MathJax from rendering hallucinated commands in red.
    """
    def _fix(m: re.Match) -> str:
        cmd = m.group(1)
        if not cmd.isalpha() or cmd in _KNOWN_LATEX_CMDS:
            return m.group(0)
        return r'\operatorname{' + cmd + '}'
    return re.sub(r'\\([A-Za-z]+)', _fix, expr)


# ── Optional: mistune for robust Markdown → HTML ─────────────────────────────
# mistune tokenises $...$ as a math span *before* inline emphasis rules, so
# * characters inside LaTeX are architecturally safe (no stash-and-restore needed).
# Install with: pip install mistune
# Falls back to the regex parser below when not available.
try:
    import mistune as _mistune_mod
    from mistune.plugins.math import math as _mistune_math

    class _CBRenderer(_mistune_mod.HTMLRenderer):
        """HTMLRenderer that keeps $...$ delimiters for MathJax and sanitizes LaTeX."""
        def inline_math(self, text: str) -> str:
            return '$' + _sanitize_math_expr(text) + '$'

        def block_math(self, text: str) -> str:
            return '$$\n' + text.strip() + '\n$$\n'

    _mistune_md = _mistune_mod.create_markdown(
        renderer=_CBRenderer(),
        plugins=[_mistune_math, 'table', 'strikethrough'],
    )
    _MISTUNE_AVAILABLE = True
except ImportError:
    _mistune_md = None
    _MISTUNE_AVAILABLE = False
# ─────────────────────────────────────────────────────────────────────────────


def _inline_md(text: str) -> str:
    """Bold, italic, backtick-code.  Protects $...$ LaTeX spans from markup."""
    # Stash $...$ spans so * inside them isn't converted to <em>
    stash: dict[str, str] = {}
    def _stash_math(m: re.Match) -> str:
        key = f'\x00M{len(stash)}\x00'
        stash[key] = '$' + _sanitize_math_expr(m.group(1)) + '$'
        return key
    text = re.sub(r'\$(.+?)\$', _stash_math, text)
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'\*(.+?)\*', r'<em>\1</em>', text)
    text = re.sub(r'`([^`]+)`', lambda m: f'<code>{_esc(m.group(1))}</code>', text)
    for key, val in stash.items():
        text = text.replace(key, val)
    return text


def _parse_table_row(line: str) -> list[str]:
    """Split a `| a | b | c |` line into cell strings."""
    line = line.strip()
    if line.startswith('|'):
        line = line[1:]
    if line.endswith('|'):
        line = line[:-1]
    return [c.strip() for c in line.split('|')]


def _is_table_separator(line: str) -> bool:
    """Check if line is a `|---|---|` separator row."""
    return bool(re.match(r'^\s*\|?[\s:]*-{2,}[\s:]*(\|[\s:]*-{2,}[\s:]*)*\|?\s*$', line))


def _render_table(rows: list[str]) -> str:
    """Convert collected markdown table lines into an HTML table."""
    if len(rows) < 2:
        return '\n'.join(rows)
    header = _parse_table_row(rows[0])
    body_start = 2 if (len(rows) > 1 and _is_table_separator(rows[1])) else 1
    html = '<table>\n<thead><tr>'
    for cell in header:
        html += f'<th>{_inline_md(cell)}</th>'
    html += '</tr></thead>\n<tbody>\n'
    for row_line in rows[body_start:]:
        if _is_table_separator(row_line):
            continue
        cells = _parse_table_row(row_line)
        html += '<tr>'
        for cell in cells:
            html += f'<td>{_inline_md(cell)}</td>'
        html += '</tr>\n'
    html += '</tbody>\n</table>'
    return html


def _md_to_html(md: str) -> str:
    """Markdown → HTML.  Uses mistune when available; falls back to regex parser."""
    if _MISTUNE_AVAILABLE and _mistune_md is not None:
        return (_mistune_md(md) or '').strip()
    return _md_to_html_regex(md)


def _md_to_html_regex(md: str) -> str:
    """Regex-based Markdown → HTML fallback.  Preserves $...$ and $$...$$ for MathJax."""
    lines = md.split('\n')
    out: list[str] = []
    in_code = False
    in_dmath = False
    code_buf: list[str] = []
    math_buf: list[str] = []
    para_buf: list[str] = []
    table_buf: list[str] = []

    def flush_para() -> None:
        if para_buf:
            out.append(f'<p>{" ".join(para_buf)}</p>')
            para_buf.clear()

    def flush_table() -> None:
        if table_buf:
            out.append(_render_table(table_buf))
            table_buf.clear()

    def _is_table_line(ln: str) -> bool:
        s = ln.strip()
        return s.startswith('|') and s.endswith('|') and s.count('|') >= 2

    for line in lines:
        # ── fenced code blocks ────────────────────────────────────────────────
        if line.startswith('```'):
            if in_code:
                out.append(f'<pre><code>{_esc(chr(10).join(code_buf))}</code></pre>')
                code_buf.clear()
                in_code = False
            else:
                flush_para()
                flush_table()
                in_code = True
            continue
        if in_code:
            code_buf.append(line)
            continue

        # ── display math ($$ ... $$) ──────────────────────────────────────────
        if re.match(r'^\s*\$\$', line):
            stripped = line.strip()
            if stripped != '$$' and stripped.endswith('$$') and len(stripped) > 4:
                flush_para()
                flush_table()
                # single-line $$...$$ — sanitize the inner expression
                inner = stripped[2:-2]
                out.append('$$' + _sanitize_math_expr(inner) + '$$')
                continue
            if in_dmath:
                sanitized = [_sanitize_math_expr(ln) for ln in math_buf]
                out.append('$$\n' + '\n'.join(sanitized) + '\n$$')
                math_buf.clear()
                in_dmath = False
            else:
                flush_para()
                flush_table()
                in_dmath = True
            continue
        if in_dmath:
            math_buf.append(line)
            continue

        # ── tables ────────────────────────────────────────────────────────────
        if _is_table_line(line) or (table_buf and _is_table_separator(line)):
            flush_para()
            table_buf.append(line)
            continue
        else:
            flush_table()

        # ── headings ──────────────────────────────────────────────────────────
        m = re.match(r'^(#{1,6})\s+(.+)$', line)
        if m:
            flush_para()
            lvl = len(m.group(1))
            text = _inline_md(m.group(2))
            slug = re.sub(r'\W+', '-', m.group(2).lower()).strip('-')
            out.append(f'<h{lvl} id="{slug}">{text}</h{lvl}>')
            continue

        # ── list items (bullet or numbered) ───────────────────────────────────
        m = re.match(r'^(?:[-*]|\d+\.)\s+(.+)$', line)
        if m:
            flush_para()
            out.append(f'<li>{_inline_md(m.group(1))}</li>')
            continue

        # Horizontal rule
        if re.match(r'^---+$', line.strip()):
            flush_para()
            out.append('<hr>')
            continue

        # Blank line → paragraph break
        if not line.strip():
            flush_para()
            continue

        para_buf.append(_inline_md(line))

    flush_para()
    flush_table()
    return '\n'.join(out)


_SHARED_CSS = """\
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Georgia,serif;background:#fafaf8;color:#1a1a1a;line-height:1.7}
h2{font-size:1.45rem;color:#1e3a5f;margin-bottom:12px}
h3{font-size:1.1rem;color:#2e4a7f;margin:20px 0 8px}
h4{font-size:1rem;color:#3a5a8f;margin:16px 0 6px}
p{margin-bottom:16px;font-size:1rem}
li{margin-bottom:6px;margin-left:24px;font-size:1rem}
table{border-collapse:collapse;margin:16px 0;font-size:.95rem;width:auto}
th,td{border:1px solid #d8d8d0;padding:8px 12px;text-align:left}
th{background:#eef1f5;font-weight:600;color:#1e3a5f}
tr:nth-child(even){background:#f8f8f5}
pre{background:#f4f4f0;border:1px solid #d8d8d0;border-radius:6px;
    padding:16px 20px;overflow-x:auto;margin:16px 0}
code{font-family:Menlo,Consolas,monospace;font-size:.87em}
p code{background:#f0f0ea;padding:1px 4px;border-radius:3px}
.back{display:inline-block;font-family:system-ui,sans-serif;font-size:.85rem;
      color:#2563eb;text-decoration:none;margin-bottom:24px}
.back:hover{text-decoration:underline}"""

_MATHJAX_HEAD = """\
<script>
MathJax = {
  tex: { inlineMath: [['$','$'],['\\\\(','\\\\)']], displayMath: [['$$','$$'],['\\\\[','\\\\]']] },
  options: { skipHtmlTags: ['script','noscript','style','textarea','pre','code'] }
};
</script>
<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js" async></script>"""

_BOOK_INDEX_TEMPLATE = """\
<!DOCTYPE html>
<html{lang_attr}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{target_title} — {domain_title}</title>
""" + _MATHJAX_HEAD + """
<style>
""" + _SHARED_CSS + """
.page{display:grid;grid-template-columns:260px 1fr;min-height:100vh}
nav.toc{position:sticky;top:0;height:100vh;overflow-y:auto;
        background:#1e3a5f;color:#e8f0fe;padding:24px 16px;
        display:flex;flex-direction:column}
nav.toc .back{color:#a8c8f0;margin-bottom:20px}
nav.toc .back:hover{color:#fff}
nav.toc h2{font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;
           color:#90b4e8;margin-bottom:14px;font-family:system-ui,sans-serif}
nav.toc ol{list-style:decimal inside;padding:0;flex:1}
nav.toc li{margin-bottom:7px;font-size:.85rem;line-height:1.4;font-family:system-ui,sans-serif}
nav.toc a{color:#a8c8f0;text-decoration:none}
nav.toc a:hover{color:#fff}
nav.toc li.toc-target{font-weight:700}
nav.toc li.toc-target a{color:#fff}
nav.toc .spl-credit{margin-top:auto;padding-top:14px;border-top:1px solid rgba(255,255,255,0.15);
                    font-size:11px;color:#90b4e8;font-family:system-ui,sans-serif}
nav.toc .spl-credit a{color:#a8c8f0;text-decoration:none}
nav.toc .spl-credit a:hover{color:#fff;text-decoration:underline}
main{padding:48px 64px;max-width:860px}
h1.book-title{font-size:2rem;color:#1e3a5f;margin-bottom:32px}
section{margin-bottom:56px;border-top:1px solid #e0e0d8;padding-top:40px}
section:first-of-type{border-top:none;padding-top:0}
html{scroll-behavior:smooth}
@media(max-width:768px){.page{grid-template-columns:1fr}
nav.toc{position:relative;height:auto}}
</style>
</head>
<body>
<div class="page">
  <nav class="toc">
    <a href="{back_url}" class="back">← {domain_title}</a>
    <h2>Contents</h2>
    {toc}
    <div class="spl-credit">Generated by <a href="https://github.com/digital-duck/SPL.py" target="_blank">SPL</a></div>
  </nav>
  <main>
    <h1 class="book-title">{target_title}</h1>
    {sections}
  </main>
</div>
</body>
</html>"""
