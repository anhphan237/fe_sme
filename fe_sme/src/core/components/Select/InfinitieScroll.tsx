import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useRef, useState } from "react";

import BaseSelect, { type BaseSelectProps } from "./BaseSelect";

interface BaseOption {
  label: string;
  value?: string | number | null;
  options?: BaseOption[];
  sorts?: string;
}

interface InfiniteScrollSelectProps<T> extends BaseSelectProps {
  fetchData: (params: {
    pageNumber: number;
    pageSize: number;
    search?: string;
  }) => Promise<T[]>;
  mapData?: (data: T[]) => BaseOption[];
  searchDebounce?: number;
  queryKey?: string[];
  skipFetch?: boolean;
}

const JUMP = 10;

const defaultMapData = <T,>(data: T[]) =>
  data.map((item: T) => ({
    key: (item as Record<string, unknown>).id,
    ...(item as object),
    label:
      (item as Record<string, unknown>).nameShort ||
      (item as Record<string, unknown>).name ||
      (item as Record<string, unknown>).fullName ||
      (item as Record<string, unknown>).invoice ||
      (item as Record<string, unknown>).roleName,
    value: (item as Record<string, unknown>).id,
  })) as BaseOption[];

const InfiniteScrollSelect = <T = BaseOption,>({
  fetchData,
  mapData = defaultMapData<T>,
  searchDebounce = 500,
  queryKey = ["infinite-scroll"],
  skipFetch,
  ...props
}: InfiniteScrollSelectProps<T>) => {
  const [pageSize, setPageSize] = useState(JUMP);
  const [search, setSearch] = useState<string>("");
  const [hasMore, setHasMore] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapRef = useRef(mapData);
  const [responseData, setResponseData] = useState<BaseOption[]>([]);

  useEffect(() => {
    mapRef.current = mapData;
  });

  const { isFetching, refetch } = useQuery({
    queryKey: [...queryKey, pageSize, search],
    queryFn: async () => {
      const data = await fetchData({ pageNumber: 1, pageSize, search });
      const mappedData = mapRef.current(data);
      if (mappedData.length < pageSize) {
        setHasMore(false);
      }
      setResponseData(mappedData);
      return mappedData;
    },
    refetchOnWindowFocus: false,
    enabled: !skipFetch && isFocused,
  });

  const handleSearch = (value: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setSearch(value);
      setPageSize(JUMP);
    }, searchDebounce);
  };

  const handleInfiniteOnLoad = () => {
    if (!hasMore || isFetching) return;
    setPageSize((prev) => prev + JUMP);
  };

  const resetData = () => {
    setHasMore(true);
    setPageSize(JUMP);
  };

  return (
    <BaseSelect
      filterOption={false}
      onSearch={handleSearch}
      loading={isFetching}
      key={props.name as string}
      onDropdownVisibleChange={(open) => {
        if (!open) {
          resetData();
          setSearch("");
        } else {
          refetch();
        }
      }}
      {...props}
      onFocus={() => setIsFocused(true)}
      options={responseData}
      onPopupScroll={(e: React.UIEvent<HTMLElement>) => {
        const target = e.target as HTMLElement;
        if (target.scrollTop + target.offsetHeight === target.scrollHeight) {
          handleInfiniteOnLoad();
        }
      }}
    />
  );
};

export default InfiniteScrollSelect;
