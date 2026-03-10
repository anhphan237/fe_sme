import { Select } from "antd";
import { useLocale } from "@/i18n";
import { useUsersQuery } from "../hooks";

export interface ManagerPickerProps {
  value: string;
  onChange: (userId: string) => void;
}

export function ManagerPicker({ value, onChange }: ManagerPickerProps) {
  const { t } = useLocale();
  const { data: users = [] } = useUsersQuery();
  const options = users.map((u) => ({ value: u.id, label: u.name || u.email }));

  return (
    <Select
      className="w-full"
      showSearch
      allowClear
      value={value || undefined}
      onChange={(v) => onChange(v ?? "")}
      options={options}
      placeholder={t("department.manager_search_placeholder")}
      filterOption={(input, option) =>
        String(option?.label ?? "")
          .toLowerCase()
          .includes(input.toLowerCase())
      }
    />
  );
}
