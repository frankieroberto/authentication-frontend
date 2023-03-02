import { PATH_NAMES } from "../../app.constants";
import * as express from "express";
import {
  selectNewMfaOptionsGet,
  selectNewMfaOptionsPost,
} from "./select-new-mfa-options-controller";
import { validateSessionMiddleware } from "../../middleware/session-middleware";
import { allowUserJourneyMiddleware } from "../../middleware/allow-user-journey-middleware";
import { validateSetNewMfaRequest } from "./select-new-mfa-options-validation";

const router = express.Router();

router.get(
  PATH_NAMES.SELECT_NEW_MFA_OPTIONS,
  validateSessionMiddleware,
  allowUserJourneyMiddleware,
  selectNewMfaOptionsGet
);

router.post(
  PATH_NAMES.SELECT_NEW_MFA_OPTIONS,
  validateSessionMiddleware,
  allowUserJourneyMiddleware,
  validateSetNewMfaRequest(),
  selectNewMfaOptionsPost
);

export { router as selectNewMFAOptionsRouter };
