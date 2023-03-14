import { Request, Response } from "express";
import { getNextPathAndUpdateJourney } from "../common/constants";
import { USER_JOURNEY_EVENTS } from "../common/state-machine/state-machine";

export function changeSecurityCodesGet(req: Request, res: Response): void {
  const { sessionId } = res.locals;
  const nextState = req.session.user.canChangeGetSecurityCodesFromSms
    ? USER_JOURNEY_EVENTS.CHANGE_SECURITY_CODES_ALLOWED
    : USER_JOURNEY_EVENTS.CHANGE_SECURITY_CODES_DENIED;

  const redirectPath = getNextPathAndUpdateJourney(
    req,
    req.path,
    nextState,
    {},
    sessionId
  );

  return res.redirect(redirectPath);
}
