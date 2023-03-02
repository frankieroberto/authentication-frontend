import { Request, Response } from "express";

export function selectNewMfaOptionsGet(req: Request, res: Response): void {
  res.render("select-new-mfa-options/index.njk");
}

export function selectNewMfaOptionsPost(req: Request, res: Response): void {
  res.render("select-new-mfa-options/index.njk");
}
