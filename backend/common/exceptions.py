import logging

from rest_framework.views import exception_handler
from rest_framework.response import Response

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Normalizes every DRF error into a single shape: {"detail": ..., "errors": {...}}
    so the frontend never needs to special-case validation errors vs. auth errors
    vs. 500s - one error-parsing utility handles all of them.
    """
    response = exception_handler(exc, context)
    if response is not None:
        if isinstance(response.data, dict) and "detail" not in response.data:
            response.data = {
                "detail": "Validation failed.",
                "errors": response.data,
            }
        elif isinstance(response.data, list):
            response.data = {"detail": " ".join(str(e) for e in response.data), "errors": {}}
        return response

    # DRF didn't recognize this exception, which means it's an unhandled
    # server-side bug. Log the full traceback before returning the generic
    # response, otherwise the real cause vanishes with no trace anywhere.
    logger.exception("Unhandled exception in %s", context.get("view"), exc_info=exc)
    return Response({"detail": "Internal server error.", "errors": {}}, status=500)
