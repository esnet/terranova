from contextvars import ContextVar

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request

# this middleware is cribbed from
# https://github.com/encode/starlette/issues/420
# the intention here is to have a "global" that we can import
# to introspect the in-progress request, local to the current asyncio
# Task/Thread/Greenlet (your conceptualization may vary)
# this is intended as a facility to see the
# ?request=parameters at any point during execution.
# this feature is used in the implementation
# of templatized dataset variables, where we will need access
# to the GET query string during execution.

REQUEST = "request"

_request_ctx_var: ContextVar[str] = ContextVar(REQUEST, default=None)


def get_request() -> str:
    return _request_ctx_var.get()


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint):
        prev_value = _request_ctx_var.set(request)

        response = await call_next(request)

        _request_ctx_var.reset(prev_value)

        return response
