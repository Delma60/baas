# backend/app/api/internal/billing_browse.py
"""
Internal-only billing endpoints for the dashboard.
NOT exposed via /v1/ — only callable from Next.js with X-Internal-Secret.

Endpoints:
  GET    /billing/{org_id}/overview            — plan, usage, invoice history
  GET    /billing/{org_id}/subscription        — current subscription detail
  POST   /billing/{org_id}/checkout/initiate   — start Flutterwave hosted checkout
  POST   /billing/{org_id}/checkout/verify     — verify a completed Flutterwave tx
  POST   /billing/{org_id}/cancel              — cancel at period end
  GET    /billing/plans                        — plan limits catalogue
  GET    /billing/usage/{project_id}           — per-project usage (30d rolling)
  POST   /webhooks/flutterwave                 — Flutterwave webhook (internal route)
"""
import hashlib
import hmac
import json
import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from fastapi import APIRouter, Body, Depends, Header, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.postgres import get_db

router = APIRouter(tags=["Internal Billing"])
logger = logging.getLogger(__name__)


# ─── Auth guard ───────────────────────────────────────────────────────────────

async def require_internal(x_internal_secret: str = Header(...)) -> None:
    if x_internal_secret != settings.internal_api_secret:
        raise HTTPException(status_code=401, detail="Invalid internal secret")


InternalGuard = Depends(require_internal)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _serialize(row: dict) -> dict:
    r = dict(row)
    for f in ("created_at", "updated_at", "current_period_start", "current_period_end", "refreshed_at"):
        if r.get(f) and hasattr(r[f], "isoformat"):
            r[f] = r[f].isoformat()
    return r


async def _get_or_create_subscription(db: AsyncSession, org_id: str) -> dict:
    result = await db.execute(
        text("SELECT * FROM subscriptions WHERE organization_id = :org_id"),
        {"org_id": org_id},
    )
    row = result.mappings().first()
    if row:
        return _serialize(dict(row))

    # Create free subscription
    sub_id = str(uuid.uuid4())
    await db.execute(
        text("""
            INSERT INTO subscriptions (id, organization_id, plan, status, currency)
            VALUES (:id, :org_id, 'free', 'active', 'NGN')
            ON CONFLICT (organization_id) DO NOTHING
        """),
        {"id": sub_id, "org_id": org_id},
    )
    await db.commit()
    result2 = await db.execute(
        text("SELECT * FROM subscriptions WHERE organization_id = :org_id"),
        {"org_id": org_id},
    )
    row2 = result2.mappings().first()
    return _serialize(dict(row2)) if row2 else {"plan": "free", "status": "active"}


# ─── Plans catalogue ──────────────────────────────────────────────────────────

@router.get("/billing/plans", dependencies=[InternalGuard])
async def list_plans(db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    """Return all plan limits from the plan_limits table."""
    try:
        result = await db.execute(text("SELECT * FROM plan_limits ORDER BY price_ngn ASC"))
        plans = [dict(r) for r in result.mappings()]
        return {"data": plans}
    except Exception as e:
        logger.warning("plan_limits table not yet migrated: %s", e)
        # Fallback hardcoded
        return {
            "data": [
                {"plan": "free", "sql_rows": 50000, "nosql_docs": 50000, "storage_bytes": 1073741824, "function_calls": 100000, "ai_requests": 500, "api_calls_per_min": 60, "team_members": 1, "price_ngn": 0, "price_usd": 0},
                {"plan": "starter", "sql_rows": 500000, "nosql_docs": 500000, "storage_bytes": 10737418240, "function_calls": 1000000, "ai_requests": 5000, "api_calls_per_min": 300, "team_members": 3, "price_ngn": 15000, "price_usd": 10},
                {"plan": "pro", "sql_rows": None, "nosql_docs": None, "storage_bytes": 107374182400, "function_calls": None, "ai_requests": None, "api_calls_per_min": 1000, "team_members": 10, "price_ngn": 45000, "price_usd": 30},
            ]
        }


# ─── Billing overview ─────────────────────────────────────────────────────────

@router.get("/billing/{org_id}/overview", dependencies=[InternalGuard])
async def billing_overview(org_id: str, db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    """Return plan, subscription, invoices summary, and project usage totals."""
    # Subscription
    subscription = await _get_or_create_subscription(db, org_id)

    # Invoices (last 12)
    invoices_result = await db.execute(
        text("""
            SELECT id, amount_ngn, amount_usd, status, payment_ref,
                   period_start, period_end, created_at
            FROM invoices
            WHERE organization_id = :org_id
            ORDER BY created_at DESC
            LIMIT 12
        """),
        {"org_id": org_id},
    )
    invoices = [_serialize(dict(r)) for r in invoices_result.mappings()]

    # Org plan
    org_result = await db.execute(
        text("SELECT plan FROM organizations WHERE id = :org_id"),
        {"org_id": org_id},
    )
    org_row = org_result.mappings().first()
    plan = org_row["plan"] if org_row else "free"

    # Aggregate usage across all org projects (30d)
    usage_result = await db.execute(
        text("""
            SELECT
                COALESCE(SUM(value) FILTER (WHERE metric = 'db_reads'),      0) AS db_reads,
                COALESCE(SUM(value) FILTER (WHERE metric = 'db_writes'),     0) AS db_writes,
                COALESCE(SUM(value) FILTER (WHERE metric = 'nosql_reads'),   0) AS nosql_reads,
                COALESCE(SUM(value) FILTER (WHERE metric = 'nosql_writes'),  0) AS nosql_writes,
                COALESCE(SUM(value) FILTER (WHERE metric = 'storage_bytes'), 0) AS storage_bytes,
                COALESCE(SUM(value) FILTER (WHERE metric = 'function_calls'),0) AS function_calls,
                COALESCE(SUM(value) FILTER (WHERE metric = 'ai_requests'),   0) AS ai_requests
            FROM usage_records ur
            JOIN projects p ON p.id = ur.project_id
            JOIN organizations o ON o.id = p.organization_id
            WHERE o.id = :org_id
              AND ur.period_start >= NOW() - INTERVAL '30 days'
        """),
        {"org_id": org_id},
    )
    usage_row = usage_result.mappings().first()
    usage = dict(usage_row) if usage_row else {}

    return {
        "data": {
            "plan": plan,
            "subscription": subscription,
            "invoices": invoices,
            "usage": {k: int(v) for k, v in usage.items()},
        }
    }


# ─── Per-project usage ────────────────────────────────────────────────────────

@router.get("/billing/usage/{project_id}", dependencies=[InternalGuard])
async def project_usage(project_id: str, db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    """30-day rolling usage for a single project."""
    result = await db.execute(
        text("""
            SELECT metric, SUM(value)::bigint AS total
            FROM usage_records
            WHERE project_id = :project_id
              AND period_start >= NOW() - INTERVAL '30 days'
            GROUP BY metric
        """),
        {"project_id": project_id},
    )
    rows = {r["metric"]: int(r["total"]) for r in result.mappings()}

    # Also return plan limits for the project's org
    limits_result = await db.execute(
        text("""
            SELECT pl.*
            FROM plan_limits pl
            JOIN organizations o ON o.plan = pl.plan
            JOIN projects p ON p.organization_id = o.id
            WHERE p.id = :project_id
        """),
        {"project_id": project_id},
    )
    limits_row = limits_result.mappings().first()
    limits = dict(limits_row) if limits_row else {}

    return {"data": {"usage": rows, "limits": limits}}


# ─── Subscription detail ──────────────────────────────────────────────────────

@router.get("/billing/{org_id}/subscription", dependencies=[InternalGuard])
async def get_subscription(org_id: str, db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    sub = await _get_or_create_subscription(db, org_id)
    return {"data": sub}


# ─── Flutterwave checkout initiation ─────────────────────────────────────────

class CheckoutInitiateRequest(BaseModel):
    plan: str = Field(pattern="^(starter|pro)$")
    user_email: str
    user_name: str
    currency: str = "NGN"
    redirect_url: str


@router.post("/billing/{org_id}/checkout/initiate", dependencies=[InternalGuard])
async def initiate_checkout(
    org_id: str,
    body: CheckoutInitiateRequest,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """
    Generate a Flutterwave hosted payment link for a plan upgrade.
    Returns a checkout URL — the browser redirects the user there.
    """
    if not settings.flutterwave_secret_key:
        raise HTTPException(status_code=503, detail="Payment provider not configured")

    # Fetch plan price
    plan_result = await db.execute(
        text("SELECT price_ngn, price_usd FROM plan_limits WHERE plan = :plan"),
        {"plan": body.plan},
    )
    plan_row = plan_result.mappings().first()
    if not plan_row:
        raise HTTPException(status_code=400, detail="Unknown plan")

    amount = float(plan_row["price_ngn"]) if body.currency == "NGN" else float(plan_row["price_usd"])
    tx_ref = f"baas_{org_id}_{body.plan}_{uuid.uuid4().hex[:8]}"

    payload = {
        "tx_ref": tx_ref,
        "amount": amount,
        "currency": body.currency,
        "redirect_url": body.redirect_url,
        "customer": {
            "email": body.user_email,
            "name": body.user_name,
        },
        "customizations": {
            "title": "YourBaaS",
            "description": f"Upgrade to {body.plan.title()} plan",
            "logo": "https://yourbaas.com/logo.png",
        },
        "meta": {
            "org_id": org_id,
            "plan": body.plan,
        },
        "payment_options": "card,ussd,banktransfer",
    }

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                "https://api.flutterwave.com/v3/payments",
                headers={
                    "Authorization": f"Bearer {settings.flutterwave_secret_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            data = resp.json()
    except Exception as e:
        logger.error("Flutterwave checkout initiation failed: %s", e)
        raise HTTPException(status_code=502, detail="Payment provider unreachable")

    if data.get("status") != "success":
        logger.error("Flutterwave error: %s", data)
        raise HTTPException(status_code=400, detail=data.get("message", "Checkout failed"))

    checkout_url = data["data"]["link"]

    # Record the pending tx_ref so we can verify it on return
    await db.execute(
        text("""
            INSERT INTO billing_events (id, organization_id, event_type, flw_tx_ref, amount, currency, status)
            VALUES (:id, :org_id, 'checkout.initiated', :tx_ref, :amount, :currency, 'pending')
        """),
        {
            "id": str(uuid.uuid4()),
            "org_id": org_id,
            "tx_ref": tx_ref,
            "amount": amount,
            "currency": body.currency,
        },
    )
    await db.commit()

    return {"data": {"checkout_url": checkout_url, "tx_ref": tx_ref}}


# ─── Verify a completed transaction ──────────────────────────────────────────

class VerifyRequest(BaseModel):
    tx_ref: str
    transaction_id: str  # Flutterwave numeric tx id


@router.post("/billing/{org_id}/checkout/verify", dependencies=[InternalGuard])
async def verify_checkout(
    org_id: str,
    body: VerifyRequest,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """
    Called after Flutterwave redirects back.  Verifies the transaction,
    updates the subscription, and records an invoice.
    """
    if not settings.flutterwave_secret_key:
        raise HTTPException(status_code=503, detail="Payment provider not configured")

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(
                f"https://api.flutterwave.com/v3/transactions/{body.transaction_id}/verify",
                headers={"Authorization": f"Bearer {settings.flutterwave_secret_key}"},
            )
            data = resp.json()
    except Exception as e:
        logger.error("Flutterwave verify failed: %s", e)
        raise HTTPException(status_code=502, detail="Could not verify payment")

    tx = data.get("data", {})
    if data.get("status") != "success" or tx.get("status") != "successful":
        raise HTTPException(status_code=400, detail="Payment not successful")

    if tx.get("tx_ref") != body.tx_ref:
        raise HTTPException(status_code=400, detail="Transaction reference mismatch")

    # Parse plan from tx_ref: baas_{org_id}_{plan}_{random}
    parts = body.tx_ref.split("_")
    new_plan = parts[2] if len(parts) >= 3 else "starter"
    amount_ngn = float(tx.get("amount", 0)) if tx.get("currency") == "NGN" else 0
    amount_usd = float(tx.get("amount", 0)) if tx.get("currency") == "USD" else 0

    now = datetime.now(timezone.utc)
    period_end = now + timedelta(days=30)

    # Update org plan + subscription
    await db.execute(
        text("UPDATE organizations SET plan = :plan WHERE id = :org_id"),
        {"plan": new_plan, "org_id": org_id},
    )
    await db.execute(
        text("""
            INSERT INTO subscriptions
                (id, organization_id, plan, status, flw_tx_ref, current_period_start, current_period_end, amount_ngn, amount_usd)
            VALUES
                (:id, :org_id, :plan, 'active', :tx_ref, :period_start, :period_end, :amount_ngn, :amount_usd)
            ON CONFLICT (organization_id) DO UPDATE SET
                plan                 = EXCLUDED.plan,
                status               = 'active',
                flw_tx_ref           = EXCLUDED.flw_tx_ref,
                flw_tx_id            = :tx_id,
                current_period_start = EXCLUDED.current_period_start,
                current_period_end   = EXCLUDED.current_period_end,
                amount_ngn           = EXCLUDED.amount_ngn,
                amount_usd           = EXCLUDED.amount_usd,
                updated_at           = NOW()
        """),
        {
            "id": str(uuid.uuid4()),
            "org_id": org_id,
            "plan": new_plan,
            "tx_ref": body.tx_ref,
            "tx_id": str(body.transaction_id),
            "period_start": now,
            "period_end": period_end,
            "amount_ngn": amount_ngn,
            "amount_usd": amount_usd,
        },
    )

    # Create invoice
    invoice_id = str(uuid.uuid4())
    await db.execute(
        text("""
            INSERT INTO invoices
                (id, organization_id, amount_ngn, amount_usd, status, payment_ref, period_start, period_end)
            VALUES
                (:id, :org_id, :amount_ngn, :amount_usd, 'paid', :payment_ref, :period_start, :period_end)
        """),
        {
            "id": invoice_id,
            "org_id": org_id,
            "amount_ngn": amount_ngn,
            "amount_usd": amount_usd,
            "payment_ref": str(body.transaction_id),
            "period_start": now,
            "period_end": period_end,
        },
    )

    # Record billing event
    await db.execute(
        text("""
            INSERT INTO billing_events
                (id, organization_id, event_type, flw_tx_id, flw_tx_ref, amount, currency, status, payload)
            VALUES
                (:id, :org_id, 'charge.completed', :tx_id, :tx_ref, :amount, :currency, 'successful', :payload)
        """),
        {
            "id": str(uuid.uuid4()),
            "org_id": org_id,
            "tx_id": str(body.transaction_id),
            "tx_ref": body.tx_ref,
            "amount": float(tx.get("amount", 0)),
            "currency": tx.get("currency", "NGN"),
            "payload": json.dumps(tx),
        },
    )

    await db.commit()

    # Bust API key caches so plan limits take effect immediately
    try:
        from app.db.redis import get_redis
        redis = await get_redis()
        # Scan and delete cached API keys for all org projects
        result = await db.execute(
            text("SELECT id FROM projects p JOIN organizations o ON o.id = p.organization_id WHERE o.id = :org_id"),
            {"org_id": org_id},
        )
        for row in result:
            async for cache_key in redis.scan_iter(f"apikey:*"):
                cached = await redis.get(cache_key)
                if cached:
                    d = json.loads(cached)
                    if d.get("project_id") == row[0]:
                        await redis.delete(cache_key)
    except Exception as e:
        logger.warning("Failed to bust API key cache: %s", e)

    return {"data": {"verified": True, "plan": new_plan, "invoice_id": invoice_id}}


# ─── Cancel subscription ──────────────────────────────────────────────────────

@router.post("/billing/{org_id}/cancel", dependencies=[InternalGuard])
async def cancel_subscription(org_id: str, db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    """Mark subscription to cancel at period end (does not immediately downgrade)."""
    await db.execute(
        text("""
            UPDATE subscriptions
            SET cancel_at_period_end = true, updated_at = NOW()
            WHERE organization_id = :org_id
        """),
        {"org_id": org_id},
    )
    await db.commit()
    return {"data": {"cancel_at_period_end": True}}


# ─── Flutterwave webhook ──────────────────────────────────────────────────────
# Mounted at /internal/webhooks/flutterwave — protected by Flutterwave signature
# (not X-Internal-Secret, since Flutterwave calls it directly).
# In production, add this route to a separate public router; for now it lives
# here and is reachable via the internal router for simplicity during dev.

@router.post("/webhooks/flutterwave")
async def flutterwave_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
    verif_hash: str = Header(default="", alias="verif-hash"),
) -> dict[str, Any]:
    """
    Flutterwave sends a POST with verif-hash header equal to the
    secret hash configured in the Flutterwave dashboard.
    """
    if settings.flutterwave_webhook_hash and verif_hash != settings.flutterwave_webhook_hash:
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    body_bytes = await request.body()
    try:
        payload = json.loads(body_bytes)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    event = payload.get("event", "")
    data = payload.get("data", {})
    tx_ref = data.get("tx_ref", "")
    tx_id = str(data.get("id", ""))
    status = data.get("status", "")

    logger.info("Flutterwave webhook: event=%s tx_ref=%s status=%s", event, tx_ref, status)

    # Extract org_id from tx_ref: baas_{org_id}_{plan}_{random}
    parts = tx_ref.split("_") if tx_ref else []
    org_id = parts[1] if len(parts) >= 3 else None

    # Record event
    await db.execute(
        text("""
            INSERT INTO billing_events
                (id, organization_id, event_type, flw_tx_id, flw_tx_ref, amount, currency, status, payload)
            VALUES
                (:id, :org_id, :event_type, :tx_id, :tx_ref, :amount, :currency, :status, :payload)
        """),
        {
            "id": str(uuid.uuid4()),
            "org_id": org_id,
            "event_type": event,
            "tx_id": tx_id,
            "tx_ref": tx_ref,
            "amount": float(data.get("amount", 0)),
            "currency": data.get("currency", "NGN"),
            "status": status,
            "payload": json.dumps(payload),
        },
    )

    if event == "charge.completed" and status == "successful" and org_id:
        parts = tx_ref.split("_")
        new_plan = parts[2] if len(parts) >= 3 else "starter"
        amount_ngn = float(data.get("amount", 0)) if data.get("currency") == "NGN" else 0
        amount_usd = float(data.get("amount", 0)) if data.get("currency") == "USD" else 0
        now = datetime.now(timezone.utc)
        period_end = now + timedelta(days=30)

        await db.execute(
            text("UPDATE organizations SET plan = :plan WHERE id = :org_id"),
            {"plan": new_plan, "org_id": org_id},
        )
        await db.execute(
            text("""
                INSERT INTO subscriptions
                    (id, organization_id, plan, status, flw_tx_ref, flw_tx_id, current_period_start, current_period_end)
                VALUES
                    (:id, :org_id, :plan, 'active', :tx_ref, :tx_id, :period_start, :period_end)
                ON CONFLICT (organization_id) DO UPDATE SET
                    plan                 = EXCLUDED.plan,
                    status               = 'active',
                    flw_tx_ref           = EXCLUDED.flw_tx_ref,
                    flw_tx_id            = EXCLUDED.flw_tx_id,
                    current_period_start = EXCLUDED.current_period_start,
                    current_period_end   = EXCLUDED.current_period_end,
                    updated_at           = NOW()
            """),
            {
                "id": str(uuid.uuid4()),
                "org_id": org_id,
                "plan": new_plan,
                "tx_ref": tx_ref,
                "tx_id": tx_id,
                "period_start": now,
                "period_end": period_end,
            },
        )
        await db.execute(
            text("""
                INSERT INTO invoices
                    (id, organization_id, amount_ngn, amount_usd, status, payment_ref, period_start, period_end)
                VALUES
                    (:id, :org_id, :amount_ngn, :amount_usd, 'paid', :payment_ref, :period_start, :period_end)
                ON CONFLICT DO NOTHING
            """),
            {
                "id": str(uuid.uuid4()),
                "org_id": org_id,
                "amount_ngn": amount_ngn,
                "amount_usd": amount_usd,
                "payment_ref": tx_id,
                "period_start": now,
                "period_end": period_end,
            },
        )

    await db.commit()
    return {"status": "ok"}