import { Request, Response } from "express";
import { API_ERROR_CODES, ERROR_LOG_LEVEL } from "../../app.constants";
import { NOTIFICATION_TYPE } from "../../app.constants";
import { VerifyCodeInterface } from "../common/verify-code/types";
import { codeService } from "../common/verify-code/verify-code-service";
import { verifyCodePost } from "../common/verify-code/verify-code-controller";
import { ExpressRouteFunc } from "../../types";
import { ERROR_CODES } from "../common/constants";
import { supportAccountRecovery } from "../../config";
import { AccountRecoveryInterface } from "../common/account-recovery/types";
import { accountRecoveryService } from "../common/account-recovery/account-recovery-service";
import { BadRequestError } from "../../utils/error";

const TEMPLATE_NAME = "enter-mfa/index.njk";

export function enterMfaGet(
  service: AccountRecoveryInterface = accountRecoveryService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    const accountRecovery = supportAccountRecovery();

    if (accountRecovery) {
      const { email } = req.session.user;
      const { sessionId, clientSessionId, persistentSessionId } = res.locals;

      const accountRecoveryResponse = await service.accountRecovery(
        sessionId,
        clientSessionId,
        email,
        req.ip,
        persistentSessionId
      );

      if (!accountRecoveryResponse.success) {
        const accountRecoveryError = new BadRequestError(
          accountRecoveryResponse.data.message,
          accountRecoveryResponse.data.code
        );
        if (
          accountRecoveryResponse.data.code &&
          accountRecoveryResponse.data.code ===
            API_ERROR_CODES.SESSION_ID_MISSING_OR_INVALID
        ) {
          accountRecoveryError.level = ERROR_LOG_LEVEL.INFO;
        }
        throw accountRecoveryError;
      }

      req.session.user.canChangeGetSecurityCodesFromSms =
        accountRecoveryResponse.data.accountRecoveryPermitted;
    }

    res.render(TEMPLATE_NAME, {
      phoneNumber: req.session.user.phoneNumber,
      supportAccountRecovery: accountRecovery ? true : null,
    });
  };
}

export const enterMfaPost = (
  service: VerifyCodeInterface = codeService()
): ExpressRouteFunc => {
  return verifyCodePost(service, {
    notificationType: NOTIFICATION_TYPE.MFA_SMS,
    template: TEMPLATE_NAME,
    validationKey: "pages.enterMfa.code.validationError.invalidCode",
    validationErrorCode: ERROR_CODES.INVALID_MFA_CODE,
  });
};
