export type UploadImageResponse = {
  url: string;
  secureUrl: string;
  publicId?: string;
  originalFilename?: string;
};

type CloudinaryUploadResponse = {
  url?: string;
  secure_url?: string;
  public_id?: string;
  original_filename?: string;
};

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as
  | string
  | undefined;

const CLOUDINARY_UPLOAD_PRESET = import.meta.env
  .VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;

export const uploadEventCoverImage = async (
  file: File,
): Promise<UploadImageResponse> => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error(
      "Thiếu cấu hình upload ảnh: VITE_CLOUDINARY_CLOUD_NAME hoặc VITE_CLOUDINARY_UPLOAD_PRESET",
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", "sme-onboarding/events");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    throw new Error("Upload ảnh thất bại");
  }

  const data = (await response.json()) as CloudinaryUploadResponse;
  const secureUrl = data.secure_url ?? data.url;

  if (!secureUrl) {
    throw new Error("Upload ảnh thành công nhưng không nhận được URL");
  }

  return {
    url: data.url ?? secureUrl,
    secureUrl,
    publicId: data.public_id,
    originalFilename: data.original_filename,
  };
};
