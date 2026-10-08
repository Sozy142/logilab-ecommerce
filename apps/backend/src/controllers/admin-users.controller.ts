import type { Request, Response } from "express";
import * as usersService from "../services/users.service.js";

export async function list(_req: Request, res: Response) {
  res.json({ users: await usersService.listUsersAdmin() });
}

export async function create(req: Request, res: Response) {
  const input = usersService.createStaffSchema.parse(req.body);
  res.status(201).json(await usersService.createStaffAccount(input));
}

export async function updateRole(req: Request, res: Response) {
  const { role } = usersService.updateRoleSchema.parse(req.body);
  res.json(await usersService.updateUserRole(req.params.id, role));
}
