import asyncio

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from api.config import settings

router = APIRouter()


class ChatMessage(BaseModel):
    role: str  # 'user' | 'assistant'
    text: str


class ChatRequest(BaseModel):
    message: str
    system: str = ""
    history: list[ChatMessage] = []


@router.post("/api/chat")
async def chat(req: ChatRequest):
    parts_list = []
    if req.system:
        parts_list.append(req.system.strip())
    for h in req.history[-6:]:  # cap context to last 6 turns
        prefix = "User" if h.role == "user" else "Assistant"
        parts_list.append(f"{prefix}: {h.text}")
    parts_list.append(f"User: {req.message}")
    prompt = "\n\n".join(parts_list)

    adapter_name, model = _parse_llm(settings.llm)
    try:
        if adapter_name == "claude_cli":
            return await _call_claude_cli(prompt, model)
        else:
            return await _call_via_spl(prompt, adapter_name, model)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


def _parse_llm(llm_spec: str) -> tuple[str, str | None]:
    if ":" in llm_spec:
        adapter, model = llm_spec.split(":", 1)
        return adapter, model or None
    return llm_spec, None


async def _call_claude_cli(prompt: str, model: str | None) -> dict:
    cmd = ["claude", "-p"]
    if model:
        cmd += ["--model", model]
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    try:
        stdout, stderr = await asyncio.wait_for(
            proc.communicate(input=prompt.encode()), timeout=120
        )
    except asyncio.TimeoutError:
        proc.kill()
        raise RuntimeError("LLM call timed out after 120s")
    if proc.returncode != 0:
        err = stderr.decode().strip()
        raise RuntimeError(err or f"claude CLI exited with code {proc.returncode}")
    output = stdout.decode().strip()
    if not output:
        raise RuntimeError("claude CLI returned empty output")
    return {"response": output}


async def _call_via_spl(prompt: str, adapter_name: str, model: str | None) -> dict:
    from spl3.adapters import get_adapter
    kwargs = {"model": model} if model else {}
    adapter = get_adapter(adapter_name, **kwargs)
    result = adapter.generate(prompt, max_tokens=2000)
    if asyncio.iscoroutine(result):
        result = await result
    return {"response": result}
