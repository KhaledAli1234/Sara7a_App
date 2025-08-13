import { roleEnum } from "../../DB/models/User.model.js";

export const endpoint = {
  profile: [roleEnum.admin, roleEnum.user],
  restoreAccount: [roleEnum.admin],
  deleteAccount: [roleEnum.admin],
};
