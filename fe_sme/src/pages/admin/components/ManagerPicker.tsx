import { useMemo } from "react";
import { useLocale } from "@/i18n";
import { useUsersQuery } from "../hooks";
import { SearchableSelect } from "./SearchableSelect";

export interface ManagerPickerProps {
  value: string;
  onChange: (userId: string) => void;
}

export function ManagerPicker({ value, onChange }: ManagerPickerProps) {
  const { t } = useLocale();
  const { data: users = [] } = useUsersQuery();

  const options = useMemo(
    () =>
      users.map((u) => ({
        id: u.id,
        label: u.name || u.email,
        subLabel: u.name ? u.email : undefined,
      })),
    [users],
  );

  return (
    <SearchableSelect
      options={options}
      value={value}
      onChange={onChange}
      placeholder={t("department.manager_search_placeholder")}
    />
  );
}
