import { z } from "zod";
import * as ordersRepo from "../repositories/orders.repository.js";
import { badRequest, conflict } from "../lib/app-error.js";

export const checkoutSchema = z.object({
  items: z
    .array(z.object({ variantId: z.string().uuid(), quantity: z.number().int().positive() }))
    .min(1, "Giỏ hàng trống"),
  shippingAddress: z.string().min(1),
  phone: z.string().min(8),
});

export async function checkout(customerId: string, input: z.infer<typeof checkoutSchema>) {
  try {
    const order = await ordersRepo.createOrder(
      customerId,
      input.shippingAddress,
      input.phone,
      input.items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity }))
    );
    return order;
  } catch (err) {
    // Lỗi RAISE EXCEPTION trong create_order() được pg bọc thành DatabaseError
    // (instanceof Error), message chính là text sau RAISE EXCEPTION.
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("insufficient_stock")) throw conflict("Một số sản phẩm trong giỏ đã hết hàng, vui lòng kiểm tra lại giỏ hàng");
    if (message.includes("variant_not_found")) throw badRequest("Sản phẩm không còn tồn tại");
    if (message.includes("empty_cart") || message.includes("invalid_quantity")) throw badRequest("Giỏ hàng không hợp lệ");
    throw err;
  }
}
