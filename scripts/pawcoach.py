#!/usr/bin/env python3
"""PawCoach AI helper - bridges Next.js to emergentintegrations Gemini.
Reads JSON from stdin, returns JSON to stdout.
Input: { mode: 'plan' | 'chat' | 'feedback', system: str, prompt: str, history: [{role, content}], session_id: str }
Output: { ok: true, text: str } or { ok: false, error: str }
"""
import sys
import json
import os
import asyncio
from dotenv import load_dotenv

load_dotenv('/app/.env')

from emergentintegrations.llm.chat import LlmChat, UserMessage

API_KEY = os.environ.get('EMERGENT_LLM_KEY', 'sk-emergent-4C3372cAf0e57C9E60')
MODEL_PROVIDER = 'gemini'
MODEL_NAME = 'gemini-2.5-pro'


async def run(payload):
    mode = payload.get('mode', 'chat')
    system = payload.get('system', 'You are PawCoach, an expert dog trainer and canine nutritionist.')
    prompt = payload.get('prompt', '')
    history = payload.get('history', [])
    session_id = payload.get('session_id', 'default')

    # Build chat
    chat = LlmChat(
        api_key=API_KEY,
        session_id=session_id,
        system_message=system,
    ).with_model(MODEL_PROVIDER, MODEL_NAME)

    # Since chat history isn't persisted across script runs, embed prior history in the user prompt.
    full_prompt = ''
    if history:
        full_prompt += 'Prior conversation context:\n'
        for m in history:
            r = m.get('role', 'user')
            c = m.get('content', '')
            label = 'User' if r == 'user' else 'PawCoach'
            full_prompt += f'{label}: {c}\n'
        full_prompt += '\n---\nCurrent message:\n'
    full_prompt += prompt

    user_msg = UserMessage(text=full_prompt)
    response = await chat.send_message(user_msg)
    return {'ok': True, 'text': str(response)}


def main():
    try:
        raw = sys.stdin.read()
        payload = json.loads(raw) if raw.strip() else {}
        result = asyncio.run(run(payload))
        sys.stdout.write(json.dumps(result))
    except Exception as e:
        sys.stdout.write(json.dumps({'ok': False, 'error': str(e)}))


if __name__ == '__main__':
    main()
