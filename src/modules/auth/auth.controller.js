import { Router } from "express";
import * as authService from "./auth.service.js";
import * as validators from "./auth.validation.js"
import { authentication } from "../../middleware/authentication.middleware.js";
import { validation } from "../../middleware/validation.middleware.js";


const router = Router({
    caseSensitive:true,
    strict:true
});

router.post("/signup",validation(validators.signup), authService.signup);
router.patch("/confirm-Email", authService.confirmEmail);
router.post("/signup/gmail", authService.signupWithGmail);
router.post("/login",validation( validators.login), authService.login);
router.patch("/send-forgot-password",validation( validators.sendForgotPassword), authService.sendForgotPassword);
router.patch("/verify-forgot-password",validation( validators.verifyForgotPassword), authService.verifyForgotPassword);
router.patch("/reset-forgot-password",validation( validators.resetPassword), authService.resetPassword);
router.post("/login/gmail", authService.loginWithGmail);
router.post("/send-code", authService.sendCode);
router.post("/verify-code", authService.verifyCode);



export default router;
