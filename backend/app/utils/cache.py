"""
RaceCast Cache Layer
--------------------
Redis-backed cache with in-memory L1 fallback.

Architecture:
  L1 — in-process LRU (instant, no network hop, limited size)
  L2 — Redis (shared across workers, survives restarts)

Usage:
    from app.utils.cache import cache

    # Decorator
    @cache.cached("races:{season}", ttl=300)
    async def get_races(season: int): ...

    # Manual
    await cache.get("key")
    await cache.set("key", value, ttl=60)
    await cache.delete("key")
    await cache.invalidate_pattern("races:*")
"""
import json
import time
import hashlib
import asyncio
import functools
from typing import Any, Optional, Callable
from collections import OrderedDict

try:
    import redis.asyncio as aioredis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

from app.utils.config import settings


# ── TTL constants (seconds) ───────────────────────────────────────────
class TTL:
    RACE_LIST      = 3600    # races don't change — 1 hour
    SESSION_LIST   = 1800    # session metadata — 30 min
    DRIVER_LIST    = 3600    # driver roster — 1 hour
    TELEMETRY      = 600     # telemetry is large, cache 10 min
    LAP_DATA       = 600     # lap times — 10 min
    EVENTS         = 300     # race events — 5 min
    WEATHER        = 120     # weather changes — 2 min
    LEADERBOARD    = 30      # live standings — 30 sec
    API_KEY_LOOKUP = 300     # key tier lookup — 5 min


# ── L1 in-memory LRU cache ────────────────────────────────────────────
class LRUCache:
    """Simple in-process LRU cache with TTL."""

    def __init__(self, max_size: int = 512):
        self._store: OrderedDict[str, tuple[Any, float]] = OrderedDict()
        self._max_size = max_size
        self._hits = 0
        self._misses = 0

    def get(self, key: str) -> Optional[Any]:
        if key not in self._store:
            self._misses += 1
            return None
        value, expires_at = self._store[key]
        if time.time() > expires_at:
            del self._store[key]
            self._misses += 1
            return None
        self._store.move_to_end(key)
        self._hits += 1
        return value

    def set(self, key: str, value: Any, ttl: int):
        if key in self._store:
            self._store.move_to_end(key)
        self._store[key] = (value, time.time() + ttl)
        if len(self._store) > self._max_size:
            self._store.popitem(last=False)  # evict LRU

    def delete(self, key: str):
        self._store.pop(key, None)

    def invalidate_pattern(self, pattern: str):
        prefix = pattern.rstrip("*")
        keys = [k for k in self._store if k.startswith(prefix)]
        for k in keys:
            del self._store[k]

    def stats(self) -> dict:
        total = self._hits + self._misses
        return {
            "size": len(self._store),
            "max_size": self._max_size,
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate": round(self._hits / total, 3) if total else 0,
        }


# ── Cache manager ─────────────────────────────────────────────────────
class CacheManager:
    PREFIX = "racecast:cache:"

    def __init__(self):
        self._l1 = LRUCache(max_size=512)
        self._redis: Optional[Any] = None
        self._redis_ok = False

    async def _get_redis(self):
        if self._redis is None and REDIS_AVAILABLE:
            try:
                self._redis = aioredis.from_url(
                    settings.REDIS_URL,
                    decode_responses=True,
                    socket_connect_timeout=2,
                    socket_timeout=2,
                )
                await self._redis.ping()
                self._redis_ok = True
            except Exception:
                self._redis = None
                self._redis_ok = False
        return self._redis if self._redis_ok else None

    def _rkey(self, key: str) -> str:
        return f"{self.PREFIX}{key}"

    async def get(self, key: str) -> Optional[Any]:
        # L1 first
        val = self._l1.get(key)
        if val is not None:
            return val

        # L2 Redis
        redis = await self._get_redis()
        if redis:
            try:
                raw = await redis.get(self._rkey(key))
                if raw:
                    val = json.loads(raw)
                    # Promote to L1 with short TTL (avoid stampede)
                    self._l1.set(key, val, ttl=30)
                    return val
            except Exception:
                pass

        return None

    async def set(self, key: str, value: Any, ttl: int = 60):
        # Write to L1
        self._l1.set(key, value, ttl=min(ttl, 60))

        # Write to L2
        redis = await self._get_redis()
        if redis:
            try:
                await redis.setex(self._rkey(key), ttl, json.dumps(value, default=str))
            except Exception:
                pass

    async def delete(self, key: str):
        self._l1.delete(key)
        redis = await self._get_redis()
        if redis:
            try:
                await redis.delete(self._rkey(key))
            except Exception:
                pass

    async def invalidate_pattern(self, pattern: str):
        """Delete all keys matching pattern (e.g. 'races:*')."""
        self._l1.invalidate_pattern(pattern)
        redis = await self._get_redis()
        if redis:
            try:
                full_pattern = self._rkey(pattern)
                cursor = 0
                while True:
                    cursor, keys = await redis.scan(cursor, match=full_pattern, count=100)
                    if keys:
                        await redis.delete(*keys)
                    if cursor == 0:
                        break
            except Exception:
                pass

    async def get_or_set(self, key: str, factory: Callable, ttl: int = 60) -> Any:
        """Cache-aside: return cached value or call factory and cache result."""
        val = await self.get(key)
        if val is not None:
            return val
        val = await factory()
        if val is not None:
            await self.set(key, val, ttl=ttl)
        return val

    def cached(self, key_template: str, ttl: int = 60):
        """
        Decorator for caching async functions.

        @cache.cached("races:{season}", ttl=300)
        async def get_races(season: int): ...
        """
        def decorator(func: Callable):
            @functools.wraps(func)
            async def wrapper(*args, **kwargs):
                # Build cache key from template + args
                sig = func.__code__.co_varnames[:func.__code__.co_argcount]
                bound = dict(zip(sig, args))
                bound.update(kwargs)
                try:
                    key = key_template.format(**bound)
                except (KeyError, IndexError):
                    key = key_template + ":" + hashlib.md5(
                        json.dumps([args, kwargs], default=str).encode()
                    ).hexdigest()[:8]

                cached_val = await self.get(key)
                if cached_val is not None:
                    return cached_val

                result = await func(*args, **kwargs)
                if result is not None:
                    await self.set(key, result, ttl=ttl)
                return result
            return wrapper
        return decorator

    async def stats(self) -> dict:
        redis = await self._get_redis()
        redis_info = {}
        if redis:
            try:
                info = await redis.info("memory")
                redis_info = {
                    "used_memory_human": info.get("used_memory_human"),
                    "connected": True,
                }
            except Exception:
                redis_info = {"connected": False}
        else:
            redis_info = {"connected": False, "reason": "unavailable"}

        return {
            "l1": self._l1.stats(),
            "l2_redis": redis_info,
        }


# Singleton
cache = CacheManager()
