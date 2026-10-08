import { z } from "zod";
import * as ordersRepo from "../repositories/orders.repository.js";
import { ORDER_STATUSES, PAGE_SIZE } from "../lib/constants.js";
import { notFound } from "../lib/app-error.js";

export async function listMyOrders(customerId: string) {
  return ordersRepo.listOrdersForCustomer(customerId);
}

export async function getMyOrderDetail(orderId: string, customerId: string) {
  const order = await ordersRepo.getOrderById(orderId, customerId);
  if (!order) throw notFound("Không tìm thấy đơn hàng");
  const items = await ordersRepo.getOrderItems(orderId);
  return { order, items };
}

// ---- Admin ----

export const orderStatusSchema = z.object({ status: z.enum(ORDER_STATUSES) });

function parsePage(page?: string): number {
  const n = page ? parseInt(page, 10) : 1;
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export async function listOrdersAdmin(status: string | undefined, page: string | undefined) {
  const parsedPage = parsePage(page);
  const { items, total } = await ordersRepo.listAllOrders({ status, page: parsedPage, pageSize: PAGE_SIZE });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return { orders: items, total, page: Math.min(parsedPage, totalPages), totalPages };
}

export async function getOrderDetailAdmin(orderId: string) {
  const order = await ordersRepo.getOrderByIdAdmin(orderId);
  if (!order) throw notFound("Không tìm thấy đơn hàng");
  const items = await ordersRepo.getOrderItems(orderId);
  return { order, items };
}

export async function updateOrderStatusAdmin(orderId: string, status: string) {
  const updated = await ordersRepo.updateOrderStatus(orderId, status);
  if (!updated) throw notFound("Không tìm thấy đơn hàng");
  return updated;
}
