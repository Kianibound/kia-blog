import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type PasswordResetTokenModel = runtime.Types.Result.DefaultSelection<Prisma.$PasswordResetTokenPayload>;
export type AggregatePasswordResetToken = {
    _count: PasswordResetTokenCountAggregateOutputType | null;
    _min: PasswordResetTokenMinAggregateOutputType | null;
    _max: PasswordResetTokenMaxAggregateOutputType | null;
};
export type PasswordResetTokenMinAggregateOutputType = {
    id: string | null;
    tokenHash: string | null;
    userId: string | null;
    expiresAt: Date | null;
    usedAt: Date | null;
    createdAt: Date | null;
};
export type PasswordResetTokenMaxAggregateOutputType = {
    id: string | null;
    tokenHash: string | null;
    userId: string | null;
    expiresAt: Date | null;
    usedAt: Date | null;
    createdAt: Date | null;
};
export type PasswordResetTokenCountAggregateOutputType = {
    id: number;
    tokenHash: number;
    userId: number;
    expiresAt: number;
    usedAt: number;
    createdAt: number;
    _all: number;
};
export type PasswordResetTokenMinAggregateInputType = {
    id?: true;
    tokenHash?: true;
    userId?: true;
    expiresAt?: true;
    usedAt?: true;
    createdAt?: true;
};
export type PasswordResetTokenMaxAggregateInputType = {
    id?: true;
    tokenHash?: true;
    userId?: true;
    expiresAt?: true;
    usedAt?: true;
    createdAt?: true;
};
export type PasswordResetTokenCountAggregateInputType = {
    id?: true;
    tokenHash?: true;
    userId?: true;
    expiresAt?: true;
    usedAt?: true;
    createdAt?: true;
    _all?: true;
};
export type PasswordResetTokenAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PasswordResetTokenWhereInput;
    orderBy?: Prisma.PasswordResetTokenOrderByWithRelationInput | Prisma.PasswordResetTokenOrderByWithRelationInput[];
    cursor?: Prisma.PasswordResetTokenWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | PasswordResetTokenCountAggregateInputType;
    _min?: PasswordResetTokenMinAggregateInputType;
    _max?: PasswordResetTokenMaxAggregateInputType;
};
export type GetPasswordResetTokenAggregateType<T extends PasswordResetTokenAggregateArgs> = {
    [P in keyof T & keyof AggregatePasswordResetToken]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregatePasswordResetToken[P]> : Prisma.GetScalarType<T[P], AggregatePasswordResetToken[P]>;
};
export type PasswordResetTokenGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PasswordResetTokenWhereInput;
    orderBy?: Prisma.PasswordResetTokenOrderByWithAggregationInput | Prisma.PasswordResetTokenOrderByWithAggregationInput[];
    by: Prisma.PasswordResetTokenScalarFieldEnum[] | Prisma.PasswordResetTokenScalarFieldEnum;
    having?: Prisma.PasswordResetTokenScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: PasswordResetTokenCountAggregateInputType | true;
    _min?: PasswordResetTokenMinAggregateInputType;
    _max?: PasswordResetTokenMaxAggregateInputType;
};
export type PasswordResetTokenGroupByOutputType = {
    id: string;
    tokenHash: string;
    userId: string;
    expiresAt: Date;
    usedAt: Date | null;
    createdAt: Date;
    _count: PasswordResetTokenCountAggregateOutputType | null;
    _min: PasswordResetTokenMinAggregateOutputType | null;
    _max: PasswordResetTokenMaxAggregateOutputType | null;
};
export type GetPasswordResetTokenGroupByPayload<T extends PasswordResetTokenGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<PasswordResetTokenGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof PasswordResetTokenGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], PasswordResetTokenGroupByOutputType[P]> : Prisma.GetScalarType<T[P], PasswordResetTokenGroupByOutputType[P]>;
}>>;
export type PasswordResetTokenWhereInput = {
    AND?: Prisma.PasswordResetTokenWhereInput | Prisma.PasswordResetTokenWhereInput[];
    OR?: Prisma.PasswordResetTokenWhereInput[];
    NOT?: Prisma.PasswordResetTokenWhereInput | Prisma.PasswordResetTokenWhereInput[];
    id?: Prisma.StringFilter<"PasswordResetToken"> | string;
    tokenHash?: Prisma.StringFilter<"PasswordResetToken"> | string;
    userId?: Prisma.StringFilter<"PasswordResetToken"> | string;
    expiresAt?: Prisma.DateTimeFilter<"PasswordResetToken"> | Date | string;
    usedAt?: Prisma.DateTimeNullableFilter<"PasswordResetToken"> | Date | string | null;
    createdAt?: Prisma.DateTimeFilter<"PasswordResetToken"> | Date | string;
    user?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
};
export type PasswordResetTokenOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    tokenHash?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    expiresAt?: Prisma.SortOrder;
    usedAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    user?: Prisma.UserOrderByWithRelationInput;
};
export type PasswordResetTokenWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    tokenHash?: string;
    AND?: Prisma.PasswordResetTokenWhereInput | Prisma.PasswordResetTokenWhereInput[];
    OR?: Prisma.PasswordResetTokenWhereInput[];
    NOT?: Prisma.PasswordResetTokenWhereInput | Prisma.PasswordResetTokenWhereInput[];
    userId?: Prisma.StringFilter<"PasswordResetToken"> | string;
    expiresAt?: Prisma.DateTimeFilter<"PasswordResetToken"> | Date | string;
    usedAt?: Prisma.DateTimeNullableFilter<"PasswordResetToken"> | Date | string | null;
    createdAt?: Prisma.DateTimeFilter<"PasswordResetToken"> | Date | string;
    user?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
}, "id" | "tokenHash">;
export type PasswordResetTokenOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    tokenHash?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    expiresAt?: Prisma.SortOrder;
    usedAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.PasswordResetTokenCountOrderByAggregateInput;
    _max?: Prisma.PasswordResetTokenMaxOrderByAggregateInput;
    _min?: Prisma.PasswordResetTokenMinOrderByAggregateInput;
};
export type PasswordResetTokenScalarWhereWithAggregatesInput = {
    AND?: Prisma.PasswordResetTokenScalarWhereWithAggregatesInput | Prisma.PasswordResetTokenScalarWhereWithAggregatesInput[];
    OR?: Prisma.PasswordResetTokenScalarWhereWithAggregatesInput[];
    NOT?: Prisma.PasswordResetTokenScalarWhereWithAggregatesInput | Prisma.PasswordResetTokenScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"PasswordResetToken"> | string;
    tokenHash?: Prisma.StringWithAggregatesFilter<"PasswordResetToken"> | string;
    userId?: Prisma.StringWithAggregatesFilter<"PasswordResetToken"> | string;
    expiresAt?: Prisma.DateTimeWithAggregatesFilter<"PasswordResetToken"> | Date | string;
    usedAt?: Prisma.DateTimeNullableWithAggregatesFilter<"PasswordResetToken"> | Date | string | null;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"PasswordResetToken"> | Date | string;
};
export type PasswordResetTokenCreateInput = {
    id?: string;
    tokenHash: string;
    expiresAt: Date | string;
    usedAt?: Date | string | null;
    createdAt?: Date | string;
    user: Prisma.UserCreateNestedOneWithoutPasswordResetTokensInput;
};
export type PasswordResetTokenUncheckedCreateInput = {
    id?: string;
    tokenHash: string;
    userId: string;
    expiresAt: Date | string;
    usedAt?: Date | string | null;
    createdAt?: Date | string;
};
export type PasswordResetTokenUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    tokenHash?: Prisma.StringFieldUpdateOperationsInput | string;
    expiresAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    usedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    user?: Prisma.UserUpdateOneRequiredWithoutPasswordResetTokensNestedInput;
};
export type PasswordResetTokenUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    tokenHash?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    expiresAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    usedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PasswordResetTokenCreateManyInput = {
    id?: string;
    tokenHash: string;
    userId: string;
    expiresAt: Date | string;
    usedAt?: Date | string | null;
    createdAt?: Date | string;
};
export type PasswordResetTokenUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    tokenHash?: Prisma.StringFieldUpdateOperationsInput | string;
    expiresAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    usedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PasswordResetTokenUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    tokenHash?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    expiresAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    usedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PasswordResetTokenListRelationFilter = {
    every?: Prisma.PasswordResetTokenWhereInput;
    some?: Prisma.PasswordResetTokenWhereInput;
    none?: Prisma.PasswordResetTokenWhereInput;
};
export type PasswordResetTokenOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type PasswordResetTokenCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    tokenHash?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    expiresAt?: Prisma.SortOrder;
    usedAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type PasswordResetTokenMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    tokenHash?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    expiresAt?: Prisma.SortOrder;
    usedAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type PasswordResetTokenMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    tokenHash?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    expiresAt?: Prisma.SortOrder;
    usedAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type PasswordResetTokenCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.PasswordResetTokenCreateWithoutUserInput, Prisma.PasswordResetTokenUncheckedCreateWithoutUserInput> | Prisma.PasswordResetTokenCreateWithoutUserInput[] | Prisma.PasswordResetTokenUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.PasswordResetTokenCreateOrConnectWithoutUserInput | Prisma.PasswordResetTokenCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.PasswordResetTokenCreateManyUserInputEnvelope;
    connect?: Prisma.PasswordResetTokenWhereUniqueInput | Prisma.PasswordResetTokenWhereUniqueInput[];
};
export type PasswordResetTokenUncheckedCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.PasswordResetTokenCreateWithoutUserInput, Prisma.PasswordResetTokenUncheckedCreateWithoutUserInput> | Prisma.PasswordResetTokenCreateWithoutUserInput[] | Prisma.PasswordResetTokenUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.PasswordResetTokenCreateOrConnectWithoutUserInput | Prisma.PasswordResetTokenCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.PasswordResetTokenCreateManyUserInputEnvelope;
    connect?: Prisma.PasswordResetTokenWhereUniqueInput | Prisma.PasswordResetTokenWhereUniqueInput[];
};
export type PasswordResetTokenUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.PasswordResetTokenCreateWithoutUserInput, Prisma.PasswordResetTokenUncheckedCreateWithoutUserInput> | Prisma.PasswordResetTokenCreateWithoutUserInput[] | Prisma.PasswordResetTokenUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.PasswordResetTokenCreateOrConnectWithoutUserInput | Prisma.PasswordResetTokenCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.PasswordResetTokenUpsertWithWhereUniqueWithoutUserInput | Prisma.PasswordResetTokenUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.PasswordResetTokenCreateManyUserInputEnvelope;
    set?: Prisma.PasswordResetTokenWhereUniqueInput | Prisma.PasswordResetTokenWhereUniqueInput[];
    disconnect?: Prisma.PasswordResetTokenWhereUniqueInput | Prisma.PasswordResetTokenWhereUniqueInput[];
    delete?: Prisma.PasswordResetTokenWhereUniqueInput | Prisma.PasswordResetTokenWhereUniqueInput[];
    connect?: Prisma.PasswordResetTokenWhereUniqueInput | Prisma.PasswordResetTokenWhereUniqueInput[];
    update?: Prisma.PasswordResetTokenUpdateWithWhereUniqueWithoutUserInput | Prisma.PasswordResetTokenUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.PasswordResetTokenUpdateManyWithWhereWithoutUserInput | Prisma.PasswordResetTokenUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.PasswordResetTokenScalarWhereInput | Prisma.PasswordResetTokenScalarWhereInput[];
};
export type PasswordResetTokenUncheckedUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.PasswordResetTokenCreateWithoutUserInput, Prisma.PasswordResetTokenUncheckedCreateWithoutUserInput> | Prisma.PasswordResetTokenCreateWithoutUserInput[] | Prisma.PasswordResetTokenUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.PasswordResetTokenCreateOrConnectWithoutUserInput | Prisma.PasswordResetTokenCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.PasswordResetTokenUpsertWithWhereUniqueWithoutUserInput | Prisma.PasswordResetTokenUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.PasswordResetTokenCreateManyUserInputEnvelope;
    set?: Prisma.PasswordResetTokenWhereUniqueInput | Prisma.PasswordResetTokenWhereUniqueInput[];
    disconnect?: Prisma.PasswordResetTokenWhereUniqueInput | Prisma.PasswordResetTokenWhereUniqueInput[];
    delete?: Prisma.PasswordResetTokenWhereUniqueInput | Prisma.PasswordResetTokenWhereUniqueInput[];
    connect?: Prisma.PasswordResetTokenWhereUniqueInput | Prisma.PasswordResetTokenWhereUniqueInput[];
    update?: Prisma.PasswordResetTokenUpdateWithWhereUniqueWithoutUserInput | Prisma.PasswordResetTokenUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.PasswordResetTokenUpdateManyWithWhereWithoutUserInput | Prisma.PasswordResetTokenUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.PasswordResetTokenScalarWhereInput | Prisma.PasswordResetTokenScalarWhereInput[];
};
export type PasswordResetTokenCreateWithoutUserInput = {
    id?: string;
    tokenHash: string;
    expiresAt: Date | string;
    usedAt?: Date | string | null;
    createdAt?: Date | string;
};
export type PasswordResetTokenUncheckedCreateWithoutUserInput = {
    id?: string;
    tokenHash: string;
    expiresAt: Date | string;
    usedAt?: Date | string | null;
    createdAt?: Date | string;
};
export type PasswordResetTokenCreateOrConnectWithoutUserInput = {
    where: Prisma.PasswordResetTokenWhereUniqueInput;
    create: Prisma.XOR<Prisma.PasswordResetTokenCreateWithoutUserInput, Prisma.PasswordResetTokenUncheckedCreateWithoutUserInput>;
};
export type PasswordResetTokenCreateManyUserInputEnvelope = {
    data: Prisma.PasswordResetTokenCreateManyUserInput | Prisma.PasswordResetTokenCreateManyUserInput[];
    skipDuplicates?: boolean;
};
export type PasswordResetTokenUpsertWithWhereUniqueWithoutUserInput = {
    where: Prisma.PasswordResetTokenWhereUniqueInput;
    update: Prisma.XOR<Prisma.PasswordResetTokenUpdateWithoutUserInput, Prisma.PasswordResetTokenUncheckedUpdateWithoutUserInput>;
    create: Prisma.XOR<Prisma.PasswordResetTokenCreateWithoutUserInput, Prisma.PasswordResetTokenUncheckedCreateWithoutUserInput>;
};
export type PasswordResetTokenUpdateWithWhereUniqueWithoutUserInput = {
    where: Prisma.PasswordResetTokenWhereUniqueInput;
    data: Prisma.XOR<Prisma.PasswordResetTokenUpdateWithoutUserInput, Prisma.PasswordResetTokenUncheckedUpdateWithoutUserInput>;
};
export type PasswordResetTokenUpdateManyWithWhereWithoutUserInput = {
    where: Prisma.PasswordResetTokenScalarWhereInput;
    data: Prisma.XOR<Prisma.PasswordResetTokenUpdateManyMutationInput, Prisma.PasswordResetTokenUncheckedUpdateManyWithoutUserInput>;
};
export type PasswordResetTokenScalarWhereInput = {
    AND?: Prisma.PasswordResetTokenScalarWhereInput | Prisma.PasswordResetTokenScalarWhereInput[];
    OR?: Prisma.PasswordResetTokenScalarWhereInput[];
    NOT?: Prisma.PasswordResetTokenScalarWhereInput | Prisma.PasswordResetTokenScalarWhereInput[];
    id?: Prisma.StringFilter<"PasswordResetToken"> | string;
    tokenHash?: Prisma.StringFilter<"PasswordResetToken"> | string;
    userId?: Prisma.StringFilter<"PasswordResetToken"> | string;
    expiresAt?: Prisma.DateTimeFilter<"PasswordResetToken"> | Date | string;
    usedAt?: Prisma.DateTimeNullableFilter<"PasswordResetToken"> | Date | string | null;
    createdAt?: Prisma.DateTimeFilter<"PasswordResetToken"> | Date | string;
};
export type PasswordResetTokenCreateManyUserInput = {
    id?: string;
    tokenHash: string;
    expiresAt: Date | string;
    usedAt?: Date | string | null;
    createdAt?: Date | string;
};
export type PasswordResetTokenUpdateWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    tokenHash?: Prisma.StringFieldUpdateOperationsInput | string;
    expiresAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    usedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PasswordResetTokenUncheckedUpdateWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    tokenHash?: Prisma.StringFieldUpdateOperationsInput | string;
    expiresAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    usedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PasswordResetTokenUncheckedUpdateManyWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    tokenHash?: Prisma.StringFieldUpdateOperationsInput | string;
    expiresAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    usedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PasswordResetTokenSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    tokenHash?: boolean;
    userId?: boolean;
    expiresAt?: boolean;
    usedAt?: boolean;
    createdAt?: boolean;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["passwordResetToken"]>;
export type PasswordResetTokenSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    tokenHash?: boolean;
    userId?: boolean;
    expiresAt?: boolean;
    usedAt?: boolean;
    createdAt?: boolean;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["passwordResetToken"]>;
export type PasswordResetTokenSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    tokenHash?: boolean;
    userId?: boolean;
    expiresAt?: boolean;
    usedAt?: boolean;
    createdAt?: boolean;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["passwordResetToken"]>;
export type PasswordResetTokenSelectScalar = {
    id?: boolean;
    tokenHash?: boolean;
    userId?: boolean;
    expiresAt?: boolean;
    usedAt?: boolean;
    createdAt?: boolean;
};
export type PasswordResetTokenOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "tokenHash" | "userId" | "expiresAt" | "usedAt" | "createdAt", ExtArgs["result"]["passwordResetToken"]>;
export type PasswordResetTokenInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type PasswordResetTokenIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type PasswordResetTokenIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type $PasswordResetTokenPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "PasswordResetToken";
    objects: {
        user: Prisma.$UserPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        tokenHash: string;
        userId: string;
        expiresAt: Date;
        usedAt: Date | null;
        createdAt: Date;
    }, ExtArgs["result"]["passwordResetToken"]>;
    composites: {};
};
export type PasswordResetTokenGetPayload<S extends boolean | null | undefined | PasswordResetTokenDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$PasswordResetTokenPayload, S>;
export type PasswordResetTokenCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<PasswordResetTokenFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: PasswordResetTokenCountAggregateInputType | true;
};
export interface PasswordResetTokenDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['PasswordResetToken'];
        meta: {
            name: 'PasswordResetToken';
        };
    };
    findUnique<T extends PasswordResetTokenFindUniqueArgs>(args: Prisma.SelectSubset<T, PasswordResetTokenFindUniqueArgs<ExtArgs>>): Prisma.Prisma__PasswordResetTokenClient<runtime.Types.Result.GetResult<Prisma.$PasswordResetTokenPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends PasswordResetTokenFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, PasswordResetTokenFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__PasswordResetTokenClient<runtime.Types.Result.GetResult<Prisma.$PasswordResetTokenPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends PasswordResetTokenFindFirstArgs>(args?: Prisma.SelectSubset<T, PasswordResetTokenFindFirstArgs<ExtArgs>>): Prisma.Prisma__PasswordResetTokenClient<runtime.Types.Result.GetResult<Prisma.$PasswordResetTokenPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends PasswordResetTokenFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, PasswordResetTokenFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__PasswordResetTokenClient<runtime.Types.Result.GetResult<Prisma.$PasswordResetTokenPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends PasswordResetTokenFindManyArgs>(args?: Prisma.SelectSubset<T, PasswordResetTokenFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PasswordResetTokenPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends PasswordResetTokenCreateArgs>(args: Prisma.SelectSubset<T, PasswordResetTokenCreateArgs<ExtArgs>>): Prisma.Prisma__PasswordResetTokenClient<runtime.Types.Result.GetResult<Prisma.$PasswordResetTokenPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends PasswordResetTokenCreateManyArgs>(args?: Prisma.SelectSubset<T, PasswordResetTokenCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends PasswordResetTokenCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, PasswordResetTokenCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PasswordResetTokenPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends PasswordResetTokenDeleteArgs>(args: Prisma.SelectSubset<T, PasswordResetTokenDeleteArgs<ExtArgs>>): Prisma.Prisma__PasswordResetTokenClient<runtime.Types.Result.GetResult<Prisma.$PasswordResetTokenPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends PasswordResetTokenUpdateArgs>(args: Prisma.SelectSubset<T, PasswordResetTokenUpdateArgs<ExtArgs>>): Prisma.Prisma__PasswordResetTokenClient<runtime.Types.Result.GetResult<Prisma.$PasswordResetTokenPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends PasswordResetTokenDeleteManyArgs>(args?: Prisma.SelectSubset<T, PasswordResetTokenDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends PasswordResetTokenUpdateManyArgs>(args: Prisma.SelectSubset<T, PasswordResetTokenUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends PasswordResetTokenUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, PasswordResetTokenUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PasswordResetTokenPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends PasswordResetTokenUpsertArgs>(args: Prisma.SelectSubset<T, PasswordResetTokenUpsertArgs<ExtArgs>>): Prisma.Prisma__PasswordResetTokenClient<runtime.Types.Result.GetResult<Prisma.$PasswordResetTokenPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends PasswordResetTokenCountArgs>(args?: Prisma.Subset<T, PasswordResetTokenCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], PasswordResetTokenCountAggregateOutputType> : number>;
    aggregate<T extends PasswordResetTokenAggregateArgs>(args: Prisma.Subset<T, PasswordResetTokenAggregateArgs>): Prisma.PrismaPromise<GetPasswordResetTokenAggregateType<T>>;
    groupBy<T extends PasswordResetTokenGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: PasswordResetTokenGroupByArgs['orderBy'];
    } : {
        orderBy?: PasswordResetTokenGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, PasswordResetTokenGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPasswordResetTokenGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: PasswordResetTokenFieldRefs;
}
export interface Prisma__PasswordResetTokenClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    user<T extends Prisma.UserDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.UserDefaultArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface PasswordResetTokenFieldRefs {
    readonly id: Prisma.FieldRef<"PasswordResetToken", 'String'>;
    readonly tokenHash: Prisma.FieldRef<"PasswordResetToken", 'String'>;
    readonly userId: Prisma.FieldRef<"PasswordResetToken", 'String'>;
    readonly expiresAt: Prisma.FieldRef<"PasswordResetToken", 'DateTime'>;
    readonly usedAt: Prisma.FieldRef<"PasswordResetToken", 'DateTime'>;
    readonly createdAt: Prisma.FieldRef<"PasswordResetToken", 'DateTime'>;
}
export type PasswordResetTokenFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PasswordResetTokenSelect<ExtArgs> | null;
    omit?: Prisma.PasswordResetTokenOmit<ExtArgs> | null;
    include?: Prisma.PasswordResetTokenInclude<ExtArgs> | null;
    where: Prisma.PasswordResetTokenWhereUniqueInput;
};
export type PasswordResetTokenFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PasswordResetTokenSelect<ExtArgs> | null;
    omit?: Prisma.PasswordResetTokenOmit<ExtArgs> | null;
    include?: Prisma.PasswordResetTokenInclude<ExtArgs> | null;
    where: Prisma.PasswordResetTokenWhereUniqueInput;
};
export type PasswordResetTokenFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PasswordResetTokenSelect<ExtArgs> | null;
    omit?: Prisma.PasswordResetTokenOmit<ExtArgs> | null;
    include?: Prisma.PasswordResetTokenInclude<ExtArgs> | null;
    where?: Prisma.PasswordResetTokenWhereInput;
    orderBy?: Prisma.PasswordResetTokenOrderByWithRelationInput | Prisma.PasswordResetTokenOrderByWithRelationInput[];
    cursor?: Prisma.PasswordResetTokenWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.PasswordResetTokenScalarFieldEnum | Prisma.PasswordResetTokenScalarFieldEnum[];
};
export type PasswordResetTokenFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PasswordResetTokenSelect<ExtArgs> | null;
    omit?: Prisma.PasswordResetTokenOmit<ExtArgs> | null;
    include?: Prisma.PasswordResetTokenInclude<ExtArgs> | null;
    where?: Prisma.PasswordResetTokenWhereInput;
    orderBy?: Prisma.PasswordResetTokenOrderByWithRelationInput | Prisma.PasswordResetTokenOrderByWithRelationInput[];
    cursor?: Prisma.PasswordResetTokenWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.PasswordResetTokenScalarFieldEnum | Prisma.PasswordResetTokenScalarFieldEnum[];
};
export type PasswordResetTokenFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PasswordResetTokenSelect<ExtArgs> | null;
    omit?: Prisma.PasswordResetTokenOmit<ExtArgs> | null;
    include?: Prisma.PasswordResetTokenInclude<ExtArgs> | null;
    where?: Prisma.PasswordResetTokenWhereInput;
    orderBy?: Prisma.PasswordResetTokenOrderByWithRelationInput | Prisma.PasswordResetTokenOrderByWithRelationInput[];
    cursor?: Prisma.PasswordResetTokenWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.PasswordResetTokenScalarFieldEnum | Prisma.PasswordResetTokenScalarFieldEnum[];
};
export type PasswordResetTokenCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PasswordResetTokenSelect<ExtArgs> | null;
    omit?: Prisma.PasswordResetTokenOmit<ExtArgs> | null;
    include?: Prisma.PasswordResetTokenInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.PasswordResetTokenCreateInput, Prisma.PasswordResetTokenUncheckedCreateInput>;
};
export type PasswordResetTokenCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.PasswordResetTokenCreateManyInput | Prisma.PasswordResetTokenCreateManyInput[];
    skipDuplicates?: boolean;
};
export type PasswordResetTokenCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PasswordResetTokenSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.PasswordResetTokenOmit<ExtArgs> | null;
    data: Prisma.PasswordResetTokenCreateManyInput | Prisma.PasswordResetTokenCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.PasswordResetTokenIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type PasswordResetTokenUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PasswordResetTokenSelect<ExtArgs> | null;
    omit?: Prisma.PasswordResetTokenOmit<ExtArgs> | null;
    include?: Prisma.PasswordResetTokenInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.PasswordResetTokenUpdateInput, Prisma.PasswordResetTokenUncheckedUpdateInput>;
    where: Prisma.PasswordResetTokenWhereUniqueInput;
};
export type PasswordResetTokenUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.PasswordResetTokenUpdateManyMutationInput, Prisma.PasswordResetTokenUncheckedUpdateManyInput>;
    where?: Prisma.PasswordResetTokenWhereInput;
    limit?: number;
};
export type PasswordResetTokenUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PasswordResetTokenSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.PasswordResetTokenOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.PasswordResetTokenUpdateManyMutationInput, Prisma.PasswordResetTokenUncheckedUpdateManyInput>;
    where?: Prisma.PasswordResetTokenWhereInput;
    limit?: number;
    include?: Prisma.PasswordResetTokenIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type PasswordResetTokenUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PasswordResetTokenSelect<ExtArgs> | null;
    omit?: Prisma.PasswordResetTokenOmit<ExtArgs> | null;
    include?: Prisma.PasswordResetTokenInclude<ExtArgs> | null;
    where: Prisma.PasswordResetTokenWhereUniqueInput;
    create: Prisma.XOR<Prisma.PasswordResetTokenCreateInput, Prisma.PasswordResetTokenUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.PasswordResetTokenUpdateInput, Prisma.PasswordResetTokenUncheckedUpdateInput>;
};
export type PasswordResetTokenDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PasswordResetTokenSelect<ExtArgs> | null;
    omit?: Prisma.PasswordResetTokenOmit<ExtArgs> | null;
    include?: Prisma.PasswordResetTokenInclude<ExtArgs> | null;
    where: Prisma.PasswordResetTokenWhereUniqueInput;
};
export type PasswordResetTokenDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PasswordResetTokenWhereInput;
    limit?: number;
};
export type PasswordResetTokenDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PasswordResetTokenSelect<ExtArgs> | null;
    omit?: Prisma.PasswordResetTokenOmit<ExtArgs> | null;
    include?: Prisma.PasswordResetTokenInclude<ExtArgs> | null;
};
