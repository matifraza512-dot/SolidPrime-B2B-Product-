import threading

_thread_locals = threading.local()


class AuditRequestMiddleware:
    """Stashes the current request in thread-local storage so model signal
    handlers (see audit/signals.py) can attribute changes to the acting user
    and IP without every call site needing to pass `request` through."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _thread_locals.request = request
        try:
            return self.get_response(request)
        finally:
            _thread_locals.request = None


def get_current_request():
    return getattr(_thread_locals, "request", None)
