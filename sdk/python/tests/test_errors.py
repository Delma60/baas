# sdk/python/tests/test_errors.py
import pytest
from baas.utils.errors import BaasError, _status_to_code, _status_to_message


def test_baas_error_basic():
    err = BaasError(code="NOT_FOUND", message="Resource not found")
    assert err.code == "NOT_FOUND"
    assert err.message == "Resource not found"
    assert err.details == {}
    assert err.status is None
    assert str(err) == "Resource not found"


def test_baas_error_with_details():
    err = BaasError(
        code="VALIDATION_ERROR",
        message="Invalid input",
        details={"field": "email", "issue": "required"},
        status=422,
    )
    assert err.details == {"field": "email", "issue": "required"}
    assert err.status == 422


def test_baas_error_repr():
    err = BaasError(code="FORBIDDEN", message="Not allowed", status=403)
    assert "FORBIDDEN" in repr(err)
    assert "403" in repr(err)


def test_from_status_with_body():
    body = {"error": {"code": "CUSTOM_CODE", "message": "Custom message", "details": {"x": 1}}}
    err = BaasError.from_status(403, body)
    assert err.code == "CUSTOM_CODE"
    assert err.message == "Custom message"
    assert err.details == {"x": 1}
    assert err.status == 403


def test_from_status_without_body():
    err = BaasError.from_status(404)
    assert err.code == "NOT_FOUND"
    assert "not found" in err.message.lower()
    assert err.status == 404


def test_from_status_empty_body():
    err = BaasError.from_status(500, {})
    assert err.code == "INTERNAL_ERROR"
    assert err.status == 500


@pytest.mark.parametrize("status,expected_code", [
    (400, "BAD_REQUEST"),
    (401, "UNAUTHORIZED"),
    (403, "FORBIDDEN"),
    (404, "NOT_FOUND"),
    (409, "CONFLICT"),
    (422, "UNPROCESSABLE"),
    (429, "RATE_LIMITED"),
    (500, "INTERNAL_ERROR"),
    (502, "BAD_GATEWAY"),
    (503, "SERVICE_UNAVAILABLE"),
    (418, "UNKNOWN_ERROR"),  # I'm a teapot → unknown
])
def test_status_to_code(status, expected_code):
    assert _status_to_code(status) == expected_code


def test_baas_error_is_exception():
    err = BaasError(code="TEST", message="test error")
    with pytest.raises(BaasError) as exc_info:
        raise err
    assert exc_info.value.code == "TEST"


def test_from_status_partial_error_body():
    # Body has error key but no code/message
    body = {"error": {}}
    err = BaasError.from_status(401, body)
    assert err.code == "UNAUTHORIZED"
    assert err.status == 401
