import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type PostLikeModel = runtime.Types.Result.DefaultSelection<Prisma.$PostLikePayload>;
export type AggregatePostLike = {
    _count: PostLikeCountAggregateOutputType | null;
    _min: PostLikeMinAggregateOutputType | null;
    _max: PostLikeMaxAggregateOutputType | null;
};
export type PostLikeMinAggregateOutputType = {
    id: string | null;
    userId: string | null;
    postId: string | null;
    createdAt: Date | null;
};
export type PostLikeMaxAggregateOutputType = {
    id: string | null;
    userId: string | null;
    postId: string | null;
    createdAt: Date | null;
};
export type PostLikeCountAggregateOutputType = {
    id: number;
    userId: number;
    postId: number;
    createdAt: number;
    _all: number;
};
export type PostLikeMinAggregateInputType = {
    id?: true;
    userId?: true;
    postId?: true;
    createdAt?: true;
};
export type PostLikeMaxAggregateInputType = {
    id?: true;
    userId?: true;
    postId?: true;
    createdAt?: true;
};
export type PostLikeCountAggregateInputType = {
    id?: true;
    userId?: true;
    postId?: true;
    createdAt?: true;
    _all?: true;
};
export type PostLikeAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PostLikeWhereInput;
    orderBy?: Prisma.PostLikeOrderByWithRelationInput | Prisma.PostLikeOrderByWithRelationInput[];
    cursor?: Prisma.PostLikeWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | PostLikeCountAggregateInputType;
    _min?: PostLikeMinAggregateInputType;
    _max?: PostLikeMaxAggregateInputType;
};
export type GetPostLikeAggregateType<T extends PostLikeAggregateArgs> = {
    [P in keyof T & keyof AggregatePostLike]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregatePostLike[P]> : Prisma.GetScalarType<T[P], AggregatePostLike[P]>;
};
export type PostLikeGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PostLikeWhereInput;
    orderBy?: Prisma.PostLikeOrderByWithAggregationInput | Prisma.PostLikeOrderByWithAggregationInput[];
    by: Prisma.PostLikeScalarFieldEnum[] | Prisma.PostLikeScalarFieldEnum;
    having?: Prisma.PostLikeScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: PostLikeCountAggregateInputType | true;
    _min?: PostLikeMinAggregateInputType;
    _max?: PostLikeMaxAggregateInputType;
};
export type PostLikeGroupByOutputType = {
    id: string;
    userId: string;
    postId: string;
    createdAt: Date;
    _count: PostLikeCountAggregateOutputType | null;
    _min: PostLikeMinAggregateOutputType | null;
    _max: PostLikeMaxAggregateOutputType | null;
};
export type GetPostLikeGroupByPayload<T extends PostLikeGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<PostLikeGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof PostLikeGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], PostLikeGroupByOutputType[P]> : Prisma.GetScalarType<T[P], PostLikeGroupByOutputType[P]>;
}>>;
export type PostLikeWhereInput = {
    AND?: Prisma.PostLikeWhereInput | Prisma.PostLikeWhereInput[];
    OR?: Prisma.PostLikeWhereInput[];
    NOT?: Prisma.PostLikeWhereInput | Prisma.PostLikeWhereInput[];
    id?: Prisma.StringFilter<"PostLike"> | string;
    userId?: Prisma.StringFilter<"PostLike"> | string;
    postId?: Prisma.StringFilter<"PostLike"> | string;
    createdAt?: Prisma.DateTimeFilter<"PostLike"> | Date | string;
    user?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
    post?: Prisma.XOR<Prisma.PostScalarRelationFilter, Prisma.PostWhereInput>;
};
export type PostLikeOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    postId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    user?: Prisma.UserOrderByWithRelationInput;
    post?: Prisma.PostOrderByWithRelationInput;
};
export type PostLikeWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    userId_postId?: Prisma.PostLikeUserIdPostIdCompoundUniqueInput;
    AND?: Prisma.PostLikeWhereInput | Prisma.PostLikeWhereInput[];
    OR?: Prisma.PostLikeWhereInput[];
    NOT?: Prisma.PostLikeWhereInput | Prisma.PostLikeWhereInput[];
    userId?: Prisma.StringFilter<"PostLike"> | string;
    postId?: Prisma.StringFilter<"PostLike"> | string;
    createdAt?: Prisma.DateTimeFilter<"PostLike"> | Date | string;
    user?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
    post?: Prisma.XOR<Prisma.PostScalarRelationFilter, Prisma.PostWhereInput>;
}, "id" | "userId_postId">;
export type PostLikeOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    postId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.PostLikeCountOrderByAggregateInput;
    _max?: Prisma.PostLikeMaxOrderByAggregateInput;
    _min?: Prisma.PostLikeMinOrderByAggregateInput;
};
export type PostLikeScalarWhereWithAggregatesInput = {
    AND?: Prisma.PostLikeScalarWhereWithAggregatesInput | Prisma.PostLikeScalarWhereWithAggregatesInput[];
    OR?: Prisma.PostLikeScalarWhereWithAggregatesInput[];
    NOT?: Prisma.PostLikeScalarWhereWithAggregatesInput | Prisma.PostLikeScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"PostLike"> | string;
    userId?: Prisma.StringWithAggregatesFilter<"PostLike"> | string;
    postId?: Prisma.StringWithAggregatesFilter<"PostLike"> | string;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"PostLike"> | Date | string;
};
export type PostLikeCreateInput = {
    id?: string;
    createdAt?: Date | string;
    user: Prisma.UserCreateNestedOneWithoutPostLikesInput;
    post: Prisma.PostCreateNestedOneWithoutPostLikesInput;
};
export type PostLikeUncheckedCreateInput = {
    id?: string;
    userId: string;
    postId: string;
    createdAt?: Date | string;
};
export type PostLikeUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    user?: Prisma.UserUpdateOneRequiredWithoutPostLikesNestedInput;
    post?: Prisma.PostUpdateOneRequiredWithoutPostLikesNestedInput;
};
export type PostLikeUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    postId?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PostLikeCreateManyInput = {
    id?: string;
    userId: string;
    postId: string;
    createdAt?: Date | string;
};
export type PostLikeUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PostLikeUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    postId?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PostLikeListRelationFilter = {
    every?: Prisma.PostLikeWhereInput;
    some?: Prisma.PostLikeWhereInput;
    none?: Prisma.PostLikeWhereInput;
};
export type PostLikeOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type PostLikeUserIdPostIdCompoundUniqueInput = {
    userId: string;
    postId: string;
};
export type PostLikeCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    postId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type PostLikeMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    postId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type PostLikeMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    postId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type PostLikeCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.PostLikeCreateWithoutUserInput, Prisma.PostLikeUncheckedCreateWithoutUserInput> | Prisma.PostLikeCreateWithoutUserInput[] | Prisma.PostLikeUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.PostLikeCreateOrConnectWithoutUserInput | Prisma.PostLikeCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.PostLikeCreateManyUserInputEnvelope;
    connect?: Prisma.PostLikeWhereUniqueInput | Prisma.PostLikeWhereUniqueInput[];
};
export type PostLikeUncheckedCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.PostLikeCreateWithoutUserInput, Prisma.PostLikeUncheckedCreateWithoutUserInput> | Prisma.PostLikeCreateWithoutUserInput[] | Prisma.PostLikeUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.PostLikeCreateOrConnectWithoutUserInput | Prisma.PostLikeCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.PostLikeCreateManyUserInputEnvelope;
    connect?: Prisma.PostLikeWhereUniqueInput | Prisma.PostLikeWhereUniqueInput[];
};
export type PostLikeUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.PostLikeCreateWithoutUserInput, Prisma.PostLikeUncheckedCreateWithoutUserInput> | Prisma.PostLikeCreateWithoutUserInput[] | Prisma.PostLikeUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.PostLikeCreateOrConnectWithoutUserInput | Prisma.PostLikeCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.PostLikeUpsertWithWhereUniqueWithoutUserInput | Prisma.PostLikeUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.PostLikeCreateManyUserInputEnvelope;
    set?: Prisma.PostLikeWhereUniqueInput | Prisma.PostLikeWhereUniqueInput[];
    disconnect?: Prisma.PostLikeWhereUniqueInput | Prisma.PostLikeWhereUniqueInput[];
    delete?: Prisma.PostLikeWhereUniqueInput | Prisma.PostLikeWhereUniqueInput[];
    connect?: Prisma.PostLikeWhereUniqueInput | Prisma.PostLikeWhereUniqueInput[];
    update?: Prisma.PostLikeUpdateWithWhereUniqueWithoutUserInput | Prisma.PostLikeUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.PostLikeUpdateManyWithWhereWithoutUserInput | Prisma.PostLikeUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.PostLikeScalarWhereInput | Prisma.PostLikeScalarWhereInput[];
};
export type PostLikeUncheckedUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.PostLikeCreateWithoutUserInput, Prisma.PostLikeUncheckedCreateWithoutUserInput> | Prisma.PostLikeCreateWithoutUserInput[] | Prisma.PostLikeUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.PostLikeCreateOrConnectWithoutUserInput | Prisma.PostLikeCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.PostLikeUpsertWithWhereUniqueWithoutUserInput | Prisma.PostLikeUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.PostLikeCreateManyUserInputEnvelope;
    set?: Prisma.PostLikeWhereUniqueInput | Prisma.PostLikeWhereUniqueInput[];
    disconnect?: Prisma.PostLikeWhereUniqueInput | Prisma.PostLikeWhereUniqueInput[];
    delete?: Prisma.PostLikeWhereUniqueInput | Prisma.PostLikeWhereUniqueInput[];
    connect?: Prisma.PostLikeWhereUniqueInput | Prisma.PostLikeWhereUniqueInput[];
    update?: Prisma.PostLikeUpdateWithWhereUniqueWithoutUserInput | Prisma.PostLikeUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.PostLikeUpdateManyWithWhereWithoutUserInput | Prisma.PostLikeUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.PostLikeScalarWhereInput | Prisma.PostLikeScalarWhereInput[];
};
export type PostLikeCreateNestedManyWithoutPostInput = {
    create?: Prisma.XOR<Prisma.PostLikeCreateWithoutPostInput, Prisma.PostLikeUncheckedCreateWithoutPostInput> | Prisma.PostLikeCreateWithoutPostInput[] | Prisma.PostLikeUncheckedCreateWithoutPostInput[];
    connectOrCreate?: Prisma.PostLikeCreateOrConnectWithoutPostInput | Prisma.PostLikeCreateOrConnectWithoutPostInput[];
    createMany?: Prisma.PostLikeCreateManyPostInputEnvelope;
    connect?: Prisma.PostLikeWhereUniqueInput | Prisma.PostLikeWhereUniqueInput[];
};
export type PostLikeUncheckedCreateNestedManyWithoutPostInput = {
    create?: Prisma.XOR<Prisma.PostLikeCreateWithoutPostInput, Prisma.PostLikeUncheckedCreateWithoutPostInput> | Prisma.PostLikeCreateWithoutPostInput[] | Prisma.PostLikeUncheckedCreateWithoutPostInput[];
    connectOrCreate?: Prisma.PostLikeCreateOrConnectWithoutPostInput | Prisma.PostLikeCreateOrConnectWithoutPostInput[];
    createMany?: Prisma.PostLikeCreateManyPostInputEnvelope;
    connect?: Prisma.PostLikeWhereUniqueInput | Prisma.PostLikeWhereUniqueInput[];
};
export type PostLikeUpdateManyWithoutPostNestedInput = {
    create?: Prisma.XOR<Prisma.PostLikeCreateWithoutPostInput, Prisma.PostLikeUncheckedCreateWithoutPostInput> | Prisma.PostLikeCreateWithoutPostInput[] | Prisma.PostLikeUncheckedCreateWithoutPostInput[];
    connectOrCreate?: Prisma.PostLikeCreateOrConnectWithoutPostInput | Prisma.PostLikeCreateOrConnectWithoutPostInput[];
    upsert?: Prisma.PostLikeUpsertWithWhereUniqueWithoutPostInput | Prisma.PostLikeUpsertWithWhereUniqueWithoutPostInput[];
    createMany?: Prisma.PostLikeCreateManyPostInputEnvelope;
    set?: Prisma.PostLikeWhereUniqueInput | Prisma.PostLikeWhereUniqueInput[];
    disconnect?: Prisma.PostLikeWhereUniqueInput | Prisma.PostLikeWhereUniqueInput[];
    delete?: Prisma.PostLikeWhereUniqueInput | Prisma.PostLikeWhereUniqueInput[];
    connect?: Prisma.PostLikeWhereUniqueInput | Prisma.PostLikeWhereUniqueInput[];
    update?: Prisma.PostLikeUpdateWithWhereUniqueWithoutPostInput | Prisma.PostLikeUpdateWithWhereUniqueWithoutPostInput[];
    updateMany?: Prisma.PostLikeUpdateManyWithWhereWithoutPostInput | Prisma.PostLikeUpdateManyWithWhereWithoutPostInput[];
    deleteMany?: Prisma.PostLikeScalarWhereInput | Prisma.PostLikeScalarWhereInput[];
};
export type PostLikeUncheckedUpdateManyWithoutPostNestedInput = {
    create?: Prisma.XOR<Prisma.PostLikeCreateWithoutPostInput, Prisma.PostLikeUncheckedCreateWithoutPostInput> | Prisma.PostLikeCreateWithoutPostInput[] | Prisma.PostLikeUncheckedCreateWithoutPostInput[];
    connectOrCreate?: Prisma.PostLikeCreateOrConnectWithoutPostInput | Prisma.PostLikeCreateOrConnectWithoutPostInput[];
    upsert?: Prisma.PostLikeUpsertWithWhereUniqueWithoutPostInput | Prisma.PostLikeUpsertWithWhereUniqueWithoutPostInput[];
    createMany?: Prisma.PostLikeCreateManyPostInputEnvelope;
    set?: Prisma.PostLikeWhereUniqueInput | Prisma.PostLikeWhereUniqueInput[];
    disconnect?: Prisma.PostLikeWhereUniqueInput | Prisma.PostLikeWhereUniqueInput[];
    delete?: Prisma.PostLikeWhereUniqueInput | Prisma.PostLikeWhereUniqueInput[];
    connect?: Prisma.PostLikeWhereUniqueInput | Prisma.PostLikeWhereUniqueInput[];
    update?: Prisma.PostLikeUpdateWithWhereUniqueWithoutPostInput | Prisma.PostLikeUpdateWithWhereUniqueWithoutPostInput[];
    updateMany?: Prisma.PostLikeUpdateManyWithWhereWithoutPostInput | Prisma.PostLikeUpdateManyWithWhereWithoutPostInput[];
    deleteMany?: Prisma.PostLikeScalarWhereInput | Prisma.PostLikeScalarWhereInput[];
};
export type PostLikeCreateWithoutUserInput = {
    id?: string;
    createdAt?: Date | string;
    post: Prisma.PostCreateNestedOneWithoutPostLikesInput;
};
export type PostLikeUncheckedCreateWithoutUserInput = {
    id?: string;
    postId: string;
    createdAt?: Date | string;
};
export type PostLikeCreateOrConnectWithoutUserInput = {
    where: Prisma.PostLikeWhereUniqueInput;
    create: Prisma.XOR<Prisma.PostLikeCreateWithoutUserInput, Prisma.PostLikeUncheckedCreateWithoutUserInput>;
};
export type PostLikeCreateManyUserInputEnvelope = {
    data: Prisma.PostLikeCreateManyUserInput | Prisma.PostLikeCreateManyUserInput[];
    skipDuplicates?: boolean;
};
export type PostLikeUpsertWithWhereUniqueWithoutUserInput = {
    where: Prisma.PostLikeWhereUniqueInput;
    update: Prisma.XOR<Prisma.PostLikeUpdateWithoutUserInput, Prisma.PostLikeUncheckedUpdateWithoutUserInput>;
    create: Prisma.XOR<Prisma.PostLikeCreateWithoutUserInput, Prisma.PostLikeUncheckedCreateWithoutUserInput>;
};
export type PostLikeUpdateWithWhereUniqueWithoutUserInput = {
    where: Prisma.PostLikeWhereUniqueInput;
    data: Prisma.XOR<Prisma.PostLikeUpdateWithoutUserInput, Prisma.PostLikeUncheckedUpdateWithoutUserInput>;
};
export type PostLikeUpdateManyWithWhereWithoutUserInput = {
    where: Prisma.PostLikeScalarWhereInput;
    data: Prisma.XOR<Prisma.PostLikeUpdateManyMutationInput, Prisma.PostLikeUncheckedUpdateManyWithoutUserInput>;
};
export type PostLikeScalarWhereInput = {
    AND?: Prisma.PostLikeScalarWhereInput | Prisma.PostLikeScalarWhereInput[];
    OR?: Prisma.PostLikeScalarWhereInput[];
    NOT?: Prisma.PostLikeScalarWhereInput | Prisma.PostLikeScalarWhereInput[];
    id?: Prisma.StringFilter<"PostLike"> | string;
    userId?: Prisma.StringFilter<"PostLike"> | string;
    postId?: Prisma.StringFilter<"PostLike"> | string;
    createdAt?: Prisma.DateTimeFilter<"PostLike"> | Date | string;
};
export type PostLikeCreateWithoutPostInput = {
    id?: string;
    createdAt?: Date | string;
    user: Prisma.UserCreateNestedOneWithoutPostLikesInput;
};
export type PostLikeUncheckedCreateWithoutPostInput = {
    id?: string;
    userId: string;
    createdAt?: Date | string;
};
export type PostLikeCreateOrConnectWithoutPostInput = {
    where: Prisma.PostLikeWhereUniqueInput;
    create: Prisma.XOR<Prisma.PostLikeCreateWithoutPostInput, Prisma.PostLikeUncheckedCreateWithoutPostInput>;
};
export type PostLikeCreateManyPostInputEnvelope = {
    data: Prisma.PostLikeCreateManyPostInput | Prisma.PostLikeCreateManyPostInput[];
    skipDuplicates?: boolean;
};
export type PostLikeUpsertWithWhereUniqueWithoutPostInput = {
    where: Prisma.PostLikeWhereUniqueInput;
    update: Prisma.XOR<Prisma.PostLikeUpdateWithoutPostInput, Prisma.PostLikeUncheckedUpdateWithoutPostInput>;
    create: Prisma.XOR<Prisma.PostLikeCreateWithoutPostInput, Prisma.PostLikeUncheckedCreateWithoutPostInput>;
};
export type PostLikeUpdateWithWhereUniqueWithoutPostInput = {
    where: Prisma.PostLikeWhereUniqueInput;
    data: Prisma.XOR<Prisma.PostLikeUpdateWithoutPostInput, Prisma.PostLikeUncheckedUpdateWithoutPostInput>;
};
export type PostLikeUpdateManyWithWhereWithoutPostInput = {
    where: Prisma.PostLikeScalarWhereInput;
    data: Prisma.XOR<Prisma.PostLikeUpdateManyMutationInput, Prisma.PostLikeUncheckedUpdateManyWithoutPostInput>;
};
export type PostLikeCreateManyUserInput = {
    id?: string;
    postId: string;
    createdAt?: Date | string;
};
export type PostLikeUpdateWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    post?: Prisma.PostUpdateOneRequiredWithoutPostLikesNestedInput;
};
export type PostLikeUncheckedUpdateWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    postId?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PostLikeUncheckedUpdateManyWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    postId?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PostLikeCreateManyPostInput = {
    id?: string;
    userId: string;
    createdAt?: Date | string;
};
export type PostLikeUpdateWithoutPostInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    user?: Prisma.UserUpdateOneRequiredWithoutPostLikesNestedInput;
};
export type PostLikeUncheckedUpdateWithoutPostInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PostLikeUncheckedUpdateManyWithoutPostInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PostLikeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    userId?: boolean;
    postId?: boolean;
    createdAt?: boolean;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    post?: boolean | Prisma.PostDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["postLike"]>;
export type PostLikeSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    userId?: boolean;
    postId?: boolean;
    createdAt?: boolean;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    post?: boolean | Prisma.PostDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["postLike"]>;
export type PostLikeSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    userId?: boolean;
    postId?: boolean;
    createdAt?: boolean;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    post?: boolean | Prisma.PostDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["postLike"]>;
export type PostLikeSelectScalar = {
    id?: boolean;
    userId?: boolean;
    postId?: boolean;
    createdAt?: boolean;
};
export type PostLikeOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "userId" | "postId" | "createdAt", ExtArgs["result"]["postLike"]>;
export type PostLikeInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    post?: boolean | Prisma.PostDefaultArgs<ExtArgs>;
};
export type PostLikeIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    post?: boolean | Prisma.PostDefaultArgs<ExtArgs>;
};
export type PostLikeIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    post?: boolean | Prisma.PostDefaultArgs<ExtArgs>;
};
export type $PostLikePayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "PostLike";
    objects: {
        user: Prisma.$UserPayload<ExtArgs>;
        post: Prisma.$PostPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        userId: string;
        postId: string;
        createdAt: Date;
    }, ExtArgs["result"]["postLike"]>;
    composites: {};
};
export type PostLikeGetPayload<S extends boolean | null | undefined | PostLikeDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$PostLikePayload, S>;
export type PostLikeCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<PostLikeFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: PostLikeCountAggregateInputType | true;
};
export interface PostLikeDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['PostLike'];
        meta: {
            name: 'PostLike';
        };
    };
    findUnique<T extends PostLikeFindUniqueArgs>(args: Prisma.SelectSubset<T, PostLikeFindUniqueArgs<ExtArgs>>): Prisma.Prisma__PostLikeClient<runtime.Types.Result.GetResult<Prisma.$PostLikePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends PostLikeFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, PostLikeFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__PostLikeClient<runtime.Types.Result.GetResult<Prisma.$PostLikePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends PostLikeFindFirstArgs>(args?: Prisma.SelectSubset<T, PostLikeFindFirstArgs<ExtArgs>>): Prisma.Prisma__PostLikeClient<runtime.Types.Result.GetResult<Prisma.$PostLikePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends PostLikeFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, PostLikeFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__PostLikeClient<runtime.Types.Result.GetResult<Prisma.$PostLikePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends PostLikeFindManyArgs>(args?: Prisma.SelectSubset<T, PostLikeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PostLikePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends PostLikeCreateArgs>(args: Prisma.SelectSubset<T, PostLikeCreateArgs<ExtArgs>>): Prisma.Prisma__PostLikeClient<runtime.Types.Result.GetResult<Prisma.$PostLikePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends PostLikeCreateManyArgs>(args?: Prisma.SelectSubset<T, PostLikeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends PostLikeCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, PostLikeCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PostLikePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends PostLikeDeleteArgs>(args: Prisma.SelectSubset<T, PostLikeDeleteArgs<ExtArgs>>): Prisma.Prisma__PostLikeClient<runtime.Types.Result.GetResult<Prisma.$PostLikePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends PostLikeUpdateArgs>(args: Prisma.SelectSubset<T, PostLikeUpdateArgs<ExtArgs>>): Prisma.Prisma__PostLikeClient<runtime.Types.Result.GetResult<Prisma.$PostLikePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends PostLikeDeleteManyArgs>(args?: Prisma.SelectSubset<T, PostLikeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends PostLikeUpdateManyArgs>(args: Prisma.SelectSubset<T, PostLikeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends PostLikeUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, PostLikeUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PostLikePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends PostLikeUpsertArgs>(args: Prisma.SelectSubset<T, PostLikeUpsertArgs<ExtArgs>>): Prisma.Prisma__PostLikeClient<runtime.Types.Result.GetResult<Prisma.$PostLikePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends PostLikeCountArgs>(args?: Prisma.Subset<T, PostLikeCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], PostLikeCountAggregateOutputType> : number>;
    aggregate<T extends PostLikeAggregateArgs>(args: Prisma.Subset<T, PostLikeAggregateArgs>): Prisma.PrismaPromise<GetPostLikeAggregateType<T>>;
    groupBy<T extends PostLikeGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: PostLikeGroupByArgs['orderBy'];
    } : {
        orderBy?: PostLikeGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, PostLikeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPostLikeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: PostLikeFieldRefs;
}
export interface Prisma__PostLikeClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    user<T extends Prisma.UserDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.UserDefaultArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    post<T extends Prisma.PostDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.PostDefaultArgs<ExtArgs>>): Prisma.Prisma__PostClient<runtime.Types.Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface PostLikeFieldRefs {
    readonly id: Prisma.FieldRef<"PostLike", 'String'>;
    readonly userId: Prisma.FieldRef<"PostLike", 'String'>;
    readonly postId: Prisma.FieldRef<"PostLike", 'String'>;
    readonly createdAt: Prisma.FieldRef<"PostLike", 'DateTime'>;
}
export type PostLikeFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PostLikeSelect<ExtArgs> | null;
    omit?: Prisma.PostLikeOmit<ExtArgs> | null;
    include?: Prisma.PostLikeInclude<ExtArgs> | null;
    where: Prisma.PostLikeWhereUniqueInput;
};
export type PostLikeFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PostLikeSelect<ExtArgs> | null;
    omit?: Prisma.PostLikeOmit<ExtArgs> | null;
    include?: Prisma.PostLikeInclude<ExtArgs> | null;
    where: Prisma.PostLikeWhereUniqueInput;
};
export type PostLikeFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type PostLikeFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type PostLikeFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type PostLikeCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PostLikeSelect<ExtArgs> | null;
    omit?: Prisma.PostLikeOmit<ExtArgs> | null;
    include?: Prisma.PostLikeInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.PostLikeCreateInput, Prisma.PostLikeUncheckedCreateInput>;
};
export type PostLikeCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.PostLikeCreateManyInput | Prisma.PostLikeCreateManyInput[];
    skipDuplicates?: boolean;
};
export type PostLikeCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PostLikeSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.PostLikeOmit<ExtArgs> | null;
    data: Prisma.PostLikeCreateManyInput | Prisma.PostLikeCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.PostLikeIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type PostLikeUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PostLikeSelect<ExtArgs> | null;
    omit?: Prisma.PostLikeOmit<ExtArgs> | null;
    include?: Prisma.PostLikeInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.PostLikeUpdateInput, Prisma.PostLikeUncheckedUpdateInput>;
    where: Prisma.PostLikeWhereUniqueInput;
};
export type PostLikeUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.PostLikeUpdateManyMutationInput, Prisma.PostLikeUncheckedUpdateManyInput>;
    where?: Prisma.PostLikeWhereInput;
    limit?: number;
};
export type PostLikeUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PostLikeSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.PostLikeOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.PostLikeUpdateManyMutationInput, Prisma.PostLikeUncheckedUpdateManyInput>;
    where?: Prisma.PostLikeWhereInput;
    limit?: number;
    include?: Prisma.PostLikeIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type PostLikeUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PostLikeSelect<ExtArgs> | null;
    omit?: Prisma.PostLikeOmit<ExtArgs> | null;
    include?: Prisma.PostLikeInclude<ExtArgs> | null;
    where: Prisma.PostLikeWhereUniqueInput;
    create: Prisma.XOR<Prisma.PostLikeCreateInput, Prisma.PostLikeUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.PostLikeUpdateInput, Prisma.PostLikeUncheckedUpdateInput>;
};
export type PostLikeDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PostLikeSelect<ExtArgs> | null;
    omit?: Prisma.PostLikeOmit<ExtArgs> | null;
    include?: Prisma.PostLikeInclude<ExtArgs> | null;
    where: Prisma.PostLikeWhereUniqueInput;
};
export type PostLikeDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PostLikeWhereInput;
    limit?: number;
};
export type PostLikeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PostLikeSelect<ExtArgs> | null;
    omit?: Prisma.PostLikeOmit<ExtArgs> | null;
    include?: Prisma.PostLikeInclude<ExtArgs> | null;
};
