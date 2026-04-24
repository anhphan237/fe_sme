import { Modal, Input, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, type Key } from "react";
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
  recipientUserId?: string | null;
  recipientRole?: "EMPLOYEE" | "MANAGER";
  employeeName: string;
  email?: string | null;
  managerName?: string | null;
  startDate?: string | null;
  status?: string | null;
};

interface Props {
  open: boolean;
  selectedIds: string[];
  targetRole?: "EMPLOYEE" | "MANAGER";
  onClose: () => void;
  onConfirm: (items: SelectedOnboardingItem[]) => void;
}

const statusColor = (status?: string | null) => {
  switch ((status ?? "").toUpperCase()) {
    case "ACTIVE":
      return "green";
    case "IN_PROGRESS":
      return "blue";
    case "PENDING":
      return "gold";
    case "COMPLETED":
      return "default";
    case "CLOSED":
      return "default";
    default:
      return "default";
  }
};

const SelectOnboardingModal = ({
  open,
  selectedIds,
  targetRole = "EMPLOYEE",
  onClose,
  onConfirm,
}: Props) => {
  const { t } = useLocale();

  // Modal đang mount/unmount theo selectModalOpen nên init từ props là đủ
  const [keyword, setKeyword] = useState("");
  const [localSelectedIds, setLocalSelectedIds] =
    useState<string[]>(selectedIds);

  const { data: onboardingRaw, isLoading: isOnboardingLoading } = useQuery({
    queryKey: ["onboarding-instances-for-survey-select"],
    queryFn: () => apiListInstances({}),
    enabled: open,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });

  const { data: usersRaw, isLoading: isUsersLoading } = useQuery({
    queryKey: ["users-for-survey-select"],
    queryFn: () => apiSearchUsers({}),
    enabled: open,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });

  const onboardingInstances = extractList<OnboardingInstanceItem>(
    onboardingRaw,
    "instances",
    "items",
  );

  const users = extractList<UserListItem>(usersRaw, "users", "items");

  const userMap = useMemo(
    () => new Map(users.map((user) => [user.userId, user])),
    [users],
  );

  const rows = useMemo<SelectedOnboardingItem[]>(() => {
    const result: SelectedOnboardingItem[] = [];

    onboardingInstances.forEach((item) => {
      if (!item.instanceId) return;

      const employee = item.employeeUserId
        ? userMap.get(item.employeeUserId)
        : undefined;

      const manager = item.managerUserId
        ? userMap.get(item.managerUserId)
        : undefined;

      if (targetRole === "MANAGER") {
        if (!item.managerUserId) return;

        const managerDisplayName =
          manager?.fullName ||
          item.managerName ||
          item.managerUserId ||
          "Manager";

        result.push({
          onboardingId: item.instanceId,
          instanceId: item.instanceId,
          employeeUserId: item.employeeUserId ?? null,
          managerUserId: item.managerUserId ?? null,
          recipientUserId: item.managerUserId ?? null,
          recipientRole: "MANAGER",
          employeeName: managerDisplayName,
          email: manager?.email ?? null,
          managerName:
            employee?.fullName ||
            item.employeeId ||
            item.employeeUserId ||
            "-",
          startDate: item.startDate ?? null,
          status: item.status ?? null,
        });

        return;
      }

      if (!item.employeeUserId) return;

      const employeeDisplayName =
        employee?.fullName ||
        item.employeeId ||
        item.employeeUserId ||
        item.instanceId;

      const managerDisplayName =
        manager?.fullName ||
        item.managerName ||
        item.managerUserId ||
        "-";

      result.push({
        onboardingId: item.instanceId,
        instanceId: item.instanceId,
        employeeUserId: item.employeeUserId ?? null,
        managerUserId: item.managerUserId ?? null,
        recipientUserId: item.employeeUserId ?? null,
        recipientRole: "EMPLOYEE",
        employeeName: employeeDisplayName,
        email: employee?.email ?? null,
        managerName: managerDisplayName,
        startDate: item.startDate ?? null,
        status: item.status ?? null,
      });
    });

    return result;
  }, [onboardingInstances, targetRole, userMap]);

  const normalizedKeyword = keyword.trim().toLowerCase();

  const filteredRows = useMemo(() => {
    if (!normalizedKeyword) return rows;

    return rows.filter((item) =>
      [
        item.employeeName,
        item.email,
        item.managerName,
        item.instanceId,
        item.status,
        item.startDate,
        item.recipientRole,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(normalizedKeyword),
        ),
    );
  }, [rows, normalizedKeyword]);

  const selectedItems = useMemo(
    () => rows.filter((item) => localSelectedIds.includes(item.instanceId)),
    [rows, localSelectedIds],
  );

  const columns = useMemo<ColumnsType<SelectedOnboardingItem>>(() => {
    if (targetRole === "MANAGER") {
      return [
        {
          title: "Tên quản lý",
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
          title: "Nhân viên onboarding",
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
            value ? <Tag color={statusColor(value)}>{value}</Tag> : "-",
        },
      ];
    }

    return [
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
          value ? <Tag color={statusColor(value)}>{value}</Tag> : "-",
      },
    ];
  }, [t, targetRole]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        targetRole === "MANAGER"
          ? "Chọn quản lý onboarding"
          : t("survey.send.select_employee_modal_title")
      }
      width={980}
      destroyOnHidden
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
          placeholder={
            targetRole === "MANAGER"
              ? "Tìm theo tên quản lý, email, nhân viên onboarding, trạng thái"
              : t("survey.send.search_employee_placeholder")
          }
        />
        <div className="min-w-fit text-sm text-slate-500">
          {t("survey.send.selected_count")}:
          <span className="ml-1 font-semibold">{localSelectedIds.length}</span>
        </div>
      </div>

      <Table<SelectedOnboardingItem>
        rowKey="instanceId"
        loading={isOnboardingLoading || isUsersLoading}
        dataSource={filteredRows}
        pagination={{ pageSize: 8 }}
        rowSelection={{
          selectedRowKeys: localSelectedIds,
          onChange: (keys: Key[]) => setLocalSelectedIds(keys.map(String)),
        }}
        columns={columns}
      />
    </Modal>
  );
};

export default SelectOnboardingModal;