import asyncio

import pytest

from app.cache import TtlCache


class Clock:
    def __init__(self) -> None:
        self.now = 0.0

    def __call__(self) -> float:
        return self.now


def test_expires_after_ttl():
    clock = Clock()
    cache = TtlCache[int](ttl=10, clock=clock)
    calls = 0

    async def load() -> int:
        nonlocal calls
        calls += 1
        return calls

    async def run():
        assert await cache.get_or_load("k", load) == 1
        clock.now = 9.9
        assert await cache.get_or_load("k", load) == 1
        clock.now = 10.1
        assert await cache.get_or_load("k", load) == 2

    asyncio.run(run())


def test_concurrent_misses_share_one_load():
    cache = TtlCache[str](ttl=60)
    calls = 0

    async def load() -> str:
        nonlocal calls
        calls += 1
        await asyncio.sleep(0.01)
        return "epk"

    async def run():
        results = await asyncio.gather(*(cache.get_or_load("k", load) for _ in range(20)))
        assert results == ["epk"] * 20

    asyncio.run(run())
    assert calls == 1


def test_failures_reach_every_waiter_and_are_not_cached():
    cache = TtlCache[str](ttl=60)

    async def boom() -> str:
        await asyncio.sleep(0.01)
        raise RuntimeError("crm down")

    async def ok() -> str:
        return "epk"

    async def run():
        results = await asyncio.gather(*(cache.get_or_load("k", boom) for _ in range(3)), return_exceptions=True)
        assert all(isinstance(r, RuntimeError) for r in results)
        assert await cache.get_or_load("k", ok) == "epk"

    asyncio.run(run())
