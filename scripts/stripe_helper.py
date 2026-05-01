#!/usr/bin/env python3
"""Stripe helper - creates checkout sessions and reads status via emergentintegrations.
Reads JSON from stdin: {action, ...params}
Actions:
  create_session: {amount, currency, success_url, cancel_url, metadata, host_url}
  get_status: {session_id, host_url}
  handle_webhook: {body_b64, signature, host_url}
"""
import sys
import json
import os
import base64
import asyncio
from dotenv import load_dotenv

load_dotenv('/app/.env')

from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionRequest
)

API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')


async def run(payload):
    action = payload.get('action')
    host_url = payload.get('host_url') or 'http://localhost:3000'
    webhook_url = f"{host_url.rstrip('/')}/api/webhook/stripe"
    sc = StripeCheckout(api_key=API_KEY, webhook_url=webhook_url)

    if action == 'create_session':
        req = CheckoutSessionRequest(
            amount=float(payload['amount']),
            currency=payload.get('currency', 'usd'),
            success_url=payload['success_url'],
            cancel_url=payload['cancel_url'],
            metadata=payload.get('metadata') or {},
        )
        session = await sc.create_checkout_session(req)
        return {'ok': True, 'url': session.url, 'session_id': session.session_id}

    if action == 'get_status':
        st = await sc.get_checkout_status(payload['session_id'])
        # Convert metadata to dict if it's a StripeObject
        metadata = st.metadata
        if metadata and hasattr(metadata, 'to_dict'):
            metadata = metadata.to_dict()
        elif metadata and not isinstance(metadata, dict):
            metadata = dict(metadata) if metadata else {}
        return {
            'ok': True,
            'status': st.status,
            'payment_status': st.payment_status,
            'amount_total': st.amount_total,
            'currency': st.currency,
            'metadata': metadata or {},
        }

    if action == 'handle_webhook':
        body = base64.b64decode(payload['body_b64'])
        sig = payload.get('signature') or ''
        wh = await sc.handle_webhook(body, sig)
        return {
            'ok': True,
            'event_type': wh.event_type,
            'event_id': wh.event_id,
            'session_id': wh.session_id,
            'payment_status': wh.payment_status,
            'metadata': wh.metadata or {},
        }

    return {'ok': False, 'error': f'Unknown action: {action}'}


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
