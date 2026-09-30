import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type EmailVerificationTokenModel = runtime.Types.Result.DefaultSelection<Prisma.$EmailVerificationTokenPayload>;
export type AggregateEmailVerificationToken = {
    _count: EmailVerificationTokenCountAggregateOutputType | null;
    _min: EmailVerificationTokenMinAggregateOutputType | null;
    _max: EmailVerificationTokenMaxAggregateOutputType | null;
};
export type EmailVerificationTokenMinAggregateOutputType = {
    id: string | null;
    tokenHash: string | null;
    userId: string | null;
    expiresAt: Date | null;
    usedAt: Date | null;
    createdAt: Date | null;
};
export type EmailVerificationTokenMaxAggregateOutputType = {
    id: string | null;
    tokenHash: string | null;
    userId: string | null;
    expiresAt: Date | null;
    usedAt: Date | null;
    createdAt: Date | null;
};
export type EmailVerificationTokenCountAggregateOutputType = {
    id: number;
    tokenHash: number;
    userId: number;
    expiresAt: number;
    usedAt: number;
    createdAt: number;
    _all: number;
};
export type EmailVerificationTokenMinAggregateInputType = {
    id?: true;
    tokenHash?: true;
    userId?: true;
    expiresAt?: true;
    usedAt?: true;
    createdAt?: true;
};
export type EmailVerificationTokenMaxAggregateInputType = {
    id?: true;
    tokenHash?: true;
    userId?: true;
    expiresAt?: true;
    usedAt?: true;
    createdAt?: true;
};
export type EmailVerificationTokenCountAggregateInputType = {
    id?: true;
    tokenHash?: true;
    userId?: true;
    expiresAt?: true;
    usedAt?: true;
    createdAt?: true;
    _all?: true;
};
export type EmailVerificationTokenAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.EmailVerificationTokenWhereInput;
    orderBy?: Prisma.EmailVerificationTokenOrderByWithRelationInput | Prisma.EmailVerificationTokenOrderByWithRelationInput[];
    cursor?: Prisma.EmailVerificationTokenWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | EmailVerificationTokenCountAggregateInputType;
    _min?: EmailVerificationTokenMinAggregateInputType;
    _max?: EmailVerificationTokenMaxAggregateInputType;
};
export type GetEmailVerificationTokenAggregateType<T extends EmailVerificationTokenAggregateArgs> = {
    [P in keyof T & keyof AggregateEmailVerificationToken]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateEmailVerificationToken[P]> : Prisma.GetScalarType<T[P], AggregateEmailVerificationToken[P]>;
};
export type EmailVerificationTokenGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.EmailVerificationTokenWhereInput;
    orderBy?: Prisma.EmailVerificationTokenOrderByWithAggregationInput | Prisma.EmailVerificationTokenOrderByWithAggregationInput[];
    by: Prisma.EmailVerificationTokenScalarFieldEnum[] | Prisma.EmailVerificationTokenScalarFieldEnum;
    having?: Prisma.EmailVerificationTokenScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: EmailVerificationTokenCountAggregateInputType | true;
    _min?: EmailVerificationTokenMinAggregateInputType;
    _max?: EmailVerificationTokenMaxAggregateInputType;
};
export type EmailVerificationTokenGroupByOutputType = {
    id: string;
    tokenHash: string;
    userId: string;
    expiresAt: Date;
    usedAt: Date | null;
    createdAt: Date;
    _count: EmailVerificationTokenCountAggregateOutputType | null;
    _min: EmailVerificationTokenMinAggregateOutputType | null;
    _max: EmailVerificationTokenMaxAggregateOutputType | null;
};
export type GetEmailVerificationTokenGroupByPayload<T extends EmailVerificationTokenGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<EmailVerificationTokenGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof EmailVerificationTokenGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], EmailVerificationTokenGroupByOutputType[P]> : Prisma.GetScalarType<T[P], EmailVerificationTokenGroupByOutputType[P]>;
}>>;
export type EmailVerificationTokenWhereInput = {
    AND?: Prisma.EmailVerificationTokenWhereInput | Prisma.EmailVerificationTokenWhereInput[];
    OR?: Prisma.EmailVerificationTokenWhereInput[];
    NOT?: Prisma.EmailVerificationTokenWhereInput | Prisma.EmailVerificationTokenWhereInput[];
    id?: Prisma.StringFilter<"EmailVerificationToken"> | string;
    tokenHash?: Prisma.StringFilter<"EmailVerificationToken"> | string;
    userId?: Prisma.StringFilter<"EmailVerificationToken"> | string;
    expiresAt?: Prisma.DateTimeFilter<"EmailVerificationToken"> | Date | string;
    usedAt?: Prisma.DateTimeNullableFilter<"EmailVerificationToken"> | Date | string | null;
    createdAt?: Prisma.DateTimeFilter<"EmailVerificationToken"> | Date | string;
    user?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
};
export type EmailVerificationTokenOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    tokenHash?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    expiresAt?: Prisma.SortOrder;
    usedAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    user?: Prisma.UserOrderByWithRelationInput;
};
export type EmailVerificationTokenWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    tokenHash?: string;
    AND?: Prisma.EmailVerificationTokenWhereInput | Prisma.EmailVerificationTokenWhereInput[];
    OR?: Prisma.EmailVerificationTokenWhereInput[];
    NOT?: Prisma.EmailVerificationTokenWhereInput | Prisma.EmailVerificationTokenWhereInput[];
    userId?: Prisma.StringFilter<"EmailVerificationToken"> | string;
    expiresAt?: Prisma.DateTimeFilter<"EmailVerificationToken"> | Date | string;
    usedAt?: Prisma.DateTimeNullableFilter<"EmailVerificationToken"> | Date | string | null;
    createdAt?: Prisma.DateTimeFilter<"EmailVerificationToken"> | Date | string;
    user?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
}, "id" | "tokenHash">;
export type EmailVerificationTokenOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    tokenHash?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    expiresAt?: Prisma.SortOrder;
    usedAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.EmailVerificationTokenCountOrderByAggregateInput;
    _max?: Prisma.EmailVerificationTokenMaxOrderByAggregateInput;
    _min?: Prisma.EmailVerificationTokenMinOrderByAggregateInput;
};
export type EmailVerificationTokenScalarWhereWithAggregatesInput = {
    AND?: Prisma.EmailVerificationTokenScalarWhereWithAggregatesInput | Prisma.EmailVerificationTokenScalarWhereWithAggregatesInput[];
    OR?: Prisma.EmailVerificationTokenScalarWhereWithAggregatesInput[];
    NOT?: Prisma.EmailVerificationTokenScalarWhereWithAggregatesInput | Prisma.EmailVerificationTokenScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"EmailVerificationToken"> | string;
    tokenHash?: Prisma.StringWithAggregatesFilter<"EmailVerificationToken"> | string;
    userId?: Prisma.StringWithAggregatesFilter<"EmailVerificationToken"> | string;
    expiresAt?: Prisma.DateTimeWithAggregatesFilter<"EmailVerificationToken"> | Date | string;
    usedAt?: Prisma.DateTimeNullableWithAggregatesFilter<"EmailVerificationToken"> | Date | string | null;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"EmailVerificationToken"> | Date | string;
};
export type EmailVerificationTokenCreateInput = {
    id?: string;
    tokenHash: string;
    expiresAt: Date | string;
    usedAt?: Date | string | null;
    createdAt?: Date | string;
    user: Prisma.UserCreateNestedOneWithoutEmailVerificationTokensInput;
};
export type EmailVerificationTokenUncheckedCreateInput = {
    id?: string;
    tokenHash: string;
    userId: string;
    expiresAt: Date | string;
    usedAt?: Date | string | null;
    createdAt?: Date | string;
};
export type EmailVerificationTokenUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    tokenHash?: Prisma.StringFieldUpdateOperationsInput | string;
    expiresAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    usedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    user?: Prisma.UserUpdateOneRequiredWithoutEmailVerificationTokensNestedInput;
};
export type EmailVerificationTokenUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    tokenHash?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    expiresAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    usedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type EmailVerificationTokenCreateManyInput = {
    id?: string;
    tokenHash: string;
    userId: string;
    expiresAt: Date | string;
    usedAt?: Date | string | null;
    createdAt?: Date | string;
};
export type EmailVerificationTokenUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    tokenHash?: Prisma.StringFieldUpdateOperationsInput | string;
    expiresAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    usedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type EmailVerificationTokenUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    tokenHash?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    expiresAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    usedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type EmailVerificationTokenListRelationFilter = {
    every?: Prisma.EmailVerificationTokenWhereInput;
    some?: Prisma.EmailVerificationTokenWhereInput;
    none?: Prisma.EmailVerificationTokenWhereInput;
};
export type EmailVerificationTokenOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type EmailVerificationTokenCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    tokenHash?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    expiresAt?: Prisma.SortOrder;
    usedAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type EmailVerificationTokenMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    tokenHash?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    expiresAt?: Prisma.SortOrder;
    usedAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type EmailVerificationTokenMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    tokenHash?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    expiresAt?: Prisma.SortOrder;
    usedAt?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type EmailVerificationTokenCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.EmailVerificationTokenCreateWithoutUserInput, Prisma.EmailVerificationTokenUncheckedCreateWithoutUserInput> | Prisma.EmailVerificationTokenCreateWithoutUserInput[] | Prisma.EmailVerificationTokenUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.EmailVerificationTokenCreateOrConnectWithoutUserInput | Prisma.EmailVerificationTokenCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.EmailVerificationTokenCreateManyUserInputEnvelope;
    connect?: Prisma.EmailVerificationTokenWhereUniqueInput | Prisma.EmailVerificationTokenWhereUniqueInput[];
};
export type EmailVerificationTokenUncheckedCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.EmailVerificationTokenCreateWithoutUserInput, Prisma.EmailVerificationTokenUncheckedCreateWithoutUserInput> | Prisma.EmailVerificationTokenCreateWithoutUserInput[] | Prisma.EmailVerificationTokenUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.EmailVerificationTokenCreateOrConnectWithoutUserInput | Prisma.EmailVerificationTokenCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.EmailVerificationTokenCreateManyUserInputEnvelope;
    connect?: Prisma.EmailVerificationTokenWhereUniqueInput | Prisma.EmailVerificationTokenWhereUniqueInput[];
};
export type EmailVerificationTokenUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.EmailVerificationTokenCreateWithoutUserInput, Prisma.EmailVerificationTokenUncheckedCreateWithoutUserInput> | Prisma.EmailVerificationTokenCreateWithoutUserInput[] | Prisma.EmailVerificationTokenUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.EmailVerificationTokenCreateOrConnectWithoutUserInput | Prisma.EmailVerificationTokenCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.EmailVerificationTokenUpsertWithWhereUniqueWithoutUserInput | Prisma.EmailVerificationTokenUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.EmailVerificationTokenCreateManyUserInputEnvelope;
    set?: Prisma.EmailVerificationTokenWhereUniqueInput | Prisma.EmailVerificationTokenWhereUniqueInput[];
    disconnect?: Prisma.EmailVerificationTokenWhereUniqueInput | Prisma.EmailVerificationTokenWhereUniqueInput[];
    delete?: Prisma.EmailVerificationTokenWhereUniqueInput | Prisma.EmailVerificationTokenWhereUniqueInput[];
    connect?: Prisma.EmailVerificationTokenWhereUniqueInput | Prisma.EmailVerificationTokenWhereUniqueInput[];
    update?: Prisma.EmailVerificationTokenUpdateWithWhereUniqueWithoutUserInput | Prisma.EmailVerificationTokenUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.EmailVerificationTokenUpdateManyWithWhereWithoutUserInput | Prisma.EmailVerificationTokenUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.EmailVerificationTokenScalarWhereInput | Prisma.EmailVerificationTokenScalarWhereInput[];
};
export type EmailVerificationTokenUncheckedUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.EmailVerificationTokenCreateWithoutUserInput, Prisma.EmailVerificationTokenUncheckedCreateWithoutUserInput> | Prisma.EmailVerificationTokenCreateWithoutUserInput[] | Prisma.EmailVerificationTokenUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.EmailVerificationTokenCreateOrConnectWithoutUserInput | Prisma.EmailVerificationTokenCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.EmailVerificationTokenUpsertWithWhereUniqueWithoutUserInput | Prisma.EmailVerificationTokenUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.EmailVerificationTokenCreateManyUserInputEnvelope;
    set?: Prisma.EmailVerificationTokenWhereUniqueInput | Prisma.EmailVerificationTokenWhereUniqueInput[];
    disconnect?: Prisma.EmailVerificationTokenWhereUniqueInput | Prisma.EmailVerificationTokenWhereUniqueInput[];
    delete?: Prisma.EmailVerificationTokenWhereUniqueInput | Prisma.EmailVerificationTokenWhereUniqueInput[];
    connect?: Prisma.EmailVerificationTokenWhereUniqueInput | Prisma.EmailVerificationTokenWhereUniqueInput[];
    update?: Prisma.EmailVerificationTokenUpdateWithWhereUniqueWithoutUserInput | Prisma.EmailVerificationTokenUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.EmailVerificationTokenUpdateManyWithWhereWithoutUserInput | Prisma.EmailVerificationTokenUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.EmailVerificationTokenScalarWhereInput | Prisma.EmailVerificationTokenScalarWhereInput[];
};
export type EmailVerificationTokenCreateWithoutUserInput = {
    id?: string;
    tokenHash: string;
    expiresAt: Date | string;
    usedAt?: Date | string | null;
    createdAt?: Date | string;
};
export type EmailVerificationTokenUncheckedCreateWithoutUserInput = {
    id?: string;
    tokenHash: string;
    expiresAt: Date | string;
    usedAt?: Date | string | null;
    createdAt?: Date | string;
};
export type EmailVerificationTokenCreateOrConnectWithoutUserInput = {
    where: Prisma.EmailVerificationTokenWhereUniqueInput;
    create: Prisma.XOR<Prisma.EmailVerificationTokenCreateWithoutUserInput, Prisma.EmailVerificationTokenUncheckedCreateWithoutUserInput>;
};
export type EmailVerificationTokenCreateManyUserInputEnvelope = {
    data: Prisma.EmailVerificationTokenCreateManyUserInput | Prisma.EmailVerificationTokenCreateManyUserInput[];
    skipDuplicates?: boolean;
};
export type EmailVerificationTokenUpsertWithWhereUniqueWithoutUserInput = {
    where: Prisma.EmailVerificationTokenWhereUniqueInput;
    update: Prisma.XOR<Prisma.EmailVerificationTokenUpdateWithoutUserInput, Prisma.EmailVerificationTokenUncheckedUpdateWithoutUserInput>;
    create: Prisma.XOR<Prisma.EmailVerificationTokenCreateWithoutUserInput, Prisma.EmailVerificationTokenUncheckedCreateWithoutUserInput>;
};
export type EmailVerificationTokenUpdateWithWhereUniqueWithoutUserInput = {
    where: Prisma.EmailVerificationTokenWhereUniqueInput;
    data: Prisma.XOR<Prisma.EmailVerificationTokenUpdateWithoutUserInput, Prisma.EmailVerificationTokenUncheckedUpdateWithoutUserInput>;
};
export type EmailVerificationTokenUpdateManyWithWhereWithoutUserInput = {
    where: Prisma.EmailVerificationTokenScalarWhereInput;
    data: Prisma.XOR<Prisma.EmailVerificationTokenUpdateManyMutationInput, Prisma.EmailVerificationTokenUncheckedUpdateManyWithoutUserInput>;
};
export type EmailVerificationTokenScalarWhereInput = {
    AND?: Prisma.EmailVerificationTokenScalarWhereInput | Prisma.EmailVerificationTokenScalarWhereInput[];
    OR?: Prisma.EmailVerificationTokenScalarWhereInput[];
    NOT?: Prisma.EmailVerificationTokenScalarWhereInput | Prisma.EmailVerificationTokenScalarWhereInput[];
    id?: Prisma.StringFilter<"EmailVerificationToken"> | string;
    tokenHash?: Prisma.StringFilter<"EmailVerificationToken"> | string;
    userId?: Prisma.StringFilter<"EmailVerificationToken"> | string;
    expiresAt?: Prisma.DateTimeFilter<"EmailVerificationToken"> | Date | string;
    usedAt?: Prisma.DateTimeNullableFilter<"EmailVerificationToken"> | Date | string | null;
    createdAt?: Prisma.DateTimeFilter<"EmailVerificationToken"> | Date | string;
};
export type EmailVerificationTokenCreateManyUserInput = {
    id?: string;
    tokenHash: string;
    expiresAt: Date | string;
    usedAt?: Date | string | null;
    createdAt?: Date | string;
};
export type EmailVerificationTokenUpdateWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    tokenHash?: Prisma.StringFieldUpdateOperationsInput | string;
    expiresAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    usedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type EmailVerificationTokenUncheckedUpdateWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    tokenHash?: Prisma.StringFieldUpdateOperationsInput | string;
    expiresAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    usedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type EmailVerificationTokenUncheckedUpdateManyWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    tokenHash?: Prisma.StringFieldUpdateOperationsInput | string;
    expiresAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    usedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type EmailVerificationTokenSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    tokenHash?: boolean;
    userId?: boolean;
    expiresAt?: boolean;
    usedAt?: boolean;
    createdAt?: boolean;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["emailVerificationToken"]>;
export type EmailVerificationTokenSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    tokenHash?: boolean;
    userId?: boolean;
    expiresAt?: boolean;
    usedAt?: boolean;
    createdAt?: boolean;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["emailVerificationToken"]>;
export type EmailVerificationTokenSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    tokenHash?: boolean;
    userId?: boolean;
    expiresAt?: boolean;
    usedAt?: boolean;
    createdAt?: boolean;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["emailVerificationToken"]>;
export type EmailVerificationTokenSelectScalar = {
    id?: boolean;
    tokenHash?: boolean;
    userId?: boolean;
    expiresAt?: boolean;
    usedAt?: boolean;
    createdAt?: boolean;
};
export type EmailVerificationTokenOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "tokenHash" | "userId" | "expiresAt" | "usedAt" | "createdAt", ExtArgs["result"]["emailVerificationToken"]>;
export type EmailVerificationTokenInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type EmailVerificationTokenIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type EmailVerificationTokenIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type $EmailVerificationTokenPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "EmailVerificationToken";
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
    }, ExtArgs["result"]["emailVerificationToken"]>;
    composites: {};
};
export type EmailVerificationTokenGetPayload<S extends boolean | null | undefined | EmailVerificationTokenDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$EmailVerificationTokenPayload, S>;
export type EmailVerificationTokenCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<EmailVerificationTokenFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: EmailVerificationTokenCountAggregateInputType | true;
};
export interface EmailVerificationTokenDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['EmailVerificationToken'];
        meta: {
            name: 'EmailVerificationToken';
        };
    };
    findUnique<T extends EmailVerificationTokenFindUniqueArgs>(args: Prisma.SelectSubset<T, EmailVerificationTokenFindUniqueArgs<ExtArgs>>): Prisma.Prisma__EmailVerificationTokenClient<runtime.Types.Result.GetResult<Prisma.$EmailVerificationTokenPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends EmailVerificationTokenFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, EmailVerificationTokenFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__EmailVerificationTokenClient<runtime.Types.Result.GetResult<Prisma.$EmailVerificationTokenPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends EmailVerificationTokenFindFirstArgs>(args?: Prisma.SelectSubset<T, EmailVerificationTokenFindFirstArgs<ExtArgs>>): Prisma.Prisma__EmailVerificationTokenClient<runtime.Types.Result.GetResult<Prisma.$EmailVerificationTokenPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends EmailVerificationTokenFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, EmailVerificationTokenFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__EmailVerificationTokenClient<runtime.Types.Result.GetResult<Prisma.$EmailVerificationTokenPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends EmailVerificationTokenFindManyArgs>(args?: Prisma.SelectSubset<T, EmailVerificationTokenFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$EmailVerificationTokenPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends EmailVerificationTokenCreateArgs>(args: Prisma.SelectSubset<T, EmailVerificationTokenCreateArgs<ExtArgs>>): Prisma.Prisma__EmailVerificationTokenClient<runtime.Types.Result.GetResult<Prisma.$EmailVerificationTokenPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends EmailVerificationTokenCreateManyArgs>(args?: Prisma.SelectSubset<T, EmailVerificationTokenCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends EmailVerificationTokenCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, EmailVerificationTokenCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$EmailVerificationTokenPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends EmailVerificationTokenDeleteArgs>(args: Prisma.SelectSubset<T, EmailVerificationTokenDeleteArgs<ExtArgs>>): Prisma.Prisma__EmailVerificationTokenClient<runtime.Types.Result.GetResult<Prisma.$EmailVerificationTokenPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends EmailVerificationTokenUpdateArgs>(args: Prisma.SelectSubset<T, EmailVerificationTokenUpdateArgs<ExtArgs>>): Prisma.Prisma__EmailVerificationTokenClient<runtime.Types.Result.GetResult<Prisma.$EmailVerificationTokenPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends EmailVerificationTokenDeleteManyArgs>(args?: Prisma.SelectSubset<T, EmailVerificationTokenDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends EmailVerificationTokenUpdateManyArgs>(args: Prisma.SelectSubset<T, EmailVerificationTokenUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends EmailVerificationTokenUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, EmailVerificationTokenUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$EmailVerificationTokenPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends EmailVerificationTokenUpsertArgs>(args: Prisma.SelectSubset<T, EmailVerificationTokenUpsertArgs<ExtArgs>>): Prisma.Prisma__EmailVerificationTokenClient<runtime.Types.Result.GetResult<Prisma.$EmailVerificationTokenPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends EmailVerificationTokenCountArgs>(args?: Prisma.Subset<T, EmailVerificationTokenCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], EmailVerificationTokenCountAggregateOutputType> : number>;
    aggregate<T extends EmailVerificationTokenAggregateArgs>(args: Prisma.Subset<T, EmailVerificationTokenAggregateArgs>): Prisma.PrismaPromise<GetEmailVerificationTokenAggregateType<T>>;
    groupBy<T extends EmailVerificationTokenGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: EmailVerificationTokenGroupByArgs['orderBy'];
    } : {
        orderBy?: EmailVerificationTokenGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, EmailVerificationTokenGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetEmailVerificationTokenGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: EmailVerificationTokenFieldRefs;
}
export interface Prisma__EmailVerificationTokenClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    user<T extends Prisma.UserDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.UserDefaultArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface EmailVerificationTokenFieldRefs {
    readonly id: Prisma.FieldRef<"EmailVerificationToken", 'String'>;
    readonly tokenHash: Prisma.FieldRef<"EmailVerificationToken", 'String'>;
    readonly userId: Prisma.FieldRef<"EmailVerificationToken", 'String'>;
    readonly expiresAt: Prisma.FieldRef<"EmailVerificationToken", 'DateTime'>;
    readonly usedAt: Prisma.FieldRef<"EmailVerificationToken", 'DateTime'>;
    readonly createdAt: Prisma.FieldRef<"EmailVerificationToken", 'DateTime'>;
}
export type EmailVerificationTokenFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.EmailVerificationTokenSelect<ExtArgs> | null;
    omit?: Prisma.EmailVerificationTokenOmit<ExtArgs> | null;
    include?: Prisma.EmailVerificationTokenInclude<ExtArgs> | null;
    where: Prisma.EmailVerificationTokenWhereUniqueInput;
};
export type EmailVerificationTokenFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.EmailVerificationTokenSelect<ExtArgs> | null;
    omit?: Prisma.EmailVerificationTokenOmit<ExtArgs> | null;
    include?: Prisma.EmailVerificationTokenInclude<ExtArgs> | null;
    where: Prisma.EmailVerificationTokenWhereUniqueInput;
};
export type EmailVerificationTokenFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.EmailVerificationTokenSelect<ExtArgs> | null;
    omit?: Prisma.EmailVerificationTokenOmit<ExtArgs> | null;
    include?: Prisma.EmailVerificationTokenInclude<ExtArgs> | null;
    where?: Prisma.EmailVerificationTokenWhereInput;
    orderBy?: Prisma.EmailVerificationTokenOrderByWithRelationInput | Prisma.EmailVerificationTokenOrderByWithRelationInput[];
    cursor?: Prisma.EmailVerificationTokenWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.EmailVerificationTokenScalarFieldEnum | Prisma.EmailVerificationTokenScalarFieldEnum[];
};
export type EmailVerificationTokenFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.EmailVerificationTokenSelect<ExtArgs> | null;
    omit?: Prisma.EmailVerificationTokenOmit<ExtArgs> | null;
    include?: Prisma.EmailVerificationTokenInclude<ExtArgs> | null;
    where?: Prisma.EmailVerificationTokenWhereInput;
    orderBy?: Prisma.EmailVerificationTokenOrderByWithRelationInput | Prisma.EmailVerificationTokenOrderByWithRelationInput[];
    cursor?: Prisma.EmailVerificationTokenWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.EmailVerificationTokenScalarFieldEnum | Prisma.EmailVerificationTokenScalarFieldEnum[];
};
export type EmailVerificationTokenFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.EmailVerificationTokenSelect<ExtArgs> | null;
    omit?: Prisma.EmailVerificationTokenOmit<ExtArgs> | null;
    include?: Prisma.EmailVerificationTokenInclude<ExtArgs> | null;
    where?: Prisma.EmailVerificationTokenWhereInput;
    orderBy?: Prisma.EmailVerificationTokenOrderByWithRelationInput | Prisma.EmailVerificationTokenOrderByWithRelationInput[];
    cursor?: Prisma.EmailVerificationTokenWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.EmailVerificationTokenScalarFieldEnum | Prisma.EmailVerificationTokenScalarFieldEnum[];
};
export type EmailVerificationTokenCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.EmailVerificationTokenSelect<ExtArgs> | null;
    omit?: Prisma.EmailVerificationTokenOmit<ExtArgs> | null;
    include?: Prisma.EmailVerificationTokenInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.EmailVerificationTokenCreateInput, Prisma.EmailVerificationTokenUncheckedCreateInput>;
};
export type EmailVerificationTokenCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.EmailVerificationTokenCreateManyInput | Prisma.EmailVerificationTokenCreateManyInput[];
    skipDuplicates?: boolean;
};
export type EmailVerificationTokenCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.EmailVerificationTokenSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.EmailVerificationTokenOmit<ExtArgs> | null;
    data: Prisma.EmailVerificationTokenCreateManyInput | Prisma.EmailVerificationTokenCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.EmailVerificationTokenIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type EmailVerificationTokenUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.EmailVerificationTokenSelect<ExtArgs> | null;
    omit?: Prisma.EmailVerificationTokenOmit<ExtArgs> | null;
    include?: Prisma.EmailVerificationTokenInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.EmailVerificationTokenUpdateInput, Prisma.EmailVerificationTokenUncheckedUpdateInput>;
    where: Prisma.EmailVerificationTokenWhereUniqueInput;
};
export type EmailVerificationTokenUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.EmailVerificationTokenUpdateManyMutationInput, Prisma.EmailVerificationTokenUncheckedUpdateManyInput>;
    where?: Prisma.EmailVerificationTokenWhereInput;
    limit?: number;
};
export type EmailVerificationTokenUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.EmailVerificationTokenSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.EmailVerificationTokenOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.EmailVerificationTokenUpdateManyMutationInput, Prisma.EmailVerificationTokenUncheckedUpdateManyInput>;
    where?: Prisma.EmailVerificationTokenWhereInput;
    limit?: number;
    include?: Prisma.EmailVerificationTokenIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type EmailVerificationTokenUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.EmailVerificationTokenSelect<ExtArgs> | null;
    omit?: Prisma.EmailVerificationTokenOmit<ExtArgs> | null;
    include?: Prisma.EmailVerificationTokenInclude<ExtArgs> | null;
    where: Prisma.EmailVerificationTokenWhereUniqueInput;
    create: Prisma.XOR<Prisma.EmailVerificationTokenCreateInput, Prisma.EmailVerificationTokenUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.EmailVerificationTokenUpdateInput, Prisma.EmailVerificationTokenUncheckedUpdateInput>;
};
export type EmailVerificationTokenDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.EmailVerificationTokenSelect<ExtArgs> | null;
    omit?: Prisma.EmailVerificationTokenOmit<ExtArgs> | null;
    include?: Prisma.EmailVerificationTokenInclude<ExtArgs> | null;
    where: Prisma.EmailVerificationTokenWhereUniqueInput;
};
export type EmailVerificationTokenDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.EmailVerificationTokenWhereInput;
    limit?: number;
};
export type EmailVerificationTokenDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.EmailVerificationTokenSelect<ExtArgs> | null;
    omit?: Prisma.EmailVerificationTokenOmit<ExtArgs> | null;
    include?: Prisma.EmailVerificationTokenInclude<ExtArgs> | null;
};
