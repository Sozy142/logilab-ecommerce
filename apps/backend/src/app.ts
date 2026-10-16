import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { env } from "./lib/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { authRouter } from "./routes/auth.routes.js";
import { categoriesRouter } from "./routes/categories.routes.js";
import { productsRouter } from "./routes/products.routes.js";
import { searchRouter } from "./routes/search.routes.js";
import { blogRouter } from "./routes/blog.routes.js";
import { heroBannersRouter } from "./routes/hero-banners.routes.js";
import { checkoutRouter } from "./routes/checkout.routes.js";
import { ordersRouter } from "./routes/orders.routes.js";
import { addressesRouter } from "./routes/addresses.routes.js";
import { adminProductsRouter } from "./routes/admin-products.routes.js";
import { adminCategoriesRouter } from "./routes/admin-categories.routes.js";
import { adminBlogRouter } from "./routes/admin-blog.routes.js";
import { adminOrdersRouter } from "./routes/admin-orders.routes.js";
import { adminUsersRouter } from "./routes/admin-users.routes.js";
import { adminHeroBannersRouter } from "./routes/admin-hero-banners.routes.js";
import { adminUploadsRouter } from "./routes/admin-uploads.routes.js";

export const app = express();

// In production, Caddy reverse-proxies from the same host (network_mode:
// host) — trust X-Forwarded-For only from loopback so req.ip reflects the
// real client (needed for rate limiting below), without trusting arbitrary
// forwarded headers from elsewhere.
app.set("trust proxy", 2);

// JSON API only, never serves HTML — cross-origin-resource-policy default
// would otherwise block the frontend (different origin in local dev) from
// fetching it.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: env.corsOrigins, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRouter);
app.use("/categories", categoriesRouter);
app.use("/products", productsRouter);
app.use("/search", searchRouter);
app.use("/blog", blogRouter);
app.use("/hero-banners", heroBannersRouter);
app.use("/checkout", checkoutRouter);
app.use("/orders", ordersRouter);
app.use("/addresses", addressesRouter);

app.use("/admin/products", adminProductsRouter);
app.use("/admin/categories", adminCategoriesRouter);
app.use("/admin/blog", adminBlogRouter);
app.use("/admin/orders", adminOrdersRouter);
app.use("/admin/users", adminUsersRouter);
app.use("/admin/hero-banners", adminHeroBannersRouter);
app.use("/admin/uploads", adminUploadsRouter);

app.use(errorHandler);
