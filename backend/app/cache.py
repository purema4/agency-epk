import asyncio
import time
from collections.abc import Awaitable, Callable
from typing import Generic, TypeVar

T = TypeVar("T")


class TtlCache(Generic[T]):
    """Keeps successful results for `ttl` seconds. Concurrent misses for the same key share
    one in-flight call, so a burst of visitors triggers a single CRM request."""

    def __init__(self, ttl: float, clock: Callable[[], float] = time.monotonic) -> None:
        self._ttl = ttl
        self._clock = clock
        self._values: dict[str, tuple[float, T]] = {}
        self._inflight: dict[str, asyncio.Future[T]] = {}

    async def get_or_load(self, key: str, load: Callable[[], Awaitable[T]]) -> T:
        hit = self._values.get(key)
        if hit and hit[0] > self._clock():
            return hit[1]
        if key in self._inflight:
            return await asyncio.shield(self._inflight[key])

        future: asyncio.Future[T] = asyncio.get_running_loop().create_future()
        self._inflight[key] = future
        try:
            value = await load()
        except BaseException as exc:  # errors are not cached; waiters get the same error
            future.set_exception(exc)
            future.exception()  # mark retrieved so an unawaited future doesn't warn
            raise
        else:
            self._values[key] = (self._clock() + self._ttl, value)
            future.set_result(value)
            return value
        finally:
            del self._inflight[key]

    def clear(self) -> None:
        self._values.clear()
