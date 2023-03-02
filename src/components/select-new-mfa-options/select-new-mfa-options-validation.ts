import { body } from "express-validator";
import { validateBodyMiddleware } from "../../middleware/form-validation-middleware";
import { ValidationChainFunc } from "../../types";

export function validateSetNewMfaRequest(): ValidationChainFunc {
  return [
    body("selectNewMfaOptions")
      .notEmpty()
      .withMessage((value, { req }) => {
        return req.t(
          "pages.selectNewMfaOptions.secondFactorRadios.errorMessage",
          {
            value,
          }
        );
      }),
    validateBodyMiddleware("select-new-mfa-options/index.njk"),
  ];
}
