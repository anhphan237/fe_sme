import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';

import BaseSelect, { BaseSelectProps } from './BaseSelect';

interface BaseOption {
    label: string;
    value?: any;
    options?: BaseOption[];
    sorts?: string;
}
interface InfiniteScrollSelectProps<T> extends BaseSelectProps {
    fetchData: (params: { pageNumber: number; pageSize: number; search?: string }) => Promise<any>;
    mapData?: (data: T[]) => BaseOption[];
    searchDebounce?: number;
    queryKey?: string[];
    skipFetch?: boolean;
}

const JUMP = 10;
const defaultMapData = <T = BaseOption,>(data: T[]) =>
    data.map((item: T) => ({
        key: (item as any).id,
        ...item,
        label: (item as any).nameShort || (item as any).name || (item as any).fullName || (item as any).invoice || (item as any).roleName,
        value: (item as any).id,
    }));
const InfiniteScrollSelect = <T = BaseOption,>({
    fetchData,
    mapData = defaultMapData<T>,
    searchDebounce = 500,
    queryKey = ['infinite-scroll'],
    skipFetch,
    ...props
}: InfiniteScrollSelectProps<T>) => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(JUMP);
    const [search, setSearch] = useState<string>('');
    const [hasMore, setHasMore] = useState(true);
    const [isFocused, setIsFocused] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const mapRef = useRef(mapData);
    const [responseData, setResponseData] = useState<BaseOption[]>([]);

    useEffect(() => {
        mapRef.current = mapData;
    });

    const { isFetching, refetch } = useQuery({
        queryKey: [...queryKey, page, pageSize, search],
        queryFn: async () => {
            const data = await fetchData({ pageNumber: page, pageSize, search });
            const mappedData = mapRef.current(data);
            if (mappedData.length < pageSize) {
                setHasMore(false);
            }
            setResponseData(prev => (mappedData ? [...mappedData] : prev));
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
            setPage(1);
            setPageSize(JUMP);
        }, searchDebounce);
    };

    const handleInfiniteOnLoad = () => {
        if (!hasMore || isFetching) {
            return;
        }
        setPageSize(prevPage => prevPage + JUMP);
    };

    const resetData = () => {
        // setResponseData([]);
        setHasMore(true);
        setPage(1);
        setPageSize(JUMP);
    };

    return (
        <BaseSelect
            filterOption={false}
            onSearch={handleSearch}
            loading={isFetching}
            key={props.name}
            onDropdownVisibleChange={open => {
                if (!open) {
                    resetData();
                    setSearch('');
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
