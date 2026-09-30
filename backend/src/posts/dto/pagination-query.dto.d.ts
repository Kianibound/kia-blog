export declare class PaginationQueryDto {
    page: number;
    limit: number;
    search?: string;
    sort: 'newest' | 'oldest';
    author?: string;
    category?: string;
    tag?: string;
}
