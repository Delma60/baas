# backend/app/api/superadmin/router.py
from fastapi import APIRouter

from app.api.superadmin.users import router as users_router
from app.api.superadmin.organizations import router as orgs_router
from app.api.superadmin.projects import router as projects_router
from app.api.superadmin.billing import router as billing_router
from app.api.superadmin.staff import router as staff_router
from backend.app.api.superadmin._audit import router as audit_router
from app.api.superadmin.flags import router as flags_router

router = APIRouter(tags=["Superadmin"])

router.include_router(users_router)
router.include_router(orgs_router)
router.include_router(projects_router)
router.include_router(billing_router)
router.include_router(staff_router)
router.include_router(audit_router)
router.include_router(flags_router)


# ─── Platform metrics (ops+) ──────────────────────────────────────────────────
from fastapi import Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any

from app.db.postgres import get_db
from app.middleware.staff_auth import StaffRole, require_staff_role
from app.models.staff import StaffContext


@router.get("/metrics")
async def platform_metrics(
    staff: StaffContext = Depends(require_staff_role(StaffRole.ops)),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Platform-wide aggregate metrics."""
    result = await db.execute(text("""
        SELECT
          (SELECT COUNT(*) FROM users)                                       AS total_users,
          (SELECT COUNT(*) FROM organizations)                               AS total_organizations,
          (SELECT COUNT(*) FROM projects)                                    AS total_projects,
          (SELECT COUNT(*) FROM projects WHERE status = 'active')            AS active_projects,
          (SELECT COALESCE(SUM(amount_ngn), 0) FROM invoices
             WHERE created_at >= NOW() - INTERVAL '30 days')                 AS monthly_revenue_ngn,
          (SELECT COALESCE(SUM(amount_usd), 0) FROM invoices
             WHERE created_at >= NOW() - INTERVAL '30 days')                 AS monthly_revenue_usd
    """))
    row = result.mappings().first()
    return {"data": dict(row) if row else {}}