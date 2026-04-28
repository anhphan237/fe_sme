export const companyEventTemplateStatusColor = (status?: string) => {
  const value = (status ?? "").toUpperCase();

  if (value === "ACTIVE") return "green";
  if (value === "DRAFT") return "blue";
  if (value === "INACTIVE") return "red";

  return "default";
};

export const companyEventTemplateStatusLabel = (status?: string) => {
  const value = (status ?? "").toUpperCase();

  switch (value) {
    case "ACTIVE":
      return "Đang hoạt động";
    case "DRAFT":
      return "Bản nháp";
    case "INACTIVE":
      return "Ngưng hoạt động";
    default:
      return status || "-";
  }
};

export const formatTemplateDateTime = (value?: string) => {
  if (!value) return "-";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("vi-VN");
};
