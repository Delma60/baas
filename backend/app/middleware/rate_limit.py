import logging
import time

from fastapi import HTTPException, Request

from app.db.redis import get_redis

logger = logging.getLogger(__name__)

# Limits per window
RATE_LIMITS: dict[str, tuple[int, int]] = {
    "anon": (100, 60),     # 100 req / 60s
    "service": (1000, 60), # 1000 req / 60s
    "default": (300, 60),  # 300 req / 60s
}


async def rate_limit(request: Request) -> None:
    """
    Sliding window rate limiter keyed by API key project + type.
    Raises 429 if limit exceeded.
    """
    project_id = getattr(request.state, "project_id", None)
    key_type = getattr(request.state, "key_type", "default")

    if not project_id:
        return  # Internal routes bypass rate limiting

    limit, window = RATE_LIMITS.get(key_type, RATE_LIMITS["default"])
    redis = await get_redis()

    now = time.time()
    window_start = now - window
    rate_key = f"ratelimit:{project_id}:{key_type}"

    pipe = redis.pipeline()
    pipe.zremrangebyscore(rate_key, 0, window_start)
    pipe.zadd(rate_key, {str(now): now})
    pipe.zcard(rate_key)
    pipe.expire(rate_key, window)
    results = await pipe.execute()

    count = results[2]
    if count > limit:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded",
            headers={
                "X-RateLimit-Limit": str(limit),
                "X-RateLimit-Remaining": "0",
                "Retry-After": str(window),
            },
        )

    request.state.rate_limit_remaining = max(0, limit - count)