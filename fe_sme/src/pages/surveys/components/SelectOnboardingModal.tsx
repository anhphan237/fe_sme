import { Modal, Input, Table, Tag } from "antd";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import dayjs from "dayjs";

import BaseButton from "@/components/button";
import { extractList } from "@/api/core/types";
import { apiSearchUsers } from "@/api/identity/identity.api";
import { apiListInstances } from "@/api/onboarding/onboarding.api";
import type { UserListItem } from "@/interface/identity";
import { useLocale } from "@/i18n";

type OnboardingInstanceItem = {
  instanceId: string;
  employeeId?: string | null;
  employeeUserId?: string | null;
  managerUserId?: string | null;
  managerName?: string | null;
  templateId?: string | null;
  status?: string | null;
  startDate?: string | null;
  completedAt?: string | null;
};

export type SelectedOnboardingItem = {
  onboardingId: string;
  instanceId: string;

  employeeUserId?: string | null;
  managerUserId?: string | null;

  employeeName: string;
  email?: string | null;
  managerName?: string | null;
  startDate?: string | null;
  status?: string | null;
};

interface Props {
  open: boolean;
  selectedIds: string[];
  onClose: () => void;
  onConfirm: (items: SelectedOnboardingItem[]) => void;
}

const SelectOnboardingModal = ({
  open,
  selectedIds,
  onClose,
  onConfirm,
}: Props) => {
  const { t } = useLocale();
  const [keyword, setKeyword] = useState("");
  const [localSelectedIds, setLocalSelectedIds] =
    useState<string[]>(selectedIds);

  const { data: onboardingRaw, isLoading: isOnboardingLoading } = useQuery({
    queryKey: ["onboarding-instances-for-survey-select"],
    queryFn: () => apiListInstances({}),
    enabled: open,
  });

  const { data: usersRaw, isLoading: isUsersLoading } = useQuery({
    queryKey: ["users-for-survey-select"],
    queryFn: () => apiSearchUsers({}),
    enabled: open,
  });

  const onboardingInstances = extractList<OnboardingInstanceItem>(
    onboardingRaw,
    "instances",
    "items",
  );

  const users = extractList<UserListItem>(usersRaw, "users", "items");

  const employeeUsers = useMemo(
    () =>
      users.filter((user) => {
        if (!Array.isArray(user.roles)) return false;
        return user.roles.some((role) => role?.toUpperCase() === "EMPLOYEE");
      }),
    [users],
  );

  const employeeUserMap = useMemo(
    () => new Map(employeeUsers.map((user) => [user.userId, user])),
    [employeeUsers],
  );

  const rows: SelectedOnboardingItem[] = useMemo(
    () =>
      onboardingInstances
        .filter((item) => {
          if (!item.instanceId || !item.employeeUserId) return false;
          return employeeUserMap.has(item.employeeUserId);
        })
        .map((item) => {
          const employee = employeeUserMap.get(item.employeeUserId as string);

          return {
            onboardingId: item.instanceId,
            instanceId: item.instanceId,

            employeeUserId: item.employeeUserId,
            managerUserId: item.managerUserId,
            employeeName:
              employee?.fullName ||
              item.employeeId ||
              item.employeeUserId ||
              item.instanceId,
            email: employee?.email,
            managerName: item.managerName,
            startDate: item.startDate,
            status: item.status,
          };
        }),
    [onboardingInstances, employeeUserMap],
  );

  const normalizedKeyword = keyword.trim().toLowerCase();

  const filteredRows = useMemo(() => {
    if (!normalizedKeyword) return rows;

    return rows.filter((item) =>
      [
        item.employeeName,
        item.email,
        item.managerName,
        item.onboardingId,
        item.status,
        item.startDate,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(normalizedKeyword),
        ),
    );
  }, [rows, normalizedKeyword]);

  const selectedItems = useMemo(
    () => rows.filter((item) => localSelectedIds.includes(item.onboardingId)),
    [rows, localSelectedIds],
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={t("survey.send.select_employee_modal_title")}
      width={980}
      destroyOnClose
      footer={
        <div className="flex justify-end gap-2">
          <BaseButton label="global.cancel" onClick={onClose} />
          <BaseButton
            type="primary"
            onClick={() => onConfirm(selectedItems)}
            label="survey.send.confirm_selected_employees"
          />
        </div>
      }
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <Input
          allowClear
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder={t("survey.send.search_employee_placeholder")}
        />
        <div className="min-w-fit text-sm text-slate-500">
          {t("survey.send.selected_count")}:
          <span className="ml-1 font-semibold">{localSelectedIds.length}</span>
        </div>
      </div>

      <Table<SelectedOnboardingItem>
        rowKey="onboardingId"
        loading={isOnboardingLoading || isUsersLoading}
        dataSource={filteredRows}
        pagination={{ pageSize: 8 }}
        rowSelection={{
          selectedRowKeys: localSelectedIds,
          onChange: (keys) => setLocalSelectedIds(keys as string[]),
        }}
        columns={[
          {
            title: t("survey.send.employee_name_column"),
            dataIndex: "employeeName",
            key: "employeeName",
          },
          {
            title: t("survey.send.email_column"),
            dataIndex: "email",
            key: "email",
            render: (value: string | null | undefined) => value || "-",
          },
          {
            title: t("survey.send.manager_column"),
            dataIndex: "managerName",
            key: "managerName",
            render: (value: string | null | undefined) => value || "-",
          },
          {
            title: t("survey.send.start_date_column"),
            dataIndex: "startDate",
            key: "startDate",
            render: (value: string | null | undefined) =>
              value ? dayjs(value).format("DD-MM-YYYY") : "-",
          },
          {
            title: t("survey.send.status_column"),
            dataIndex: "status",
            key: "status",
            render: (value: string | null | undefined) =>
              value ? <Tag>{value}</Tag> : "-",
          },
        ]}
      />
    </Modal>
  );
};

export default SelectOnboardingModal;
