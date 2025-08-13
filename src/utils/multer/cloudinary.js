import { v2 as cloudinary } from "cloudinary";

export const cloud = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
    secure: true,
  });

  return cloudinary;
};

export const uploadFile = async ({ file = {}, path = "general" } = {}) => {
  return await cloud().uploader.upload(file.path, {
    folder: `${process.env.APPLICATION_NAME}/${path}`,
  });
};

export const uploadFiles = async ({ files = [], path = "general" } = {}) => {
  const attachments = [];
  for (const file of files) {
    const { secure_url, public_id } = await uploadFile({ file, path });
    attachments.push({ secure_url, public_id });
  }

  return attachments;
};

export const destroyFile = async ({ public_id = "" } = {}) => {
  return await cloud().uploader.destroy(public_id);
};

export const deleteResources = async ({
  public_ids = [],
  options = {
    type: "upload",
    resource_type: "image",
  },
} = {}) => {
  return await cloud().api.delete_resources(public_ids, options);
};

export const deleteResourcesByPrefix = async ({ prefix = "" } = {}) => {
  return await cloud().api.delete_resources_by_prefix(`${process.env.APPLICATION_NAME}/${prefix}`);
};
