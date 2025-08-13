import { Router } from "express";
import * as userService from "./user.service.js";
import { auth, authentication, authorization } from "../../middleware/authentication.middleware.js";
import { tokenTypeEnum } from "../../utils/security/token.security.js";
import { endpoint } from "./user.authorization.js";
import { validation } from "../../middleware/validation.middleware.js";
import * as validators from "./user.validation.js"
import { fileValidation, localFileUpload } from "../../utils/multer/local.multer.js";
import { cloudFileUpload } from "../../utils/multer/cloud.multer.js";

const router = Router({
    caseSensitive:true,
    strict:true
});

router.post("/logout", authentication(),validation(validators.logout) , userService.logout);
router.get("/", auth({accessRoles:endpoint.profile}) , userService.profile);
router.get("/refresh-token",authentication({tokenType:tokenTypeEnum.refresh}), userService.getNewLogin);
router.get("/:userId",validation(validators.shareProfile), userService.shareProfile);
router.patch("/",authentication(),validation(validators.updateBasicInfo), userService.updateBasicInfo);
router.delete("{/:userId}/freeze-account",authentication(),validation(validators.freezeAccount), userService.freezeAccount);
router.delete("/:userId",auth({accessRoles:endpoint.deleteAccount}),validation(validators.deleteAccount), userService.deleteAccount);
router.patch("/:userId/restore-account",auth({accessRoles:endpoint.restoreAccount}),validation(validators.restoreAccount), userService.restoreAccount);
router.patch("/password",authentication(),validation(validators.updatePassword), userService.updatePassword);
router.patch("/profile-image",authentication(),cloudFileUpload({validation:fileValidation.image}).single("image"),validation(validators.profileImage), userService.profileImage);
router.patch("/profile-cover-image",authentication(),cloudFileUpload({ validation:fileValidation.image}).array("images"),validation(validators.profileCoverImage), userService.profileCoverImage);



export default router; 
 