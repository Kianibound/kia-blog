export declare const PostStatus: {
    readonly DRAFT: "DRAFT";
    readonly PUBLISHED: "PUBLISHED";
    readonly DEPRECATED: "DEPRECATED";
};
export type PostStatus = (typeof PostStatus)[keyof typeof PostStatus];
