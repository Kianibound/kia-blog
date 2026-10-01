import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums.js";
import type * as Prisma from "../internal/prismaNamespace.js";
export type PostModel = runtime.Types.Result.DefaultSelection<Prisma.$PostPayload>;
export type AggregatePost = {
    _count: PostCountAggregateOutputType | null;
    _min: PostMinAggregateOutputType | null;
    _max: PostMaxAggregateOutputType | null;
};
export type PostMinAggregateOutputType = {
    id: string | null;
    title: string | null;
    slug: string | null;
    content: string | null;
    status: $Enums.PostStatus | null;
    publishedAt: Date | null;
    authorId: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type PostMaxAggregateOutputType = {
    id: string | null;
    title: string | null;
    slug: string | null;
    content: string | null;
    status: $Enums.PostStatus | null;
    publishedAt: Date | null;
    authorId: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type PostCountAggregateOutputType = {
    id: number;
    title: number;
    slug: number;
    content: number;
    status: number;
    publishedAt: number;
    authorId: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type PostMinAggregateInputType = {
    id?: true;
    title?: true;
    slug?: true;
    content?: true;
    status?: true;
    publishedAt?: true;
    authorId?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type PostMaxAggregateInputType = {
    id?: true;
    title?: true;
    slug?: true;
    content?: true;
    status?: true;
    publishedAt?: true;
    authorId?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type PostCountAggregateInputType = {
    id?: true;
    title?: true;
    slug?: true;
    content?: true;
    status?: true;
    publishedAt?: true;
    authorId?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type PostAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PostWhereInput;
    orderBy?: Prisma.PostOrderByWithRelationInput | Prisma.PostOrderByWithRelationInput[];
    cursor?: Prisma.PostWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | PostCountAggregateInputType;
    _min?: PostMinAggregateInputType;
    _max?: PostMaxAggregateInputType;
};
export type GetPostAggregateType<T extends PostAggregateArgs> = {
    [P in keyof T & keyof AggregatePost]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregatePost[P]> : Prisma.GetScalarType<T[P], AggregatePost[P]>;
};
export type PostGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PostWhereInput;
    orderBy?: Prisma.PostOrderByWithAggregationInput | Prisma.PostOrderByWithAggregationInput[];
    by: Prisma.PostScalarFieldEnum[] | Prisma.PostScalarFieldEnum;
    having?: Prisma.PostScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: PostCountAggregateInputType | true;
    _min?: PostMinAggregateInputType;
    _max?: PostMaxAggregateInputType;
};
export type PostGroupByOutputType = {
    id: string;
    title: string;
    slug: string;
    content: string;
    status: $Enums.PostStatus;
    publishedAt: Date | null;
    authorId: string;
    createdAt: Date;
    updatedAt: Date;
    _count: PostCountAggregateOutputType | null;
    _min: PostMinAggregateOutputType | null;
    _max: PostMaxAggregateOutputType | null;
};
export type GetPostGroupByPayload<T extends PostGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<PostGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof PostGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], PostGroupByOutputType[P]> : Prisma.GetScalarType<T[P], PostGroupByOutputType[P]>;
}>>;
export type PostWhereInput = {
    AND?: Prisma.PostWhereInput | Prisma.PostWhereInput[];
    OR?: Prisma.PostWhereInput[];
    NOT?: Prisma.PostWhereInput | Prisma.PostWhereInput[];
    id?: Prisma.StringFilter<"Post"> | string;
    title?: Prisma.StringFilter<"Post"> | string;
    slug?: Prisma.StringFilter<"Post"> | string;
    content?: Prisma.StringFilter<"Post"> | string;
    status?: Prisma.EnumPostStatusFilter<"Post"> | $Enums.PostStatus;
    publishedAt?: Prisma.DateTimeNullableFilter<"Post"> | Date | string | null;
    authorId?: Prisma.StringFilter<"Post"> | string;
    createdAt?: Prisma.DateTimeFilter<"Post"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Post"> | Date | string;
    author?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
    categories?: Prisma.CategoryListRelationFilter;
    tags?: Prisma.TagListRelationFilter;
    comments?: Prisma.CommentListRelationFilter;
    bookmarks?: Prisma.BookmarkListRelationFilter;
    postLikes?: Prisma.PostLikeListRelationFilter;
};
export type PostOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    slug?: Prisma.SortOrder;
    content?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    publishedAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    authorId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    author?: Prisma.UserOrderByWithRelationInput;
    categories?: Prisma.CategoryOrderByRelationAggregateInput;
    tags?: Prisma.TagOrderByRelationAggregateInput;
    comments?: Prisma.CommentOrderByRelationAggregateInput;
    bookmarks?: Prisma.BookmarkOrderByRelationAggregateInput;
    postLikes?: Prisma.PostLikeOrderByRelationAggregateInput;
};
export type PostWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    slug?: string;
    AND?: Prisma.PostWhereInput | Prisma.PostWhereInput[];
    OR?: Prisma.PostWhereInput[];
    NOT?: Prisma.PostWhereInput | Prisma.PostWhereInput[];
    title?: Prisma.StringFilter<"Post"> | string;
    content?: Prisma.StringFilter<"Post"> | string;
    status?: Prisma.EnumPostStatusFilter<"Post"> | $Enums.PostStatus;
    publishedAt?: Prisma.DateTimeNullableFilter<"Post"> | Date | string | null;
    authorId?: Prisma.StringFilter<"Post"> | string;
    createdAt?: Prisma.DateTimeFilter<"Post"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Post"> | Date | string;
    author?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
    categories?: Prisma.CategoryListRelationFilter;
    tags?: Prisma.TagListRelationFilter;
    comments?: Prisma.CommentListRelationFilter;
    bookmarks?: Prisma.BookmarkListRelationFilter;
    postLikes?: Prisma.PostLikeListRelationFilter;
}, "id" | "slug">;
export type PostOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    slug?: Prisma.SortOrder;
    content?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    publishedAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    authorId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.PostCountOrderByAggregateInput;
    _max?: Prisma.PostMaxOrderByAggregateInput;
    _min?: Prisma.PostMinOrderByAggregateInput;
};
export type PostScalarWhereWithAggregatesInput = {
    AND?: Prisma.PostScalarWhereWithAggregatesInput | Prisma.PostScalarWhereWithAggregatesInput[];
    OR?: Prisma.PostScalarWhereWithAggregatesInput[];
    NOT?: Prisma.PostScalarWhereWithAggregatesInput | Prisma.PostScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"Post"> | string;
    title?: Prisma.StringWithAggregatesFilter<"Post"> | string;
    slug?: Prisma.StringWithAggregatesFilter<"Post"> | string;
    content?: Prisma.StringWithAggregatesFilter<"Post"> | string;
    status?: Prisma.EnumPostStatusWithAggregatesFilter<"Post"> | $Enums.PostStatus;
    publishedAt?: Prisma.DateTimeNullableWithAggregatesFilter<"Post"> | Date | string | null;
    authorId?: Prisma.StringWithAggregatesFilter<"Post"> | string;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"Post"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"Post"> | Date | string;
};
export type PostCreateInput = {
    id?: string;
    title: string;
    slug: string;
    content: string;
    status?: $Enums.PostStatus;
    publishedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    author: Prisma.UserCreateNestedOneWithoutPostsInput;
    categories?: Prisma.CategoryCreateNestedManyWithoutPostsInput;
    tags?: Prisma.TagCreateNestedManyWithoutPostsInput;
    comments?: Prisma.CommentCreateNestedManyWithoutPostInput;
    bookmarks?: Prisma.BookmarkCreateNestedManyWithoutPostInput;
    postLikes?: Prisma.PostLikeCreateNestedManyWithoutPostInput;
};
export type PostUncheckedCreateInput = {
    id?: string;
    title: string;
    slug: string;
    content: string;
    status?: $Enums.PostStatus;
    publishedAt?: Date | string | null;
    authorId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    categories?: Prisma.CategoryUncheckedCreateNestedManyWithoutPostsInput;
    tags?: Prisma.TagUncheckedCreateNestedManyWithoutPostsInput;
    comments?: Prisma.CommentUncheckedCreateNestedManyWithoutPostInput;
    bookmarks?: Prisma.BookmarkUncheckedCreateNestedManyWithoutPostInput;
    postLikes?: Prisma.PostLikeUncheckedCreateNestedManyWithoutPostInput;
};
export type PostUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    content?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumPostStatusFieldUpdateOperationsInput | $Enums.PostStatus;
    publishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    author?: Prisma.UserUpdateOneRequiredWithoutPostsNestedInput;
    categories?: Prisma.CategoryUpdateManyWithoutPostsNestedInput;
    tags?: Prisma.TagUpdateManyWithoutPostsNestedInput;
    comments?: Prisma.CommentUpdateManyWithoutPostNestedInput;
    bookmarks?: Prisma.BookmarkUpdateManyWithoutPostNestedInput;
    postLikes?: Prisma.PostLikeUpdateManyWithoutPostNestedInput;
};
export type PostUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    content?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumPostStatusFieldUpdateOperationsInput | $Enums.PostStatus;
    publishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    authorId?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    categories?: Prisma.CategoryUncheckedUpdateManyWithoutPostsNestedInput;
    tags?: Prisma.TagUncheckedUpdateManyWithoutPostsNestedInput;
    comments?: Prisma.CommentUncheckedUpdateManyWithoutPostNestedInput;
    bookmarks?: Prisma.BookmarkUncheckedUpdateManyWithoutPostNestedInput;
    postLikes?: Prisma.PostLikeUncheckedUpdateManyWithoutPostNestedInput;
};
export type PostCreateManyInput = {
    id?: string;
    title: string;
    slug: string;
    content: string;
    status?: $Enums.PostStatus;
    publishedAt?: Date | string | null;
    authorId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type PostUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    content?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumPostStatusFieldUpdateOperationsInput | $Enums.PostStatus;
    publishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PostUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    content?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumPostStatusFieldUpdateOperationsInput | $Enums.PostStatus;
    publishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    authorId?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PostListRelationFilter = {
    every?: Prisma.PostWhereInput;
    some?: Prisma.PostWhereInput;
    none?: Prisma.PostWhereInput;
};
export type PostOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type PostCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    slug?: Prisma.SortOrder;
    content?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    publishedAt?: Prisma.SortOrder;
    authorId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type PostMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    slug?: Prisma.SortOrder;
    content?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    publishedAt?: Prisma.SortOrder;
    authorId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type PostMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    title?: Prisma.SortOrder;
    slug?: Prisma.SortOrder;
    content?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    publishedAt?: Prisma.SortOrder;
    authorId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type PostScalarRelationFilter = {
    is?: Prisma.PostWhereInput;
    isNot?: Prisma.PostWhereInput;
};
export type PostCreateNestedManyWithoutAuthorInput = {
    create?: Prisma.XOR<Prisma.PostCreateWithoutAuthorInput, Prisma.PostUncheckedCreateWithoutAuthorInput> | Prisma.PostCreateWithoutAuthorInput[] | Prisma.PostUncheckedCreateWithoutAuthorInput[];
    connectOrCreate?: Prisma.PostCreateOrConnectWithoutAuthorInput | Prisma.PostCreateOrConnectWithoutAuthorInput[];
    createMany?: Prisma.PostCreateManyAuthorInputEnvelope;
    connect?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
};
export type PostUncheckedCreateNestedManyWithoutAuthorInput = {
    create?: Prisma.XOR<Prisma.PostCreateWithoutAuthorInput, Prisma.PostUncheckedCreateWithoutAuthorInput> | Prisma.PostCreateWithoutAuthorInput[] | Prisma.PostUncheckedCreateWithoutAuthorInput[];
    connectOrCreate?: Prisma.PostCreateOrConnectWithoutAuthorInput | Prisma.PostCreateOrConnectWithoutAuthorInput[];
    createMany?: Prisma.PostCreateManyAuthorInputEnvelope;
    connect?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
};
export type PostUpdateManyWithoutAuthorNestedInput = {
    create?: Prisma.XOR<Prisma.PostCreateWithoutAuthorInput, Prisma.PostUncheckedCreateWithoutAuthorInput> | Prisma.PostCreateWithoutAuthorInput[] | Prisma.PostUncheckedCreateWithoutAuthorInput[];
    connectOrCreate?: Prisma.PostCreateOrConnectWithoutAuthorInput | Prisma.PostCreateOrConnectWithoutAuthorInput[];
    upsert?: Prisma.PostUpsertWithWhereUniqueWithoutAuthorInput | Prisma.PostUpsertWithWhereUniqueWithoutAuthorInput[];
    createMany?: Prisma.PostCreateManyAuthorInputEnvelope;
    set?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
    disconnect?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
    delete?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
    connect?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
    update?: Prisma.PostUpdateWithWhereUniqueWithoutAuthorInput | Prisma.PostUpdateWithWhereUniqueWithoutAuthorInput[];
    updateMany?: Prisma.PostUpdateManyWithWhereWithoutAuthorInput | Prisma.PostUpdateManyWithWhereWithoutAuthorInput[];
    deleteMany?: Prisma.PostScalarWhereInput | Prisma.PostScalarWhereInput[];
};
export type PostUncheckedUpdateManyWithoutAuthorNestedInput = {
    create?: Prisma.XOR<Prisma.PostCreateWithoutAuthorInput, Prisma.PostUncheckedCreateWithoutAuthorInput> | Prisma.PostCreateWithoutAuthorInput[] | Prisma.PostUncheckedCreateWithoutAuthorInput[];
    connectOrCreate?: Prisma.PostCreateOrConnectWithoutAuthorInput | Prisma.PostCreateOrConnectWithoutAuthorInput[];
    upsert?: Prisma.PostUpsertWithWhereUniqueWithoutAuthorInput | Prisma.PostUpsertWithWhereUniqueWithoutAuthorInput[];
    createMany?: Prisma.PostCreateManyAuthorInputEnvelope;
    set?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
    disconnect?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
    delete?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
    connect?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
    update?: Prisma.PostUpdateWithWhereUniqueWithoutAuthorInput | Prisma.PostUpdateWithWhereUniqueWithoutAuthorInput[];
    updateMany?: Prisma.PostUpdateManyWithWhereWithoutAuthorInput | Prisma.PostUpdateManyWithWhereWithoutAuthorInput[];
    deleteMany?: Prisma.PostScalarWhereInput | Prisma.PostScalarWhereInput[];
};
export type EnumPostStatusFieldUpdateOperationsInput = {
    set?: $Enums.PostStatus;
};
export type PostCreateNestedManyWithoutCategoriesInput = {
    create?: Prisma.XOR<Prisma.PostCreateWithoutCategoriesInput, Prisma.PostUncheckedCreateWithoutCategoriesInput> | Prisma.PostCreateWithoutCategoriesInput[] | Prisma.PostUncheckedCreateWithoutCategoriesInput[];
    connectOrCreate?: Prisma.PostCreateOrConnectWithoutCategoriesInput | Prisma.PostCreateOrConnectWithoutCategoriesInput[];
    connect?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
};
export type PostUncheckedCreateNestedManyWithoutCategoriesInput = {
    create?: Prisma.XOR<Prisma.PostCreateWithoutCategoriesInput, Prisma.PostUncheckedCreateWithoutCategoriesInput> | Prisma.PostCreateWithoutCategoriesInput[] | Prisma.PostUncheckedCreateWithoutCategoriesInput[];
    connectOrCreate?: Prisma.PostCreateOrConnectWithoutCategoriesInput | Prisma.PostCreateOrConnectWithoutCategoriesInput[];
    connect?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
};
export type PostUpdateManyWithoutCategoriesNestedInput = {
    create?: Prisma.XOR<Prisma.PostCreateWithoutCategoriesInput, Prisma.PostUncheckedCreateWithoutCategoriesInput> | Prisma.PostCreateWithoutCategoriesInput[] | Prisma.PostUncheckedCreateWithoutCategoriesInput[];
    connectOrCreate?: Prisma.PostCreateOrConnectWithoutCategoriesInput | Prisma.PostCreateOrConnectWithoutCategoriesInput[];
    upsert?: Prisma.PostUpsertWithWhereUniqueWithoutCategoriesInput | Prisma.PostUpsertWithWhereUniqueWithoutCategoriesInput[];
    set?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
    disconnect?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
    delete?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
    connect?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
    update?: Prisma.PostUpdateWithWhereUniqueWithoutCategoriesInput | Prisma.PostUpdateWithWhereUniqueWithoutCategoriesInput[];
    updateMany?: Prisma.PostUpdateManyWithWhereWithoutCategoriesInput | Prisma.PostUpdateManyWithWhereWithoutCategoriesInput[];
    deleteMany?: Prisma.PostScalarWhereInput | Prisma.PostScalarWhereInput[];
};
export type PostUncheckedUpdateManyWithoutCategoriesNestedInput = {
    create?: Prisma.XOR<Prisma.PostCreateWithoutCategoriesInput, Prisma.PostUncheckedCreateWithoutCategoriesInput> | Prisma.PostCreateWithoutCategoriesInput[] | Prisma.PostUncheckedCreateWithoutCategoriesInput[];
    connectOrCreate?: Prisma.PostCreateOrConnectWithoutCategoriesInput | Prisma.PostCreateOrConnectWithoutCategoriesInput[];
    upsert?: Prisma.PostUpsertWithWhereUniqueWithoutCategoriesInput | Prisma.PostUpsertWithWhereUniqueWithoutCategoriesInput[];
    set?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
    disconnect?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
    delete?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
    connect?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
    update?: Prisma.PostUpdateWithWhereUniqueWithoutCategoriesInput | Prisma.PostUpdateWithWhereUniqueWithoutCategoriesInput[];
    updateMany?: Prisma.PostUpdateManyWithWhereWithoutCategoriesInput | Prisma.PostUpdateManyWithWhereWithoutCategoriesInput[];
    deleteMany?: Prisma.PostScalarWhereInput | Prisma.PostScalarWhereInput[];
};
export type PostCreateNestedManyWithoutTagsInput = {
    create?: Prisma.XOR<Prisma.PostCreateWithoutTagsInput, Prisma.PostUncheckedCreateWithoutTagsInput> | Prisma.PostCreateWithoutTagsInput[] | Prisma.PostUncheckedCreateWithoutTagsInput[];
    connectOrCreate?: Prisma.PostCreateOrConnectWithoutTagsInput | Prisma.PostCreateOrConnectWithoutTagsInput[];
    connect?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
};
export type PostUncheckedCreateNestedManyWithoutTagsInput = {
    create?: Prisma.XOR<Prisma.PostCreateWithoutTagsInput, Prisma.PostUncheckedCreateWithoutTagsInput> | Prisma.PostCreateWithoutTagsInput[] | Prisma.PostUncheckedCreateWithoutTagsInput[];
    connectOrCreate?: Prisma.PostCreateOrConnectWithoutTagsInput | Prisma.PostCreateOrConnectWithoutTagsInput[];
    connect?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
};
export type PostUpdateManyWithoutTagsNestedInput = {
    create?: Prisma.XOR<Prisma.PostCreateWithoutTagsInput, Prisma.PostUncheckedCreateWithoutTagsInput> | Prisma.PostCreateWithoutTagsInput[] | Prisma.PostUncheckedCreateWithoutTagsInput[];
    connectOrCreate?: Prisma.PostCreateOrConnectWithoutTagsInput | Prisma.PostCreateOrConnectWithoutTagsInput[];
    upsert?: Prisma.PostUpsertWithWhereUniqueWithoutTagsInput | Prisma.PostUpsertWithWhereUniqueWithoutTagsInput[];
    set?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
    disconnect?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
    delete?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
    connect?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
    update?: Prisma.PostUpdateWithWhereUniqueWithoutTagsInput | Prisma.PostUpdateWithWhereUniqueWithoutTagsInput[];
    updateMany?: Prisma.PostUpdateManyWithWhereWithoutTagsInput | Prisma.PostUpdateManyWithWhereWithoutTagsInput[];
    deleteMany?: Prisma.PostScalarWhereInput | Prisma.PostScalarWhereInput[];
};
export type PostUncheckedUpdateManyWithoutTagsNestedInput = {
    create?: Prisma.XOR<Prisma.PostCreateWithoutTagsInput, Prisma.PostUncheckedCreateWithoutTagsInput> | Prisma.PostCreateWithoutTagsInput[] | Prisma.PostUncheckedCreateWithoutTagsInput[];
    connectOrCreate?: Prisma.PostCreateOrConnectWithoutTagsInput | Prisma.PostCreateOrConnectWithoutTagsInput[];
    upsert?: Prisma.PostUpsertWithWhereUniqueWithoutTagsInput | Prisma.PostUpsertWithWhereUniqueWithoutTagsInput[];
    set?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
    disconnect?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
    delete?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
    connect?: Prisma.PostWhereUniqueInput | Prisma.PostWhereUniqueInput[];
    update?: Prisma.PostUpdateWithWhereUniqueWithoutTagsInput | Prisma.PostUpdateWithWhereUniqueWithoutTagsInput[];
    updateMany?: Prisma.PostUpdateManyWithWhereWithoutTagsInput | Prisma.PostUpdateManyWithWhereWithoutTagsInput[];
    deleteMany?: Prisma.PostScalarWhereInput | Prisma.PostScalarWhereInput[];
};
export type PostCreateNestedOneWithoutCommentsInput = {
    create?: Prisma.XOR<Prisma.PostCreateWithoutCommentsInput, Prisma.PostUncheckedCreateWithoutCommentsInput>;
    connectOrCreate?: Prisma.PostCreateOrConnectWithoutCommentsInput;
    connect?: Prisma.PostWhereUniqueInput;
};
export type PostUpdateOneRequiredWithoutCommentsNestedInput = {
    create?: Prisma.XOR<Prisma.PostCreateWithoutCommentsInput, Prisma.PostUncheckedCreateWithoutCommentsInput>;
    connectOrCreate?: Prisma.PostCreateOrConnectWithoutCommentsInput;
    upsert?: Prisma.PostUpsertWithoutCommentsInput;
    connect?: Prisma.PostWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.PostUpdateToOneWithWhereWithoutCommentsInput, Prisma.PostUpdateWithoutCommentsInput>, Prisma.PostUncheckedUpdateWithoutCommentsInput>;
};
export type PostCreateNestedOneWithoutBookmarksInput = {
    create?: Prisma.XOR<Prisma.PostCreateWithoutBookmarksInput, Prisma.PostUncheckedCreateWithoutBookmarksInput>;
    connectOrCreate?: Prisma.PostCreateOrConnectWithoutBookmarksInput;
    connect?: Prisma.PostWhereUniqueInput;
};
export type PostUpdateOneRequiredWithoutBookmarksNestedInput = {
    create?: Prisma.XOR<Prisma.PostCreateWithoutBookmarksInput, Prisma.PostUncheckedCreateWithoutBookmarksInput>;
    connectOrCreate?: Prisma.PostCreateOrConnectWithoutBookmarksInput;
    upsert?: Prisma.PostUpsertWithoutBookmarksInput;
    connect?: Prisma.PostWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.PostUpdateToOneWithWhereWithoutBookmarksInput, Prisma.PostUpdateWithoutBookmarksInput>, Prisma.PostUncheckedUpdateWithoutBookmarksInput>;
};
export type PostCreateNestedOneWithoutPostLikesInput = {
    create?: Prisma.XOR<Prisma.PostCreateWithoutPostLikesInput, Prisma.PostUncheckedCreateWithoutPostLikesInput>;
    connectOrCreate?: Prisma.PostCreateOrConnectWithoutPostLikesInput;
    connect?: Prisma.PostWhereUniqueInput;
};
export type PostUpdateOneRequiredWithoutPostLikesNestedInput = {
    create?: Prisma.XOR<Prisma.PostCreateWithoutPostLikesInput, Prisma.PostUncheckedCreateWithoutPostLikesInput>;
    connectOrCreate?: Prisma.PostCreateOrConnectWithoutPostLikesInput;
    upsert?: Prisma.PostUpsertWithoutPostLikesInput;
    connect?: Prisma.PostWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.PostUpdateToOneWithWhereWithoutPostLikesInput, Prisma.PostUpdateWithoutPostLikesInput>, Prisma.PostUncheckedUpdateWithoutPostLikesInput>;
};
export type PostCreateWithoutAuthorInput = {
    id?: string;
    title: string;
    slug: string;
    content: string;
    status?: $Enums.PostStatus;
    publishedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    categories?: Prisma.CategoryCreateNestedManyWithoutPostsInput;
    tags?: Prisma.TagCreateNestedManyWithoutPostsInput;
    comments?: Prisma.CommentCreateNestedManyWithoutPostInput;
    bookmarks?: Prisma.BookmarkCreateNestedManyWithoutPostInput;
    postLikes?: Prisma.PostLikeCreateNestedManyWithoutPostInput;
};
export type PostUncheckedCreateWithoutAuthorInput = {
    id?: string;
    title: string;
    slug: string;
    content: string;
    status?: $Enums.PostStatus;
    publishedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    categories?: Prisma.CategoryUncheckedCreateNestedManyWithoutPostsInput;
    tags?: Prisma.TagUncheckedCreateNestedManyWithoutPostsInput;
    comments?: Prisma.CommentUncheckedCreateNestedManyWithoutPostInput;
    bookmarks?: Prisma.BookmarkUncheckedCreateNestedManyWithoutPostInput;
    postLikes?: Prisma.PostLikeUncheckedCreateNestedManyWithoutPostInput;
};
export type PostCreateOrConnectWithoutAuthorInput = {
    where: Prisma.PostWhereUniqueInput;
    create: Prisma.XOR<Prisma.PostCreateWithoutAuthorInput, Prisma.PostUncheckedCreateWithoutAuthorInput>;
};
export type PostCreateManyAuthorInputEnvelope = {
    data: Prisma.PostCreateManyAuthorInput | Prisma.PostCreateManyAuthorInput[];
    skipDuplicates?: boolean;
};
export type PostUpsertWithWhereUniqueWithoutAuthorInput = {
    where: Prisma.PostWhereUniqueInput;
    update: Prisma.XOR<Prisma.PostUpdateWithoutAuthorInput, Prisma.PostUncheckedUpdateWithoutAuthorInput>;
    create: Prisma.XOR<Prisma.PostCreateWithoutAuthorInput, Prisma.PostUncheckedCreateWithoutAuthorInput>;
};
export type PostUpdateWithWhereUniqueWithoutAuthorInput = {
    where: Prisma.PostWhereUniqueInput;
    data: Prisma.XOR<Prisma.PostUpdateWithoutAuthorInput, Prisma.PostUncheckedUpdateWithoutAuthorInput>;
};
export type PostUpdateManyWithWhereWithoutAuthorInput = {
    where: Prisma.PostScalarWhereInput;
    data: Prisma.XOR<Prisma.PostUpdateManyMutationInput, Prisma.PostUncheckedUpdateManyWithoutAuthorInput>;
};
export type PostScalarWhereInput = {
    AND?: Prisma.PostScalarWhereInput | Prisma.PostScalarWhereInput[];
    OR?: Prisma.PostScalarWhereInput[];
    NOT?: Prisma.PostScalarWhereInput | Prisma.PostScalarWhereInput[];
    id?: Prisma.StringFilter<"Post"> | string;
    title?: Prisma.StringFilter<"Post"> | string;
    slug?: Prisma.StringFilter<"Post"> | string;
    content?: Prisma.StringFilter<"Post"> | string;
    status?: Prisma.EnumPostStatusFilter<"Post"> | $Enums.PostStatus;
    publishedAt?: Prisma.DateTimeNullableFilter<"Post"> | Date | string | null;
    authorId?: Prisma.StringFilter<"Post"> | string;
    createdAt?: Prisma.DateTimeFilter<"Post"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Post"> | Date | string;
};
export type PostCreateWithoutCategoriesInput = {
    id?: string;
    title: string;
    slug: string;
    content: string;
    status?: $Enums.PostStatus;
    publishedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    author: Prisma.UserCreateNestedOneWithoutPostsInput;
    tags?: Prisma.TagCreateNestedManyWithoutPostsInput;
    comments?: Prisma.CommentCreateNestedManyWithoutPostInput;
    bookmarks?: Prisma.BookmarkCreateNestedManyWithoutPostInput;
    postLikes?: Prisma.PostLikeCreateNestedManyWithoutPostInput;
};
export type PostUncheckedCreateWithoutCategoriesInput = {
    id?: string;
    title: string;
    slug: string;
    content: string;
    status?: $Enums.PostStatus;
    publishedAt?: Date | string | null;
    authorId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    tags?: Prisma.TagUncheckedCreateNestedManyWithoutPostsInput;
    comments?: Prisma.CommentUncheckedCreateNestedManyWithoutPostInput;
    bookmarks?: Prisma.BookmarkUncheckedCreateNestedManyWithoutPostInput;
    postLikes?: Prisma.PostLikeUncheckedCreateNestedManyWithoutPostInput;
};
export type PostCreateOrConnectWithoutCategoriesInput = {
    where: Prisma.PostWhereUniqueInput;
    create: Prisma.XOR<Prisma.PostCreateWithoutCategoriesInput, Prisma.PostUncheckedCreateWithoutCategoriesInput>;
};
export type PostUpsertWithWhereUniqueWithoutCategoriesInput = {
    where: Prisma.PostWhereUniqueInput;
    update: Prisma.XOR<Prisma.PostUpdateWithoutCategoriesInput, Prisma.PostUncheckedUpdateWithoutCategoriesInput>;
    create: Prisma.XOR<Prisma.PostCreateWithoutCategoriesInput, Prisma.PostUncheckedCreateWithoutCategoriesInput>;
};
export type PostUpdateWithWhereUniqueWithoutCategoriesInput = {
    where: Prisma.PostWhereUniqueInput;
    data: Prisma.XOR<Prisma.PostUpdateWithoutCategoriesInput, Prisma.PostUncheckedUpdateWithoutCategoriesInput>;
};
export type PostUpdateManyWithWhereWithoutCategoriesInput = {
    where: Prisma.PostScalarWhereInput;
    data: Prisma.XOR<Prisma.PostUpdateManyMutationInput, Prisma.PostUncheckedUpdateManyWithoutCategoriesInput>;
};
export type PostCreateWithoutTagsInput = {
    id?: string;
    title: string;
    slug: string;
    content: string;
    status?: $Enums.PostStatus;
    publishedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    author: Prisma.UserCreateNestedOneWithoutPostsInput;
    categories?: Prisma.CategoryCreateNestedManyWithoutPostsInput;
    comments?: Prisma.CommentCreateNestedManyWithoutPostInput;
    bookmarks?: Prisma.BookmarkCreateNestedManyWithoutPostInput;
    postLikes?: Prisma.PostLikeCreateNestedManyWithoutPostInput;
};
export type PostUncheckedCreateWithoutTagsInput = {
    id?: string;
    title: string;
    slug: string;
    content: string;
    status?: $Enums.PostStatus;
    publishedAt?: Date | string | null;
    authorId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    categories?: Prisma.CategoryUncheckedCreateNestedManyWithoutPostsInput;
    comments?: Prisma.CommentUncheckedCreateNestedManyWithoutPostInput;
    bookmarks?: Prisma.BookmarkUncheckedCreateNestedManyWithoutPostInput;
    postLikes?: Prisma.PostLikeUncheckedCreateNestedManyWithoutPostInput;
};
export type PostCreateOrConnectWithoutTagsInput = {
    where: Prisma.PostWhereUniqueInput;
    create: Prisma.XOR<Prisma.PostCreateWithoutTagsInput, Prisma.PostUncheckedCreateWithoutTagsInput>;
};
export type PostUpsertWithWhereUniqueWithoutTagsInput = {
    where: Prisma.PostWhereUniqueInput;
    update: Prisma.XOR<Prisma.PostUpdateWithoutTagsInput, Prisma.PostUncheckedUpdateWithoutTagsInput>;
    create: Prisma.XOR<Prisma.PostCreateWithoutTagsInput, Prisma.PostUncheckedCreateWithoutTagsInput>;
};
export type PostUpdateWithWhereUniqueWithoutTagsInput = {
    where: Prisma.PostWhereUniqueInput;
    data: Prisma.XOR<Prisma.PostUpdateWithoutTagsInput, Prisma.PostUncheckedUpdateWithoutTagsInput>;
};
export type PostUpdateManyWithWhereWithoutTagsInput = {
    where: Prisma.PostScalarWhereInput;
    data: Prisma.XOR<Prisma.PostUpdateManyMutationInput, Prisma.PostUncheckedUpdateManyWithoutTagsInput>;
};
export type PostCreateWithoutCommentsInput = {
    id?: string;
    title: string;
    slug: string;
    content: string;
    status?: $Enums.PostStatus;
    publishedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    author: Prisma.UserCreateNestedOneWithoutPostsInput;
    categories?: Prisma.CategoryCreateNestedManyWithoutPostsInput;
    tags?: Prisma.TagCreateNestedManyWithoutPostsInput;
    bookmarks?: Prisma.BookmarkCreateNestedManyWithoutPostInput;
    postLikes?: Prisma.PostLikeCreateNestedManyWithoutPostInput;
};
export type PostUncheckedCreateWithoutCommentsInput = {
    id?: string;
    title: string;
    slug: string;
    content: string;
    status?: $Enums.PostStatus;
    publishedAt?: Date | string | null;
    authorId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    categories?: Prisma.CategoryUncheckedCreateNestedManyWithoutPostsInput;
    tags?: Prisma.TagUncheckedCreateNestedManyWithoutPostsInput;
    bookmarks?: Prisma.BookmarkUncheckedCreateNestedManyWithoutPostInput;
    postLikes?: Prisma.PostLikeUncheckedCreateNestedManyWithoutPostInput;
};
export type PostCreateOrConnectWithoutCommentsInput = {
    where: Prisma.PostWhereUniqueInput;
    create: Prisma.XOR<Prisma.PostCreateWithoutCommentsInput, Prisma.PostUncheckedCreateWithoutCommentsInput>;
};
export type PostUpsertWithoutCommentsInput = {
    update: Prisma.XOR<Prisma.PostUpdateWithoutCommentsInput, Prisma.PostUncheckedUpdateWithoutCommentsInput>;
    create: Prisma.XOR<Prisma.PostCreateWithoutCommentsInput, Prisma.PostUncheckedCreateWithoutCommentsInput>;
    where?: Prisma.PostWhereInput;
};
export type PostUpdateToOneWithWhereWithoutCommentsInput = {
    where?: Prisma.PostWhereInput;
    data: Prisma.XOR<Prisma.PostUpdateWithoutCommentsInput, Prisma.PostUncheckedUpdateWithoutCommentsInput>;
};
export type PostUpdateWithoutCommentsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    content?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumPostStatusFieldUpdateOperationsInput | $Enums.PostStatus;
    publishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    author?: Prisma.UserUpdateOneRequiredWithoutPostsNestedInput;
    categories?: Prisma.CategoryUpdateManyWithoutPostsNestedInput;
    tags?: Prisma.TagUpdateManyWithoutPostsNestedInput;
    bookmarks?: Prisma.BookmarkUpdateManyWithoutPostNestedInput;
    postLikes?: Prisma.PostLikeUpdateManyWithoutPostNestedInput;
};
export type PostUncheckedUpdateWithoutCommentsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    content?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumPostStatusFieldUpdateOperationsInput | $Enums.PostStatus;
    publishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    authorId?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    categories?: Prisma.CategoryUncheckedUpdateManyWithoutPostsNestedInput;
    tags?: Prisma.TagUncheckedUpdateManyWithoutPostsNestedInput;
    bookmarks?: Prisma.BookmarkUncheckedUpdateManyWithoutPostNestedInput;
    postLikes?: Prisma.PostLikeUncheckedUpdateManyWithoutPostNestedInput;
};
export type PostCreateWithoutBookmarksInput = {
    id?: string;
    title: string;
    slug: string;
    content: string;
    status?: $Enums.PostStatus;
    publishedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    author: Prisma.UserCreateNestedOneWithoutPostsInput;
    categories?: Prisma.CategoryCreateNestedManyWithoutPostsInput;
    tags?: Prisma.TagCreateNestedManyWithoutPostsInput;
    comments?: Prisma.CommentCreateNestedManyWithoutPostInput;
    postLikes?: Prisma.PostLikeCreateNestedManyWithoutPostInput;
};
export type PostUncheckedCreateWithoutBookmarksInput = {
    id?: string;
    title: string;
    slug: string;
    content: string;
    status?: $Enums.PostStatus;
    publishedAt?: Date | string | null;
    authorId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    categories?: Prisma.CategoryUncheckedCreateNestedManyWithoutPostsInput;
    tags?: Prisma.TagUncheckedCreateNestedManyWithoutPostsInput;
    comments?: Prisma.CommentUncheckedCreateNestedManyWithoutPostInput;
    postLikes?: Prisma.PostLikeUncheckedCreateNestedManyWithoutPostInput;
};
export type PostCreateOrConnectWithoutBookmarksInput = {
    where: Prisma.PostWhereUniqueInput;
    create: Prisma.XOR<Prisma.PostCreateWithoutBookmarksInput, Prisma.PostUncheckedCreateWithoutBookmarksInput>;
};
export type PostUpsertWithoutBookmarksInput = {
    update: Prisma.XOR<Prisma.PostUpdateWithoutBookmarksInput, Prisma.PostUncheckedUpdateWithoutBookmarksInput>;
    create: Prisma.XOR<Prisma.PostCreateWithoutBookmarksInput, Prisma.PostUncheckedCreateWithoutBookmarksInput>;
    where?: Prisma.PostWhereInput;
};
export type PostUpdateToOneWithWhereWithoutBookmarksInput = {
    where?: Prisma.PostWhereInput;
    data: Prisma.XOR<Prisma.PostUpdateWithoutBookmarksInput, Prisma.PostUncheckedUpdateWithoutBookmarksInput>;
};
export type PostUpdateWithoutBookmarksInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    content?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumPostStatusFieldUpdateOperationsInput | $Enums.PostStatus;
    publishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    author?: Prisma.UserUpdateOneRequiredWithoutPostsNestedInput;
    categories?: Prisma.CategoryUpdateManyWithoutPostsNestedInput;
    tags?: Prisma.TagUpdateManyWithoutPostsNestedInput;
    comments?: Prisma.CommentUpdateManyWithoutPostNestedInput;
    postLikes?: Prisma.PostLikeUpdateManyWithoutPostNestedInput;
};
export type PostUncheckedUpdateWithoutBookmarksInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    content?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumPostStatusFieldUpdateOperationsInput | $Enums.PostStatus;
    publishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    authorId?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    categories?: Prisma.CategoryUncheckedUpdateManyWithoutPostsNestedInput;
    tags?: Prisma.TagUncheckedUpdateManyWithoutPostsNestedInput;
    comments?: Prisma.CommentUncheckedUpdateManyWithoutPostNestedInput;
    postLikes?: Prisma.PostLikeUncheckedUpdateManyWithoutPostNestedInput;
};
export type PostCreateWithoutPostLikesInput = {
    id?: string;
    title: string;
    slug: string;
    content: string;
    status?: $Enums.PostStatus;
    publishedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    author: Prisma.UserCreateNestedOneWithoutPostsInput;
    categories?: Prisma.CategoryCreateNestedManyWithoutPostsInput;
    tags?: Prisma.TagCreateNestedManyWithoutPostsInput;
    comments?: Prisma.CommentCreateNestedManyWithoutPostInput;
    bookmarks?: Prisma.BookmarkCreateNestedManyWithoutPostInput;
};
export type PostUncheckedCreateWithoutPostLikesInput = {
    id?: string;
    title: string;
    slug: string;
    content: string;
    status?: $Enums.PostStatus;
    publishedAt?: Date | string | null;
    authorId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    categories?: Prisma.CategoryUncheckedCreateNestedManyWithoutPostsInput;
    tags?: Prisma.TagUncheckedCreateNestedManyWithoutPostsInput;
    comments?: Prisma.CommentUncheckedCreateNestedManyWithoutPostInput;
    bookmarks?: Prisma.BookmarkUncheckedCreateNestedManyWithoutPostInput;
};
export type PostCreateOrConnectWithoutPostLikesInput = {
    where: Prisma.PostWhereUniqueInput;
    create: Prisma.XOR<Prisma.PostCreateWithoutPostLikesInput, Prisma.PostUncheckedCreateWithoutPostLikesInput>;
};
export type PostUpsertWithoutPostLikesInput = {
    update: Prisma.XOR<Prisma.PostUpdateWithoutPostLikesInput, Prisma.PostUncheckedUpdateWithoutPostLikesInput>;
    create: Prisma.XOR<Prisma.PostCreateWithoutPostLikesInput, Prisma.PostUncheckedCreateWithoutPostLikesInput>;
    where?: Prisma.PostWhereInput;
};
export type PostUpdateToOneWithWhereWithoutPostLikesInput = {
    where?: Prisma.PostWhereInput;
    data: Prisma.XOR<Prisma.PostUpdateWithoutPostLikesInput, Prisma.PostUncheckedUpdateWithoutPostLikesInput>;
};
export type PostUpdateWithoutPostLikesInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    content?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumPostStatusFieldUpdateOperationsInput | $Enums.PostStatus;
    publishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    author?: Prisma.UserUpdateOneRequiredWithoutPostsNestedInput;
    categories?: Prisma.CategoryUpdateManyWithoutPostsNestedInput;
    tags?: Prisma.TagUpdateManyWithoutPostsNestedInput;
    comments?: Prisma.CommentUpdateManyWithoutPostNestedInput;
    bookmarks?: Prisma.BookmarkUpdateManyWithoutPostNestedInput;
};
export type PostUncheckedUpdateWithoutPostLikesInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    content?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumPostStatusFieldUpdateOperationsInput | $Enums.PostStatus;
    publishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    authorId?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    categories?: Prisma.CategoryUncheckedUpdateManyWithoutPostsNestedInput;
    tags?: Prisma.TagUncheckedUpdateManyWithoutPostsNestedInput;
    comments?: Prisma.CommentUncheckedUpdateManyWithoutPostNestedInput;
    bookmarks?: Prisma.BookmarkUncheckedUpdateManyWithoutPostNestedInput;
};
export type PostCreateManyAuthorInput = {
    id?: string;
    title: string;
    slug: string;
    content: string;
    status?: $Enums.PostStatus;
    publishedAt?: Date | string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type PostUpdateWithoutAuthorInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    content?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumPostStatusFieldUpdateOperationsInput | $Enums.PostStatus;
    publishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    categories?: Prisma.CategoryUpdateManyWithoutPostsNestedInput;
    tags?: Prisma.TagUpdateManyWithoutPostsNestedInput;
    comments?: Prisma.CommentUpdateManyWithoutPostNestedInput;
    bookmarks?: Prisma.BookmarkUpdateManyWithoutPostNestedInput;
    postLikes?: Prisma.PostLikeUpdateManyWithoutPostNestedInput;
};
export type PostUncheckedUpdateWithoutAuthorInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    content?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumPostStatusFieldUpdateOperationsInput | $Enums.PostStatus;
    publishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    categories?: Prisma.CategoryUncheckedUpdateManyWithoutPostsNestedInput;
    tags?: Prisma.TagUncheckedUpdateManyWithoutPostsNestedInput;
    comments?: Prisma.CommentUncheckedUpdateManyWithoutPostNestedInput;
    bookmarks?: Prisma.BookmarkUncheckedUpdateManyWithoutPostNestedInput;
    postLikes?: Prisma.PostLikeUncheckedUpdateManyWithoutPostNestedInput;
};
export type PostUncheckedUpdateManyWithoutAuthorInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    content?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumPostStatusFieldUpdateOperationsInput | $Enums.PostStatus;
    publishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PostUpdateWithoutCategoriesInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    content?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumPostStatusFieldUpdateOperationsInput | $Enums.PostStatus;
    publishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    author?: Prisma.UserUpdateOneRequiredWithoutPostsNestedInput;
    tags?: Prisma.TagUpdateManyWithoutPostsNestedInput;
    comments?: Prisma.CommentUpdateManyWithoutPostNestedInput;
    bookmarks?: Prisma.BookmarkUpdateManyWithoutPostNestedInput;
    postLikes?: Prisma.PostLikeUpdateManyWithoutPostNestedInput;
};
export type PostUncheckedUpdateWithoutCategoriesInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    content?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumPostStatusFieldUpdateOperationsInput | $Enums.PostStatus;
    publishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    authorId?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    tags?: Prisma.TagUncheckedUpdateManyWithoutPostsNestedInput;
    comments?: Prisma.CommentUncheckedUpdateManyWithoutPostNestedInput;
    bookmarks?: Prisma.BookmarkUncheckedUpdateManyWithoutPostNestedInput;
    postLikes?: Prisma.PostLikeUncheckedUpdateManyWithoutPostNestedInput;
};
export type PostUncheckedUpdateManyWithoutCategoriesInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    content?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumPostStatusFieldUpdateOperationsInput | $Enums.PostStatus;
    publishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    authorId?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PostUpdateWithoutTagsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    content?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumPostStatusFieldUpdateOperationsInput | $Enums.PostStatus;
    publishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    author?: Prisma.UserUpdateOneRequiredWithoutPostsNestedInput;
    categories?: Prisma.CategoryUpdateManyWithoutPostsNestedInput;
    comments?: Prisma.CommentUpdateManyWithoutPostNestedInput;
    bookmarks?: Prisma.BookmarkUpdateManyWithoutPostNestedInput;
    postLikes?: Prisma.PostLikeUpdateManyWithoutPostNestedInput;
};
export type PostUncheckedUpdateWithoutTagsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    content?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumPostStatusFieldUpdateOperationsInput | $Enums.PostStatus;
    publishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    authorId?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    categories?: Prisma.CategoryUncheckedUpdateManyWithoutPostsNestedInput;
    comments?: Prisma.CommentUncheckedUpdateManyWithoutPostNestedInput;
    bookmarks?: Prisma.BookmarkUncheckedUpdateManyWithoutPostNestedInput;
    postLikes?: Prisma.PostLikeUncheckedUpdateManyWithoutPostNestedInput;
};
export type PostUncheckedUpdateManyWithoutTagsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    title?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    content?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.EnumPostStatusFieldUpdateOperationsInput | $Enums.PostStatus;
    publishedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    authorId?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PostCountOutputType = {
    categories: number;
    tags: number;
    comments: number;
    bookmarks: number;
    postLikes: number;
};
export type PostCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    categories?: boolean | PostCountOutputTypeCountCategoriesArgs;
    tags?: boolean | PostCountOutputTypeCountTagsArgs;
    comments?: boolean | PostCountOutputTypeCountCommentsArgs;
    bookmarks?: boolean | PostCountOutputTypeCountBookmarksArgs;
    postLikes?: boolean | PostCountOutputTypeCountPostLikesArgs;
};
export type PostCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PostCountOutputTypeSelect<ExtArgs> | null;
};
export type PostCountOutputTypeCountCategoriesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.CategoryWhereInput;
};
export type PostCountOutputTypeCountTagsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.TagWhereInput;
};
export type PostCountOutputTypeCountCommentsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.CommentWhereInput;
};
export type PostCountOutputTypeCountBookmarksArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.BookmarkWhereInput;
};
export type PostCountOutputTypeCountPostLikesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PostLikeWhereInput;
};
export type PostSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    title?: boolean;
    slug?: boolean;
    content?: boolean;
    status?: boolean;
    publishedAt?: boolean;
    authorId?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    author?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    categories?: boolean | Prisma.Post$categoriesArgs<ExtArgs>;
    tags?: boolean | Prisma.Post$tagsArgs<ExtArgs>;
    comments?: boolean | Prisma.Post$commentsArgs<ExtArgs>;
    bookmarks?: boolean | Prisma.Post$bookmarksArgs<ExtArgs>;
    postLikes?: boolean | Prisma.Post$postLikesArgs<ExtArgs>;
    _count?: boolean | Prisma.PostCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["post"]>;
export type PostSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    title?: boolean;
    slug?: boolean;
    content?: boolean;
    status?: boolean;
    publishedAt?: boolean;
    authorId?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    author?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["post"]>;
export type PostSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    title?: boolean;
    slug?: boolean;
    content?: boolean;
    status?: boolean;
    publishedAt?: boolean;
    authorId?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    author?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["post"]>;
export type PostSelectScalar = {
    id?: boolean;
    title?: boolean;
    slug?: boolean;
    content?: boolean;
    status?: boolean;
    publishedAt?: boolean;
    authorId?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type PostOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "title" | "slug" | "content" | "status" | "publishedAt" | "authorId" | "createdAt" | "updatedAt", ExtArgs["result"]["post"]>;
export type PostInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    author?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    categories?: boolean | Prisma.Post$categoriesArgs<ExtArgs>;
    tags?: boolean | Prisma.Post$tagsArgs<ExtArgs>;
    comments?: boolean | Prisma.Post$commentsArgs<ExtArgs>;
    bookmarks?: boolean | Prisma.Post$bookmarksArgs<ExtArgs>;
    postLikes?: boolean | Prisma.Post$postLikesArgs<ExtArgs>;
    _count?: boolean | Prisma.PostCountOutputTypeDefaultArgs<ExtArgs>;
};
export type PostIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    author?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type PostIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    author?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type $PostPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Post";
    objects: {
        author: Prisma.$UserPayload<ExtArgs>;
        categories: Prisma.$CategoryPayload<ExtArgs>[];
        tags: Prisma.$TagPayload<ExtArgs>[];
        comments: Prisma.$CommentPayload<ExtArgs>[];
        bookmarks: Prisma.$BookmarkPayload<ExtArgs>[];
        postLikes: Prisma.$PostLikePayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        title: string;
        slug: string;
        content: string;
        status: $Enums.PostStatus;
        publishedAt: Date | null;
        authorId: string;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["post"]>;
    composites: {};
};
export type PostGetPayload<S extends boolean | null | undefined | PostDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$PostPayload, S>;
export type PostCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<PostFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: PostCountAggregateInputType | true;
};
export interface PostDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Post'];
        meta: {
            name: 'Post';
        };
    };
    findUnique<T extends PostFindUniqueArgs>(args: Prisma.SelectSubset<T, PostFindUniqueArgs<ExtArgs>>): Prisma.Prisma__PostClient<runtime.Types.Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends PostFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, PostFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__PostClient<runtime.Types.Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends PostFindFirstArgs>(args?: Prisma.SelectSubset<T, PostFindFirstArgs<ExtArgs>>): Prisma.Prisma__PostClient<runtime.Types.Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends PostFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, PostFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__PostClient<runtime.Types.Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends PostFindManyArgs>(args?: Prisma.SelectSubset<T, PostFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends PostCreateArgs>(args: Prisma.SelectSubset<T, PostCreateArgs<ExtArgs>>): Prisma.Prisma__PostClient<runtime.Types.Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends PostCreateManyArgs>(args?: Prisma.SelectSubset<T, PostCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends PostCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, PostCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends PostDeleteArgs>(args: Prisma.SelectSubset<T, PostDeleteArgs<ExtArgs>>): Prisma.Prisma__PostClient<runtime.Types.Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends PostUpdateArgs>(args: Prisma.SelectSubset<T, PostUpdateArgs<ExtArgs>>): Prisma.Prisma__PostClient<runtime.Types.Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends PostDeleteManyArgs>(args?: Prisma.SelectSubset<T, PostDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends PostUpdateManyArgs>(args: Prisma.SelectSubset<T, PostUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends PostUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, PostUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends PostUpsertArgs>(args: Prisma.SelectSubset<T, PostUpsertArgs<ExtArgs>>): Prisma.Prisma__PostClient<runtime.Types.Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends PostCountArgs>(args?: Prisma.Subset<T, PostCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], PostCountAggregateOutputType> : number>;
    aggregate<T extends PostAggregateArgs>(args: Prisma.Subset<T, PostAggregateArgs>): Prisma.PrismaPromise<GetPostAggregateType<T>>;
    groupBy<T extends PostGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: PostGroupByArgs['orderBy'];
    } : {
        orderBy?: PostGroupByArgs['orderBy'];
    }, OrderFields extends Prisma.ExcludeUnderscoreKeys<Prisma.Keys<Prisma.MaybeTupleToUnion<T['orderBy']>>>, ByFields extends Prisma.MaybeTupleToUnion<T['by']>, ByValid extends Prisma.Has<ByFields, OrderFields>, HavingFields extends Prisma.GetHavingFields<T['having']>, HavingValid extends Prisma.Has<ByFields, HavingFields>, ByEmpty extends T['by'] extends never[] ? Prisma.True : Prisma.False, InputErrors extends ByEmpty extends Prisma.True ? `Error: "by" must not be empty.` : HavingValid extends Prisma.False ? {
        [P in HavingFields]: P extends ByFields ? never : P extends string ? `Error: Field "${P}" used in "having" needs to be provided in "by".` : [
            Error,
            'Field ',
            P,
            ` in "having" needs to be provided in "by"`
        ];
    }[HavingFields] : 'take' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "take", you also need to provide "orderBy"' : 'skip' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "skip", you also need to provide "orderBy"' : ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, PostGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPostGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: PostFieldRefs;
}
export interface Prisma__PostClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    author<T extends Prisma.UserDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.UserDefaultArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    categories<T extends Prisma.Post$categoriesArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Post$categoriesArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    tags<T extends Prisma.Post$tagsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Post$tagsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$TagPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    comments<T extends Prisma.Post$commentsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Post$commentsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    bookmarks<T extends Prisma.Post$bookmarksArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Post$bookmarksArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$BookmarkPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    postLikes<T extends Prisma.Post$postLikesArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Post$postLikesArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PostLikePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface PostFieldRefs {
    readonly id: Prisma.FieldRef<"Post", 'String'>;
    readonly title: Prisma.FieldRef<"Post", 'String'>;
    readonly slug: Prisma.FieldRef<"Post", 'String'>;
    readonly content: Prisma.FieldRef<"Post", 'String'>;
    readonly status: Prisma.FieldRef<"Post", 'PostStatus'>;
    readonly publishedAt: Prisma.FieldRef<"Post", 'DateTime'>;
    readonly authorId: Prisma.FieldRef<"Post", 'String'>;
    readonly createdAt: Prisma.FieldRef<"Post", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"Post", 'DateTime'>;
}
export type PostFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PostSelect<ExtArgs> | null;
    omit?: Prisma.PostOmit<ExtArgs> | null;
    include?: Prisma.PostInclude<ExtArgs> | null;
    where: Prisma.PostWhereUniqueInput;
};
export type PostFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PostSelect<ExtArgs> | null;
    omit?: Prisma.PostOmit<ExtArgs> | null;
    include?: Prisma.PostInclude<ExtArgs> | null;
    where: Prisma.PostWhereUniqueInput;
};
export type PostFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PostSelect<ExtArgs> | null;
    omit?: Prisma.PostOmit<ExtArgs> | null;
    include?: Prisma.PostInclude<ExtArgs> | null;
    where?: Prisma.PostWhereInput;
    orderBy?: Prisma.PostOrderByWithRelationInput | Prisma.PostOrderByWithRelationInput[];
    cursor?: Prisma.PostWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.PostScalarFieldEnum | Prisma.PostScalarFieldEnum[];
};
export type PostFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PostSelect<ExtArgs> | null;
    omit?: Prisma.PostOmit<ExtArgs> | null;
    include?: Prisma.PostInclude<ExtArgs> | null;
    where?: Prisma.PostWhereInput;
    orderBy?: Prisma.PostOrderByWithRelationInput | Prisma.PostOrderByWithRelationInput[];
    cursor?: Prisma.PostWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.PostScalarFieldEnum | Prisma.PostScalarFieldEnum[];
};
export type PostFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PostSelect<ExtArgs> | null;
    omit?: Prisma.PostOmit<ExtArgs> | null;
    include?: Prisma.PostInclude<ExtArgs> | null;
    where?: Prisma.PostWhereInput;
    orderBy?: Prisma.PostOrderByWithRelationInput | Prisma.PostOrderByWithRelationInput[];
    cursor?: Prisma.PostWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.PostScalarFieldEnum | Prisma.PostScalarFieldEnum[];
};
export type PostCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PostSelect<ExtArgs> | null;
    omit?: Prisma.PostOmit<ExtArgs> | null;
    include?: Prisma.PostInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.PostCreateInput, Prisma.PostUncheckedCreateInput>;
};
export type PostCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.PostCreateManyInput | Prisma.PostCreateManyInput[];
    skipDuplicates?: boolean;
};
export type PostCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PostSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.PostOmit<ExtArgs> | null;
    data: Prisma.PostCreateManyInput | Prisma.PostCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.PostIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type PostUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PostSelect<ExtArgs> | null;
    omit?: Prisma.PostOmit<ExtArgs> | null;
    include?: Prisma.PostInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.PostUpdateInput, Prisma.PostUncheckedUpdateInput>;
    where: Prisma.PostWhereUniqueInput;
};
export type PostUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.PostUpdateManyMutationInput, Prisma.PostUncheckedUpdateManyInput>;
    where?: Prisma.PostWhereInput;
    limit?: number;
};
export type PostUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PostSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.PostOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.PostUpdateManyMutationInput, Prisma.PostUncheckedUpdateManyInput>;
    where?: Prisma.PostWhereInput;
    limit?: number;
    include?: Prisma.PostIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type PostUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PostSelect<ExtArgs> | null;
    omit?: Prisma.PostOmit<ExtArgs> | null;
    include?: Prisma.PostInclude<ExtArgs> | null;
    where: Prisma.PostWhereUniqueInput;
    create: Prisma.XOR<Prisma.PostCreateInput, Prisma.PostUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.PostUpdateInput, Prisma.PostUncheckedUpdateInput>;
};
export type PostDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PostSelect<ExtArgs> | null;
    omit?: Prisma.PostOmit<ExtArgs> | null;
    include?: Prisma.PostInclude<ExtArgs> | null;
    where: Prisma.PostWhereUniqueInput;
};
export type PostDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PostWhereInput;
    limit?: number;
};
export type Post$categoriesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CategorySelect<ExtArgs> | null;
    omit?: Prisma.CategoryOmit<ExtArgs> | null;
    include?: Prisma.CategoryInclude<ExtArgs> | null;
    where?: Prisma.CategoryWhereInput;
    orderBy?: Prisma.CategoryOrderByWithRelationInput | Prisma.CategoryOrderByWithRelationInput[];
    cursor?: Prisma.CategoryWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.CategoryScalarFieldEnum | Prisma.CategoryScalarFieldEnum[];
};
export type Post$tagsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.TagSelect<ExtArgs> | null;
    omit?: Prisma.TagOmit<ExtArgs> | null;
    include?: Prisma.TagInclude<ExtArgs> | null;
    where?: Prisma.TagWhereInput;
    orderBy?: Prisma.TagOrderByWithRelationInput | Prisma.TagOrderByWithRelationInput[];
    cursor?: Prisma.TagWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.TagScalarFieldEnum | Prisma.TagScalarFieldEnum[];
};
export type Post$commentsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.CommentSelect<ExtArgs> | null;
    omit?: Prisma.CommentOmit<ExtArgs> | null;
    include?: Prisma.CommentInclude<ExtArgs> | null;
    where?: Prisma.CommentWhereInput;
    orderBy?: Prisma.CommentOrderByWithRelationInput | Prisma.CommentOrderByWithRelationInput[];
    cursor?: Prisma.CommentWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.CommentScalarFieldEnum | Prisma.CommentScalarFieldEnum[];
};
export type Post$bookmarksArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.BookmarkSelect<ExtArgs> | null;
    omit?: Prisma.BookmarkOmit<ExtArgs> | null;
    include?: Prisma.BookmarkInclude<ExtArgs> | null;
    where?: Prisma.BookmarkWhereInput;
    orderBy?: Prisma.BookmarkOrderByWithRelationInput | Prisma.BookmarkOrderByWithRelationInput[];
    cursor?: Prisma.BookmarkWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.BookmarkScalarFieldEnum | Prisma.BookmarkScalarFieldEnum[];
};
export type Post$postLikesArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PostLikeSelect<ExtArgs> | null;
    omit?: Prisma.PostLikeOmit<ExtArgs> | null;
    include?: Prisma.PostLikeInclude<ExtArgs> | null;
    where?: Prisma.PostLikeWhereInput;
    orderBy?: Prisma.PostLikeOrderByWithRelationInput | Prisma.PostLikeOrderByWithRelationInput[];
    cursor?: Prisma.PostLikeWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.PostLikeScalarFieldEnum | Prisma.PostLikeScalarFieldEnum[];
};
export type PostDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PostSelect<ExtArgs> | null;
    omit?: Prisma.PostOmit<ExtArgs> | null;
    include?: Prisma.PostInclude<ExtArgs> | null;
};
