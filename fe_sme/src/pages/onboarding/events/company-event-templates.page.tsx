import { useMemo, useState } from "react";
import { Button, Card, Form, Input, Select, Space, message } from "antd";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  apiCompanyEventTemplateCreate,
  apiCompanyEventTemplateDetail,
  apiCompanyEventTemplateList,
} from "@/api/onboarding/company-event-template.api";
import type {
  CompanyEventTemplateCreateRequest,
  CompanyEventTemplateCreateResponse,
  CompanyEventTemplateListResponse,
} from "./company-event-template.types";

import CompanyEventTemplateHeader from "./component/CompanyEventTemplateHeader";
import CompanyEventTemplateStats from "./component/CompanyEventTemplateStats";
import CompanyEventTemplateTable from "./component/CompanyEventTemplateTable";
import CompanyEventTemplateCreateDrawer from "./component/CompanyEventTemplateCreateDrawer";
import CompanyEventTemplateDetailDrawer from "./component/CompanyEventTemplateDetailDrawer";
import { apiSearchUsers } from "@/api/identity/identity.api";
import { normalizeUsers } from "./event.utils";

const COMPANY_EVENT_TEMPLATE_QUERY_KEY = ["company-event-templates"];

export default function CompanyEventTemplatesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [templateForm] = Form.useForm<CompanyEventTemplateCreateRequest>();

  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<string>("ACTIVE");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>();

  const templatesQuery = useQuery({
    queryKey: [...COMPANY_EVENT_TEMPLATE_QUERY_KEY, status, keyword],
    queryFn: () =>
      apiCompanyEventTemplateList({
        status: status || undefined,
        keyword: keyword.trim() || undefined,
      }),
  });

  const detailQuery = useQuery({
    queryKey: ["company-event-template-detail", selectedTemplateId],
    queryFn: () =>
      apiCompanyEventTemplateDetail({
        eventTemplateId: selectedTemplateId!,
      }),
    enabled: Boolean(selectedTemplateId && detailOpen),
  });
  const usersQuery = useQuery({
    queryKey: ["company-event-template-users"],
    queryFn: () => apiSearchUsers({ status: "ACTIVE" } as never),
  });

  const createTemplateMutation = useMutation({
    mutationFn: (payload: CompanyEventTemplateCreateRequest) =>
      apiCompanyEventTemplateCreate(payload),
    onSuccess: (res: CompanyEventTemplateCreateResponse) => {
      message.success("Tạo mẫu sự kiện thành công");
      templateForm.resetFields();
      setCreateOpen(false);

      queryClient.invalidateQueries({
        queryKey: COMPANY_EVENT_TEMPLATE_QUERY_KEY,
      });

      navigate(`/onboarding/events?templateId=${res.eventTemplateId}`);
    },
    onError: (err) => {
      message.error(err instanceof Error ? err.message : "Tạo mẫu thất bại");
    },
  });

  const data = templatesQuery.data as
    | CompanyEventTemplateListResponse
    | undefined;

  const templates = data?.items ?? [];
  const users = useMemo(
    () => normalizeUsers(usersQuery.data),
    [usersQuery.data],
  );

  const userNameById = useMemo(() => {
    const map = new Map<string, string>();

    users.forEach((user) => {
      const cleanName = user.label.split(" • ")[0].split(" — ")[0].trim();

      map.set(user.value, cleanName || user.label);
    });

    return map;
  }, [users]);

  const selectedTemplateItem = useMemo(() => {
    if (!selectedTemplateId) return undefined;

    return templates.find(
      (item) => item.eventTemplateId === selectedTemplateId,
    );
  }, [selectedTemplateId, templates]);

  const selectedTemplateCreatorName = useMemo(() => {
    const creatorId =
      detailQuery.data?.createdBy ?? selectedTemplateItem?.createdBy;

    if (!creatorId) return undefined;

    return userNameById.get(creatorId) ?? creatorId;
  }, [
    detailQuery.data?.createdBy,
    selectedTemplateItem?.createdBy,
    userNameById,
  ]);
  const activeCount = useMemo(
    () => templates.filter((item) => item.status === "ACTIVE").length,
    [templates],
  );

  const draftCount = useMemo(
    () => templates.filter((item) => item.status === "DRAFT").length,
    [templates],
  );

  const inactiveCount = useMemo(
    () => templates.filter((item) => item.status === "INACTIVE").length,
    [templates],
  );

  const handleSearch = () => {
    setKeyword(keywordInput);
  };

  const handleCreateTemplate = async () => {
    const values = await templateForm.validateFields();

    createTemplateMutation.mutate({
      name: values.name?.trim(),
      description: values.description?.trim(),
      content: values.content?.trim(),
      status: values.status || "ACTIVE",
    });
  };

  const handleUseTemplate = (eventTemplateId: string) => {
    navigate(`/onboarding/events?templateId=${eventTemplateId}`);
  };

  const handleCopyId = async (eventTemplateId: string) => {
    await navigator.clipboard.writeText(eventTemplateId);
    message.success("Đã copy mã template");
  };

  return (
    <div className="space-y-5 p-4 md:p-6">
      <CompanyEventTemplateHeader
        loading={templatesQuery.isFetching}
        onRefresh={() => templatesQuery.refetch()}
        onCreate={() => setCreateOpen(true)}
      />

      <CompanyEventTemplateStats
        totalCount={data?.totalCount ?? 0}
        activeCount={activeCount}
        draftCount={draftCount}
        inactiveCount={inactiveCount}
      />

      <Card className="rounded-2xl">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Space wrap>
            <Input
              allowClear
              prefix={<Search size={15} />}
              placeholder="Tìm theo tên, mô tả hoặc nội dung"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onPressEnter={handleSearch}
              className="w-full lg:w-[320px]"
            />

            <Select
              value={status}
              className="w-full lg:w-[180px]"
              onChange={(value) => setStatus(value)}
              options={[
                { value: "ACTIVE", label: "Đang hoạt động" },
                { value: "DRAFT", label: "Bản nháp" },
                { value: "INACTIVE", label: "Ngưng hoạt động" },
                { value: "", label: "Tất cả" },
              ]}
            />

            <Button type="primary" onClick={handleSearch}>
              Tìm kiếm
            </Button>
          </Space>
        </div>

        <CompanyEventTemplateTable
          loading={templatesQuery.isLoading}
          data={templates}
          onView={(eventTemplateId) => {
            setSelectedTemplateId(eventTemplateId);
            setDetailOpen(true);
          }}
          onCopy={handleCopyId}
          onUseTemplate={handleUseTemplate}
        />
      </Card>

      <CompanyEventTemplateCreateDrawer
        open={createOpen}
        loading={createTemplateMutation.isPending}
        form={templateForm}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateTemplate}
      />

      <CompanyEventTemplateDetailDrawer
        open={detailOpen}
        loading={detailQuery.isLoading}
        detail={detailQuery.data}
        fallbackItem={selectedTemplateItem}
        createdByName={selectedTemplateCreatorName}
        onClose={() => setDetailOpen(false)}
        onUseTemplate={handleUseTemplate}
      />
    </div>
  );
}
