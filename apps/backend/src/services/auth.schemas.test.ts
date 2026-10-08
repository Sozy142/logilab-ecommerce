import test from "node:test"
import assert from "node:assert/strict"

process.env.CORS_ORIGIN = "http://localhost";
process.env.DATABASE_URL = "postgres://test:test@localhost:5432/test";
process.env.JWT_SECRET = "unit-test-secret";
process.env.MEDIA_BUCKET_NAME = "unit-test-bucket";

const { signupSchema } = await import("./auth.service.js");

test("từ chối đăng ký mật khẩu ngắn hơn 6 ký tự", () => {
    const result = signupSchema.safeParse({
        email: "user@example.com",
        password: "12345",
    });

    assert.equal(result.success, false);
});

