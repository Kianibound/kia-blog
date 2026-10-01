import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type BookmarkModel = runtime.Types.Result.DefaultSelection<Prisma.$BookmarkPayload>;
export type AggregateBookmark = {
    _count: BookmarkCountAggregateOutputType | null;
    _min: BookmarkMinAggregateOutputType | null;
    _max: BookmarkMaxAggregateOutputType | null;
};
export type BookmarkMinAggregateOutputType = {
    id: string | null;
    userId: string | null;
    postId: string | null;
    createdAt: Date | null;
};
export type BookmarkMaxAggregateOutputType = {
    id: string | null;
    userId: string | null;
    postId: string | null;
    createdAt: Date | null;
};
export type BookmarkCountAggregateOutputType = {
    id: number;
    userId: number;
    postId: number;
    createdAt: number;
    _all: number;
};
export type BookmarkMinAggregateInputType = {
    id?: true;
    userId?: true;
    postId?: true;
    createdAt?: true;
};
export type BookmarkMaxAggregateInputType = {
    id?: true;
    userId?: true;
    postId?: true;
    createdAt?: true;
};
export type BookmarkCountAggregateInputType = {
    id?: true;
    userId?: true;
    postId?: true;
    createdAt?: true;
    _all?: true;
};
export type BookmarkAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.BookmarkWhereInput;
    orderBy?: Prisma.BookmarkOrderByWithRelationInput | Prisma.BookmarkOrderByWithRelationInput[];
    cursor?: Prisma.BookmarkWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | BookmarkCountAggregateInputType;
    _min?: BookmarkMinAggregateInputType;
    _max?: BookmarkMaxAggregateInputType;
};
export type GetBookmarkAggregateType<T extends BookmarkAggregateArgs> = {
    [P in keyof T & keyof AggregateBookmark]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateBookmark[P]> : Prisma.GetScalarType<T[P], AggregateBookmark[P]>;
};
export type BookmarkGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.BookmarkWhereInput;
    orderBy?: Prisma.BookmarkOrderByWithAggregationInput | Prisma.BookmarkOrderByWithAggregationInput[];
    by: Prisma.BookmarkScalarFieldEnum[] | Prisma.BookmarkScalarFieldEnum;
    having?: Prisma.BookmarkScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: BookmarkCountAggregateInputType | true;
    _min?: BookmarkMinAggregateInputType;
    _max?: BookmarkMaxAggregateInputType;
};
export type BookmarkGroupByOutputType = {
    id: string;
    userId: string;
    postId: string;
    createdAt: Date;
    _count: BookmarkCountAggregateOutputType | null;
    _min: BookmarkMinAggregateOutputType | null;
    _max: BookmarkMaxAggregateOutputType | null;
};
export type GetBookmarkGroupByPayload<T extends BookmarkGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<BookmarkGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof BookmarkGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], BookmarkGroupByOutputType[P]> : Prisma.GetScalarType<T[P], BookmarkGroupByOutputType[P]>;
}>>;
export type BookmarkWhereInput = {
    AND?: Prisma.BookmarkWhereInput | Prisma.BookmarkWhereInput[];
    OR?: Prisma.BookmarkWhereInput[];
    NOT?: Prisma.BookmarkWhereInput | Prisma.BookmarkWhereInput[];
    id?: Prisma.StringFilter<"Bookmark"> | string;
    userId?: Prisma.StringFilter<"Bookmark"> | string;
    postId?: Prisma.StringFilter<"Bookmark"> | string;
    createdAt?: Prisma.DateTimeFilter<"Bookmark"> | Date | string;
    user?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
    post?: Prisma.XOR<Prisma.PostScalarRelationFilter, Prisma.PostWhereInput>;
};
export type BookmarkOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    postId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    user?: Prisma.UserOrderByWithRelationInput;
    post?: Prisma.PostOrderByWithRelationInput;
};
export type BookmarkWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    userId_postId?: Prisma.BookmarkUserIdPostIdCompoundUniqueInput;
    AND?: Prisma.BookmarkWhereInput | Prisma.BookmarkWhereInput[];
    OR?: Prisma.BookmarkWhereInput[];
    NOT?: Prisma.BookmarkWhereInput | Prisma.BookmarkWhereInput[];
    userId?: Prisma.StringFilter<"Bookmark"> | string;
    postId?: Prisma.StringFilter<"Bookmark"> | string;
    createdAt?: Prisma.DateTimeFilter<"Bookmark"> | Date | string;
    user?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
    post?: Prisma.XOR<Prisma.PostScalarRelationFilter, Prisma.PostWhereInput>;
}, "id" | "userId_postId">;
export type BookmarkOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    postId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.BookmarkCountOrderByAggregateInput;
    _max?: Prisma.BookmarkMaxOrderByAggregateInput;
    _min?: Prisma.BookmarkMinOrderByAggregateInput;
};
export type BookmarkScalarWhereWithAggregatesInput = {
    AND?: Prisma.BookmarkScalarWhereWithAggregatesInput | Prisma.BookmarkScalarWhereWithAggregatesInput[];
    OR?: Prisma.BookmarkScalarWhereWithAggregatesInput[];
    NOT?: Prisma.BookmarkScalarWhereWithAggregatesInput | Prisma.BookmarkScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"Bookmark"> | string;
    userId?: Prisma.StringWithAggregatesFilter<"Bookmark"> | string;
    postId?: Prisma.StringWithAggregatesFilter<"Bookmark"> | string;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"Bookmark"> | Date | string;
};
export type BookmarkCreateInput = {
    id?: string;
    createdAt?: Date | string;
    user: Prisma.UserCreateNestedOneWithoutBookmarksInput;
    post: Prisma.PostCreateNestedOneWithoutBookmarksInput;
};
export type BookmarkUncheckedCreateInput = {
    id?: string;
    userId: string;
    postId: string;
    createdAt?: Date | string;
};
export type BookmarkUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    user?: Prisma.UserUpdateOneRequiredWithoutBookmarksNestedInput;
    post?: Prisma.PostUpdateOneRequiredWithoutBookmarksNestedInput;
};
export type BookmarkUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    postId?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type BookmarkCreateManyInput = {
    id?: string;
    userId: string;
    postId: string;
    createdAt?: Date | string;
};
export type BookmarkUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type BookmarkUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    postId?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type BookmarkListRelationFilter = {
    every?: Prisma.BookmarkWhereInput;
    some?: Prisma.BookmarkWhereInput;
    none?: Prisma.BookmarkWhereInput;
};
export type BookmarkOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type BookmarkUserIdPostIdCompoundUniqueInput = {
    userId: string;
    postId: string;
};
export type BookmarkCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    postId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type BookmarkMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    postId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type BookmarkMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    postId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type BookmarkCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.BookmarkCreateWithoutUserInput, Prisma.BookmarkUncheckedCreateWithoutUserInput> | Prisma.BookmarkCreateWithoutUserInput[] | Prisma.BookmarkUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.BookmarkCreateOrConnectWithoutUserInput | Prisma.BookmarkCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.BookmarkCreateManyUserInputEnvelope;
    connect?: Prisma.BookmarkWhereUniqueInput | Prisma.BookmarkWhereUniqueInput[];
};
export type BookmarkUncheckedCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.BookmarkCreateWithoutUserInput, Prisma.BookmarkUncheckedCreateWithoutUserInput> | Prisma.BookmarkCreateWithoutUserInput[] | Prisma.BookmarkUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.BookmarkCreateOrConnectWithoutUserInput | Prisma.BookmarkCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.BookmarkCreateManyUserInputEnvelope;
    connect?: Prisma.BookmarkWhereUniqueInput | Prisma.BookmarkWhereUniqueInput[];
};
export type BookmarkUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.BookmarkCreateWithoutUserInput, Prisma.BookmarkUncheckedCreateWithoutUserInput> | Prisma.BookmarkCreateWithoutUserInput[] | Prisma.BookmarkUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.BookmarkCreateOrConnectWithoutUserInput | Prisma.BookmarkCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.BookmarkUpsertWithWhereUniqueWithoutUserInput | Prisma.BookmarkUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.BookmarkCreateManyUserInputEnvelope;
    set?: Prisma.BookmarkWhereUniqueInput | Prisma.BookmarkWhereUniqueInput[];
    disconnect?: Prisma.BookmarkWhereUniqueInput | Prisma.BookmarkWhereUniqueInput[];
    delete?: Prisma.BookmarkWhereUniqueInput | Prisma.BookmarkWhereUniqueInput[];
    connect?: Prisma.BookmarkWhereUniqueInput | Prisma.BookmarkWhereUniqueInput[];
    update?: Prisma.BookmarkUpdateWithWhereUniqueWithoutUserInput | Prisma.BookmarkUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.BookmarkUpdateManyWithWhereWithoutUserInput | Prisma.BookmarkUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.BookmarkScalarWhereInput | Prisma.BookmarkScalarWhereInput[];
};
export type BookmarkUncheckedUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.BookmarkCreateWithoutUserInput, Prisma.BookmarkUncheckedCreateWithoutUserInput> | Prisma.BookmarkCreateWithoutUserInput[] | Prisma.BookmarkUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.BookmarkCreateOrConnectWithoutUserInput | Prisma.BookmarkCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.BookmarkUpsertWithWhereUniqueWithoutUserInput | Prisma.BookmarkUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.BookmarkCreateManyUserInputEnvelope;
    set?: Prisma.BookmarkWhereUniqueInput | Prisma.BookmarkWhereUniqueInput[];
    disconnect?: Prisma.BookmarkWhereUniqueInput | Prisma.BookmarkWhereUniqueInput[];
    delete?: Prisma.BookmarkWhereUniqueInput | Prisma.BookmarkWhereUniqueInput[];
    connect?: Prisma.BookmarkWhereUniqueInput | Prisma.BookmarkWhereUniqueInput[];
    update?: Prisma.BookmarkUpdateWithWhereUniqueWithoutUserInput | Prisma.BookmarkUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.BookmarkUpdateManyWithWhereWithoutUserInput | Prisma.BookmarkUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.BookmarkScalarWhereInput | Prisma.BookmarkScalarWhereInput[];
};
export type BookmarkCreateNestedManyWithoutPostInput = {
    create?: Prisma.XOR<Prisma.BookmarkCreateWithoutPostInput, Prisma.BookmarkUncheckedCreateWithoutPostInput> | Prisma.BookmarkCreateWithoutPostInput[] | Prisma.BookmarkUncheckedCreateWithoutPostInput[];
    connectOrCreate?: Prisma.BookmarkCreateOrConnectWithoutPostInput | Prisma.BookmarkCreateOrConnectWithoutPostInput[];
    createMany?: Prisma.BookmarkCreateManyPostInputEnvelope;
    connect?: Prisma.BookmarkWhereUniqueInput | Prisma.BookmarkWhereUniqueInput[];
};
export type BookmarkUncheckedCreateNestedManyWithoutPostInput = {
    create?: Prisma.XOR<Prisma.BookmarkCreateWithoutPostInput, Prisma.BookmarkUncheckedCreateWithoutPostInput> | Prisma.BookmarkCreateWithoutPostInput[] | Prisma.BookmarkUncheckedCreateWithoutPostInput[];
    connectOrCreate?: Prisma.BookmarkCreateOrConnectWithoutPostInput | Prisma.BookmarkCreateOrConnectWithoutPostInput[];
    createMany?: Prisma.BookmarkCreateManyPostInputEnvelope;
    connect?: Prisma.BookmarkWhereUniqueInput | Prisma.BookmarkWhereUniqueInput[];
};
export type BookmarkUpdateManyWithoutPostNestedInput = {
    create?: Prisma.XOR<Prisma.BookmarkCreateWithoutPostInput, Prisma.BookmarkUncheckedCreateWithoutPostInput> | Prisma.BookmarkCreateWithoutPostInput[] | Prisma.BookmarkUncheckedCreateWithoutPostInput[];
    connectOrCreate?: Prisma.BookmarkCreateOrConnectWithoutPostInput | Prisma.BookmarkCreateOrConnectWithoutPostInput[];
    upsert?: Prisma.BookmarkUpsertWithWhereUniqueWithoutPostInput | Prisma.BookmarkUpsertWithWhereUniqueWithoutPostInput[];
    createMany?: Prisma.BookmarkCreateManyPostInputEnvelope;
    set?: Prisma.BookmarkWhereUniqueInput | Prisma.BookmarkWhereUniqueInput[];
    disconnect?: Prisma.BookmarkWhereUniqueInput | Prisma.BookmarkWhereUniqueInput[];
    delete?: Prisma.BookmarkWhereUniqueInput | Prisma.BookmarkWhereUniqueInput[];
    connect?: Prisma.BookmarkWhereUniqueInput | Prisma.BookmarkWhereUniqueInput[];
    update?: Prisma.BookmarkUpdateWithWhereUniqueWithoutPostInput | Prisma.BookmarkUpdateWithWhereUniqueWithoutPostInput[];
    updateMany?: Prisma.BookmarkUpdateManyWithWhereWithoutPostInput | Prisma.BookmarkUpdateManyWithWhereWithoutPostInput[];
    deleteMany?: Prisma.BookmarkScalarWhereInput | Prisma.BookmarkScalarWhereInput[];
};
export type BookmarkUncheckedUpdateManyWithoutPostNestedInput = {
    create?: Prisma.XOR<Prisma.BookmarkCreateWithoutPostInput, Prisma.BookmarkUncheckedCreateWithoutPostInput> | Prisma.BookmarkCreateWithoutPostInput[] | Prisma.BookmarkUncheckedCreateWithoutPostInput[];
    connectOrCreate?: Prisma.BookmarkCreateOrConnectWithoutPostInput | Prisma.BookmarkCreateOrConnectWithoutPostInput[];
    upsert?: Prisma.BookmarkUpsertWithWhereUniqueWithoutPostInput | Prisma.BookmarkUpsertWithWhereUniqueWithoutPostInput[];
    createMany?: Prisma.BookmarkCreateManyPostInputEnvelope;
    set?: Prisma.BookmarkWhereUniqueInput | Prisma.BookmarkWhereUniqueInput[];
    disconnect?: Prisma.BookmarkWhereUniqueInput | Prisma.BookmarkWhereUniqueInput[];
    delete?: Prisma.BookmarkWhereUniqueInput | Prisma.BookmarkWhereUniqueInput[];
    connect?: Prisma.BookmarkWhereUniqueInput | Prisma.BookmarkWhereUniqueInput[];
    update?: Prisma.BookmarkUpdateWithWhereUniqueWithoutPostInput | Prisma.BookmarkUpdateWithWhereUniqueWithoutPostInput[];
    updateMany?: Prisma.BookmarkUpdateManyWithWhereWithoutPostInput | Prisma.BookmarkUpdateManyWithWhereWithoutPostInput[];
    deleteMany?: Prisma.BookmarkScalarWhereInput | Prisma.BookmarkScalarWhereInput[];
};
export type BookmarkCreateWithoutUserInput = {
    id?: string;
    createdAt?: Date | string;
    post: Prisma.PostCreateNestedOneWithoutBookmarksInput;
};
export type BookmarkUncheckedCreateWithoutUserInput = {
    id?: string;
    postId: string;
    createdAt?: Date | string;
};
export type BookmarkCreateOrConnectWithoutUserInput = {
    where: Prisma.BookmarkWhereUniqueInput;
    create: Prisma.XOR<Prisma.BookmarkCreateWithoutUserInput, Prisma.BookmarkUncheckedCreateWithoutUserInput>;
};
export type BookmarkCreateManyUserInputEnvelope = {
    data: Prisma.BookmarkCreateManyUserInput | Prisma.BookmarkCreateManyUserInput[];
    skipDuplicates?: boolean;
};
export type BookmarkUpsertWithWhereUniqueWithoutUserInput = {
    where: Prisma.BookmarkWhereUniqueInput;
    update: Prisma.XOR<Prisma.BookmarkUpdateWithoutUserInput, Prisma.BookmarkUncheckedUpdateWithoutUserInput>;
    create: Prisma.XOR<Prisma.BookmarkCreateWithoutUserInput, Prisma.BookmarkUncheckedCreateWithoutUserInput>;
};
export type BookmarkUpdateWithWhereUniqueWithoutUserInput = {
    where: Prisma.BookmarkWhereUniqueInput;
    data: Prisma.XOR<Prisma.BookmarkUpdateWithoutUserInput, Prisma.BookmarkUncheckedUpdateWithoutUserInput>;
};
export type BookmarkUpdateManyWithWhereWithoutUserInput = {
    where: Prisma.BookmarkScalarWhereInput;
    data: Prisma.XOR<Prisma.BookmarkUpdateManyMutationInput, Prisma.BookmarkUncheckedUpdateManyWithoutUserInput>;
};
export type BookmarkScalarWhereInput = {
    AND?: Prisma.BookmarkScalarWhereInput | Prisma.BookmarkScalarWhereInput[];
    OR?: Prisma.BookmarkScalarWhereInput[];
    NOT?: Prisma.BookmarkScalarWhereInput | Prisma.BookmarkScalarWhereInput[];
    id?: Prisma.StringFilter<"Bookmark"> | string;
    userId?: Prisma.StringFilter<"Bookmark"> | string;
    postId?: Prisma.StringFilter<"Bookmark"> | string;
    createdAt?: Prisma.DateTimeFilter<"Bookmark"> | Date | string;
};
export type BookmarkCreateWithoutPostInput = {
    id?: string;
    createdAt?: Date | string;
    user: Prisma.UserCreateNestedOneWithoutBookmarksInput;
};
export type BookmarkUncheckedCreateWithoutPostInput = {
    id?: string;
    userId: string;
    createdAt?: Date | string;
};
export type BookmarkCreateOrConnectWithoutPostInput = {
    where: Prisma.BookmarkWhereUniqueInput;
    create: Prisma.XOR<Prisma.BookmarkCreateWithoutPostInput, Prisma.BookmarkUncheckedCreateWithoutPostInput>;
};
export type BookmarkCreateManyPostInputEnvelope = {
    data: Prisma.BookmarkCreateManyPostInput | Prisma.BookmarkCreateManyPostInput[];
    skipDuplicates?: boolean;
};
export type BookmarkUpsertWithWhereUniqueWithoutPostInput = {
    where: Prisma.BookmarkWhereUniqueInput;
    update: Prisma.XOR<Prisma.BookmarkUpdateWithoutPostInput, Prisma.BookmarkUncheckedUpdateWithoutPostInput>;
    create: Prisma.XOR<Prisma.BookmarkCreateWithoutPostInput, Prisma.BookmarkUncheckedCreateWithoutPostInput>;
};
export type BookmarkUpdateWithWhereUniqueWithoutPostInput = {
    where: Prisma.BookmarkWhereUniqueInput;
    data: Prisma.XOR<Prisma.BookmarkUpdateWithoutPostInput, Prisma.BookmarkUncheckedUpdateWithoutPostInput>;
};
export type BookmarkUpdateManyWithWhereWithoutPostInput = {
    where: Prisma.BookmarkScalarWhereInput;
    data: Prisma.XOR<Prisma.BookmarkUpdateManyMutationInput, Prisma.BookmarkUncheckedUpdateManyWithoutPostInput>;
};
export type BookmarkCreateManyUserInput = {
    id?: string;
    postId: string;
    createdAt?: Date | string;
};
export type BookmarkUpdateWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    post?: Prisma.PostUpdateOneRequiredWithoutBookmarksNestedInput;
};
export type BookmarkUncheckedUpdateWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    postId?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type BookmarkUncheckedUpdateManyWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    postId?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type BookmarkCreateManyPostInput = {
    id?: string;
    userId: string;
    createdAt?: Date | string;
};
export type BookmarkUpdateWithoutPostInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    user?: Prisma.UserUpdateOneRequiredWithoutBookmarksNestedInput;
};
export type BookmarkUncheckedUpdateWithoutPostInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type BookmarkUncheckedUpdateManyWithoutPostInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type BookmarkSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    userId?: boolean;
    postId?: boolean;
    createdAt?: boolean;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    post?: boolean | Prisma.PostDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["bookmark"]>;
export type BookmarkSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    userId?: boolean;
    postId?: boolean;
    createdAt?: boolean;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    post?: boolean | Prisma.PostDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["bookmark"]>;
export type BookmarkSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    userId?: boolean;
    postId?: boolean;
    createdAt?: boolean;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    post?: boolean | Prisma.PostDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["bookmark"]>;
export type BookmarkSelectScalar = {
    id?: boolean;
    userId?: boolean;
    postId?: boolean;
    createdAt?: boolean;
};
export type BookmarkOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "userId" | "postId" | "createdAt", ExtArgs["result"]["bookmark"]>;
export type BookmarkInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    post?: boolean | Prisma.PostDefaultArgs<ExtArgs>;
};
export type BookmarkIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    post?: boolean | Prisma.PostDefaultArgs<ExtArgs>;
};
export type BookmarkIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    post?: boolean | Prisma.PostDefaultArgs<ExtArgs>;
};
export type $BookmarkPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Bookmark";
    objects: {
        user: Prisma.$UserPayload<ExtArgs>;
        post: Prisma.$PostPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        userId: string;
        postId: string;
        createdAt: Date;
    }, ExtArgs["result"]["bookmark"]>;
    composites: {};
};
export type BookmarkGetPayload<S extends boolean | null | undefined | BookmarkDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$BookmarkPayload, S>;
export type BookmarkCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<BookmarkFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: BookmarkCountAggregateInputType | true;
};
export interface BookmarkDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Bookmark'];
        meta: {
            name: 'Bookmark';
        };
    };
    findUnique<T extends BookmarkFindUniqueArgs>(args: Prisma.SelectSubset<T, BookmarkFindUniqueArgs<ExtArgs>>): Prisma.Prisma__BookmarkClient<runtime.Types.Result.GetResult<Prisma.$BookmarkPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends BookmarkFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, BookmarkFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__BookmarkClient<runtime.Types.Result.GetResult<Prisma.$BookmarkPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends BookmarkFindFirstArgs>(args?: Prisma.SelectSubset<T, BookmarkFindFirstArgs<ExtArgs>>): Prisma.Prisma__BookmarkClient<runtime.Types.Result.GetResult<Prisma.$BookmarkPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends BookmarkFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, BookmarkFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__BookmarkClient<runtime.Types.Result.GetResult<Prisma.$BookmarkPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends BookmarkFindManyArgs>(args?: Prisma.SelectSubset<T, BookmarkFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$BookmarkPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends BookmarkCreateArgs>(args: Prisma.SelectSubset<T, BookmarkCreateArgs<ExtArgs>>): Prisma.Prisma__BookmarkClient<runtime.Types.Result.GetResult<Prisma.$BookmarkPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends BookmarkCreateManyArgs>(args?: Prisma.SelectSubset<T, BookmarkCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends BookmarkCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, BookmarkCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$BookmarkPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends BookmarkDeleteArgs>(args: Prisma.SelectSubset<T, BookmarkDeleteArgs<ExtArgs>>): Prisma.Prisma__BookmarkClient<runtime.Types.Result.GetResult<Prisma.$BookmarkPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends BookmarkUpdateArgs>(args: Prisma.SelectSubset<T, BookmarkUpdateArgs<ExtArgs>>): Prisma.Prisma__BookmarkClient<runtime.Types.Result.GetResult<Prisma.$BookmarkPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends BookmarkDeleteManyArgs>(args?: Prisma.SelectSubset<T, BookmarkDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends BookmarkUpdateManyArgs>(args: Prisma.SelectSubset<T, BookmarkUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends BookmarkUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, BookmarkUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$BookmarkPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends BookmarkUpsertArgs>(args: Prisma.SelectSubset<T, BookmarkUpsertArgs<ExtArgs>>): Prisma.Prisma__BookmarkClient<runtime.Types.Result.GetResult<Prisma.$BookmarkPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends BookmarkCountArgs>(args?: Prisma.Subset<T, BookmarkCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], BookmarkCountAggregateOutputType> : number>;
    aggregate<T extends BookmarkAggregateArgs>(args: Prisma.Subset<T, BookmarkAggregateArgs>): Prisma.PrismaPromise<GetBookmarkAggregateType<T>>;
    groupBy<T extends BookmarkGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: BookmarkGroupByArgs['orderBy'];
    } : {
        orderBy?: BookmarkGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, BookmarkGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetBookmarkGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: BookmarkFieldRefs;
}
export interface Prisma__BookmarkClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    user<T extends Prisma.UserDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.UserDefaultArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    post<T extends Prisma.PostDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.PostDefaultArgs<ExtArgs>>): Prisma.Prisma__PostClient<runtime.Types.Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface BookmarkFieldRefs {
    readonly id: Prisma.FieldRef<"Bookmark", 'String'>;
    readonly userId: Prisma.FieldRef<"Bookmark", 'String'>;
    readonly postId: Prisma.FieldRef<"Bookmark", 'String'>;
    readonly createdAt: Prisma.FieldRef<"Bookmark", 'DateTime'>;
}
export type BookmarkFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.BookmarkSelect<ExtArgs> | null;
    omit?: Prisma.BookmarkOmit<ExtArgs> | null;
    include?: Prisma.BookmarkInclude<ExtArgs> | null;
    where: Prisma.BookmarkWhereUniqueInput;
};
export type BookmarkFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.BookmarkSelect<ExtArgs> | null;
    omit?: Prisma.BookmarkOmit<ExtArgs> | null;
    include?: Prisma.BookmarkInclude<ExtArgs> | null;
    where: Prisma.BookmarkWhereUniqueInput;
};
export type BookmarkFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type BookmarkFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type BookmarkFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type BookmarkCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.BookmarkSelect<ExtArgs> | null;
    omit?: Prisma.BookmarkOmit<ExtArgs> | null;
    include?: Prisma.BookmarkInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.BookmarkCreateInput, Prisma.BookmarkUncheckedCreateInput>;
};
export type BookmarkCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.BookmarkCreateManyInput | Prisma.BookmarkCreateManyInput[];
    skipDuplicates?: boolean;
};
export type BookmarkCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.BookmarkSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.BookmarkOmit<ExtArgs> | null;
    data: Prisma.BookmarkCreateManyInput | Prisma.BookmarkCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.BookmarkIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type BookmarkUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.BookmarkSelect<ExtArgs> | null;
    omit?: Prisma.BookmarkOmit<ExtArgs> | null;
    include?: Prisma.BookmarkInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.BookmarkUpdateInput, Prisma.BookmarkUncheckedUpdateInput>;
    where: Prisma.BookmarkWhereUniqueInput;
};
export type BookmarkUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.BookmarkUpdateManyMutationInput, Prisma.BookmarkUncheckedUpdateManyInput>;
    where?: Prisma.BookmarkWhereInput;
    limit?: number;
};
export type BookmarkUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.BookmarkSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.BookmarkOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.BookmarkUpdateManyMutationInput, Prisma.BookmarkUncheckedUpdateManyInput>;
    where?: Prisma.BookmarkWhereInput;
    limit?: number;
    include?: Prisma.BookmarkIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type BookmarkUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.BookmarkSelect<ExtArgs> | null;
    omit?: Prisma.BookmarkOmit<ExtArgs> | null;
    include?: Prisma.BookmarkInclude<ExtArgs> | null;
    where: Prisma.BookmarkWhereUniqueInput;
    create: Prisma.XOR<Prisma.BookmarkCreateInput, Prisma.BookmarkUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.BookmarkUpdateInput, Prisma.BookmarkUncheckedUpdateInput>;
};
export type BookmarkDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.BookmarkSelect<ExtArgs> | null;
    omit?: Prisma.BookmarkOmit<ExtArgs> | null;
    include?: Prisma.BookmarkInclude<ExtArgs> | null;
    where: Prisma.BookmarkWhereUniqueInput;
};
export type BookmarkDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.BookmarkWhereInput;
    limit?: number;
};
export type BookmarkDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.BookmarkSelect<ExtArgs> | null;
    omit?: Prisma.BookmarkOmit<ExtArgs> | null;
    include?: Prisma.BookmarkInclude<ExtArgs> | null;
};
