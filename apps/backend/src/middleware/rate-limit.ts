import rateLimit from "express-rate-limit";

// Keyed by req.ip, which only reflects the real client address if
// `app.set("trust proxy", ...)` is configured — see app.ts.

// Stricter: login is the actual brute-force target (existing accounts,
// password guessing). 10 attempts / 15 min is generous enough for a
// legitimate user who mistypes a password a few times.
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Quá nhiều lần đăng nhập thất bại, thử lại sau ít phút." },
});

// Looser: signup abuse is spam-account creation rather than credential
// guessing, so a longer window with a moderate cap is enough.
export const signupRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Quá nhiều lần đăng ký, thử lại sau." },
});
