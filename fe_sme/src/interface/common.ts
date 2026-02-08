export interface PageFilter {
    pageSize: number;
    pageNumber: number;
    search?: string;
    filters?: { key: string; value: string[] | number[] }[];
}
