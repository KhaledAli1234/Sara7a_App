import { Router } from "express";
import * as messageService from "./message.service.js";
import {
  cloudFileUpload,
  fileValidation,
} from "../../utils/multer/cloud.multer.js";
import { validation } from "../../middleware/validation.middleware.js";
import * as validators from "./message.validation.js";
import {  authentication } from "../../middleware/authentication.middleware.js";

const router = Router({
    caseSensitive:true,
    strict:true
});

router.post(
  "/:receiverId",
  cloudFileUpload({ validation: fileValidation.image }).array("attachments", 2),
  validation(validators.sendMessage),
  messageService.sendMessage
);

router.post(
  "/:receiverId/sender",
  authentication(),
  cloudFileUpload({ validation: fileValidation.image }).array("attachments", 2),
  validation(validators.sendMessage),
  messageService.sendMessage
);

router.get(
  "/list/:userId",
  validation(validators.listMessages),
  messageService.listMessages
);


router.get(
  "/:messageId",
  authentication(),
  validation(validators.getMessageById),
  messageService.getMessageById
);


router.delete(
  "/soft/:messageId",
  authentication(),
  validation(validators.deleteMessage),
  messageService.deleteMessage
);


router.delete(
  "/hard/:messageId",
  validation(validators.deleteMessage),
  messageService.hardDeleteMessage
);

export default router;
