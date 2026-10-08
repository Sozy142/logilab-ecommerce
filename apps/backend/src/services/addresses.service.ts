import { z } from "zod";
import * as repo from "../repositories/addresses.repository.js";
import { notFound } from "../lib/app-error.js";

export const addressSchema = z.object({
  recipientName: z.string().min(1),
  phone: z.string().min(8),
  addressLine: z.string().min(1),
  city: z.string().min(1),
  isDefault: z.boolean().optional(),
});

export const addressUpdateSchema = addressSchema.partial();

export async function list(customerId: string) {
  return repo.listAddresses(customerId);
}

export async function create(customerId: string, input: z.infer<typeof addressSchema>) {
  return repo.createAddress(customerId, input);
}

export async function update(id: string, customerId: string, input: z.infer<typeof addressUpdateSchema>) {
  const updated = await repo.updateAddress(id, customerId, input);
  if (!updated) throw notFound("Không tìm thấy địa chỉ");
  return updated;
}

export async function remove(id: string, customerId: string) {
  const ok = await repo.deleteAddress(id, customerId);
  if (!ok) throw notFound("Không tìm thấy địa chỉ");
}
