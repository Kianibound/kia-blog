import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type MediaModel = runtime.Types.Result.DefaultSelection<Prisma.$MediaPayload>;
export type AggregateMedia = {
    _count: MediaCountAggregateOutputType | null;
    _avg: MediaAvgAggregateOutputType | null;
    _sum: MediaSumAggregateOutputType | null;
    _min: MediaMinAggregateOutputType | null;
    _max: MediaMaxAggregateOutputType | null;
};
export type MediaAvgAggregateOutputType = {
    bytes: number | null;
    width: number | null;
    height: number | null;
};
export type MediaSumAggregateOutputType = {
    bytes: number | null;
    width: number | null;
    height: number | null;
};
export type MediaMinAggregateOutputType = {
    id: string | null;
    url: string | null;
    publicId: string | null;
    resourceType: string | null;
    format: string | null;
    bytes: number | null;
    width: number | null;
    height: number | null;
    ownerId: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type MediaMaxAggregateOutputType = {
    id: string | null;
    url: string | null;
    publicId: string | null;
    resourceType: string | null;
    format: string | null;
    bytes: number | null;
    width: number | null;
    height: number | null;
    ownerId: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
};
export type MediaCountAggregateOutputType = {
    id: number;
    url: number;
    publicId: number;
    resourceType: number;
    format: number;
    bytes: number;
    width: number;
    height: number;
    ownerId: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
};
export type MediaAvgAggregateInputType = {
    bytes?: true;
    width?: true;
    height?: true;
};
export type MediaSumAggregateInputType = {
    bytes?: true;
    width?: true;
    height?: true;
};
export type MediaMinAggregateInputType = {
    id?: true;
    url?: true;
    publicId?: true;
    resourceType?: true;
    format?: true;
    bytes?: true;
    width?: true;
    height?: true;
    ownerId?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type MediaMaxAggregateInputType = {
    id?: true;
    url?: true;
    publicId?: true;
    resourceType?: true;
    format?: true;
    bytes?: true;
    width?: true;
    height?: true;
    ownerId?: true;
    createdAt?: true;
    updatedAt?: true;
};
export type MediaCountAggregateInputType = {
    id?: true;
    url?: true;
    publicId?: true;
    resourceType?: true;
    format?: true;
    bytes?: true;
    width?: true;
    height?: true;
    ownerId?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
};
export type MediaAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.MediaWhereInput;
    orderBy?: Prisma.MediaOrderByWithRelationInput | Prisma.MediaOrderByWithRelationInput[];
    cursor?: Prisma.MediaWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | MediaCountAggregateInputType;
    _avg?: MediaAvgAggregateInputType;
    _sum?: MediaSumAggregateInputType;
    _min?: MediaMinAggregateInputType;
    _max?: MediaMaxAggregateInputType;
};
export type GetMediaAggregateType<T extends MediaAggregateArgs> = {
    [P in keyof T & keyof AggregateMedia]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateMedia[P]> : Prisma.GetScalarType<T[P], AggregateMedia[P]>;
};
export type MediaGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.MediaWhereInput;
    orderBy?: Prisma.MediaOrderByWithAggregationInput | Prisma.MediaOrderByWithAggregationInput[];
    by: Prisma.MediaScalarFieldEnum[] | Prisma.MediaScalarFieldEnum;
    having?: Prisma.MediaScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: MediaCountAggregateInputType | true;
    _avg?: MediaAvgAggregateInputType;
    _sum?: MediaSumAggregateInputType;
    _min?: MediaMinAggregateInputType;
    _max?: MediaMaxAggregateInputType;
};
export type MediaGroupByOutputType = {
    id: string;
    url: string;
    publicId: string;
    resourceType: string;
    format: string;
    bytes: number;
    width: number | null;
    height: number | null;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
    _count: MediaCountAggregateOutputType | null;
    _avg: MediaAvgAggregateOutputType | null;
    _sum: MediaSumAggregateOutputType | null;
    _min: MediaMinAggregateOutputType | null;
    _max: MediaMaxAggregateOutputType | null;
};
export type GetMediaGroupByPayload<T extends MediaGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<MediaGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof MediaGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], MediaGroupByOutputType[P]> : Prisma.GetScalarType<T[P], MediaGroupByOutputType[P]>;
}>>;
export type MediaWhereInput = {
    AND?: Prisma.MediaWhereInput | Prisma.MediaWhereInput[];
    OR?: Prisma.MediaWhereInput[];
    NOT?: Prisma.MediaWhereInput | Prisma.MediaWhereInput[];
    id?: Prisma.StringFilter<"Media"> | string;
    url?: Prisma.StringFilter<"Media"> | string;
    publicId?: Prisma.StringFilter<"Media"> | string;
    resourceType?: Prisma.StringFilter<"Media"> | string;
    format?: Prisma.StringFilter<"Media"> | string;
    bytes?: Prisma.IntFilter<"Media"> | number;
    width?: Prisma.IntNullableFilter<"Media"> | number | null;
    height?: Prisma.IntNullableFilter<"Media"> | number | null;
    ownerId?: Prisma.StringFilter<"Media"> | string;
    createdAt?: Prisma.DateTimeFilter<"Media"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Media"> | Date | string;
    owner?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
    avatarOf?: Prisma.XOR<Prisma.UserNullableScalarRelationFilter, Prisma.UserWhereInput> | null;
};
export type MediaOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    url?: Prisma.SortOrder;
    publicId?: Prisma.SortOrder;
    resourceType?: Prisma.SortOrder;
    format?: Prisma.SortOrder;
    bytes?: Prisma.SortOrder;
    width?: Prisma.SortOrderInput | Prisma.SortOrder;
    height?: Prisma.SortOrderInput | Prisma.SortOrder;
    ownerId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    owner?: Prisma.UserOrderByWithRelationInput;
    avatarOf?: Prisma.UserOrderByWithRelationInput;
};
export type MediaWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    publicId?: string;
    AND?: Prisma.MediaWhereInput | Prisma.MediaWhereInput[];
    OR?: Prisma.MediaWhereInput[];
    NOT?: Prisma.MediaWhereInput | Prisma.MediaWhereInput[];
    url?: Prisma.StringFilter<"Media"> | string;
    resourceType?: Prisma.StringFilter<"Media"> | string;
    format?: Prisma.StringFilter<"Media"> | string;
    bytes?: Prisma.IntFilter<"Media"> | number;
    width?: Prisma.IntNullableFilter<"Media"> | number | null;
    height?: Prisma.IntNullableFilter<"Media"> | number | null;
    ownerId?: Prisma.StringFilter<"Media"> | string;
    createdAt?: Prisma.DateTimeFilter<"Media"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Media"> | Date | string;
    owner?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
    avatarOf?: Prisma.XOR<Prisma.UserNullableScalarRelationFilter, Prisma.UserWhereInput> | null;
}, "id" | "publicId">;
export type MediaOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    url?: Prisma.SortOrder;
    publicId?: Prisma.SortOrder;
    resourceType?: Prisma.SortOrder;
    format?: Prisma.SortOrder;
    bytes?: Prisma.SortOrder;
    width?: Prisma.SortOrderInput | Prisma.SortOrder;
    height?: Prisma.SortOrderInput | Prisma.SortOrder;
    ownerId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
    _count?: Prisma.MediaCountOrderByAggregateInput;
    _avg?: Prisma.MediaAvgOrderByAggregateInput;
    _max?: Prisma.MediaMaxOrderByAggregateInput;
    _min?: Prisma.MediaMinOrderByAggregateInput;
    _sum?: Prisma.MediaSumOrderByAggregateInput;
};
export type MediaScalarWhereWithAggregatesInput = {
    AND?: Prisma.MediaScalarWhereWithAggregatesInput | Prisma.MediaScalarWhereWithAggregatesInput[];
    OR?: Prisma.MediaScalarWhereWithAggregatesInput[];
    NOT?: Prisma.MediaScalarWhereWithAggregatesInput | Prisma.MediaScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"Media"> | string;
    url?: Prisma.StringWithAggregatesFilter<"Media"> | string;
    publicId?: Prisma.StringWithAggregatesFilter<"Media"> | string;
    resourceType?: Prisma.StringWithAggregatesFilter<"Media"> | string;
    format?: Prisma.StringWithAggregatesFilter<"Media"> | string;
    bytes?: Prisma.IntWithAggregatesFilter<"Media"> | number;
    width?: Prisma.IntNullableWithAggregatesFilter<"Media"> | number | null;
    height?: Prisma.IntNullableWithAggregatesFilter<"Media"> | number | null;
    ownerId?: Prisma.StringWithAggregatesFilter<"Media"> | string;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"Media"> | Date | string;
    updatedAt?: Prisma.DateTimeWithAggregatesFilter<"Media"> | Date | string;
};
export type MediaCreateInput = {
    id?: string;
    url: string;
    publicId: string;
    resourceType: string;
    format: string;
    bytes: number;
    width?: number | null;
    height?: number | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    owner: Prisma.UserCreateNestedOneWithoutMediaInput;
    avatarOf?: Prisma.UserCreateNestedOneWithoutAvatarMediaInput;
};
export type MediaUncheckedCreateInput = {
    id?: string;
    url: string;
    publicId: string;
    resourceType: string;
    format: string;
    bytes: number;
    width?: number | null;
    height?: number | null;
    ownerId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    avatarOf?: Prisma.UserUncheckedCreateNestedOneWithoutAvatarMediaInput;
};
export type MediaUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    url?: Prisma.StringFieldUpdateOperationsInput | string;
    publicId?: Prisma.StringFieldUpdateOperationsInput | string;
    resourceType?: Prisma.StringFieldUpdateOperationsInput | string;
    format?: Prisma.StringFieldUpdateOperationsInput | string;
    bytes?: Prisma.IntFieldUpdateOperationsInput | number;
    width?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    height?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    owner?: Prisma.UserUpdateOneRequiredWithoutMediaNestedInput;
    avatarOf?: Prisma.UserUpdateOneWithoutAvatarMediaNestedInput;
};
export type MediaUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    url?: Prisma.StringFieldUpdateOperationsInput | string;
    publicId?: Prisma.StringFieldUpdateOperationsInput | string;
    resourceType?: Prisma.StringFieldUpdateOperationsInput | string;
    format?: Prisma.StringFieldUpdateOperationsInput | string;
    bytes?: Prisma.IntFieldUpdateOperationsInput | number;
    width?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    height?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    ownerId?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    avatarOf?: Prisma.UserUncheckedUpdateOneWithoutAvatarMediaNestedInput;
};
export type MediaCreateManyInput = {
    id?: string;
    url: string;
    publicId: string;
    resourceType: string;
    format: string;
    bytes: number;
    width?: number | null;
    height?: number | null;
    ownerId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type MediaUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    url?: Prisma.StringFieldUpdateOperationsInput | string;
    publicId?: Prisma.StringFieldUpdateOperationsInput | string;
    resourceType?: Prisma.StringFieldUpdateOperationsInput | string;
    format?: Prisma.StringFieldUpdateOperationsInput | string;
    bytes?: Prisma.IntFieldUpdateOperationsInput | number;
    width?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    height?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MediaUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    url?: Prisma.StringFieldUpdateOperationsInput | string;
    publicId?: Prisma.StringFieldUpdateOperationsInput | string;
    resourceType?: Prisma.StringFieldUpdateOperationsInput | string;
    format?: Prisma.StringFieldUpdateOperationsInput | string;
    bytes?: Prisma.IntFieldUpdateOperationsInput | number;
    width?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    height?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    ownerId?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MediaNullableScalarRelationFilter = {
    is?: Prisma.MediaWhereInput | null;
    isNot?: Prisma.MediaWhereInput | null;
};
export type MediaListRelationFilter = {
    every?: Prisma.MediaWhereInput;
    some?: Prisma.MediaWhereInput;
    none?: Prisma.MediaWhereInput;
};
export type MediaOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type MediaCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    url?: Prisma.SortOrder;
    publicId?: Prisma.SortOrder;
    resourceType?: Prisma.SortOrder;
    format?: Prisma.SortOrder;
    bytes?: Prisma.SortOrder;
    width?: Prisma.SortOrder;
    height?: Prisma.SortOrder;
    ownerId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type MediaAvgOrderByAggregateInput = {
    bytes?: Prisma.SortOrder;
    width?: Prisma.SortOrder;
    height?: Prisma.SortOrder;
};
export type MediaMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    url?: Prisma.SortOrder;
    publicId?: Prisma.SortOrder;
    resourceType?: Prisma.SortOrder;
    format?: Prisma.SortOrder;
    bytes?: Prisma.SortOrder;
    width?: Prisma.SortOrder;
    height?: Prisma.SortOrder;
    ownerId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type MediaMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    url?: Prisma.SortOrder;
    publicId?: Prisma.SortOrder;
    resourceType?: Prisma.SortOrder;
    format?: Prisma.SortOrder;
    bytes?: Prisma.SortOrder;
    width?: Prisma.SortOrder;
    height?: Prisma.SortOrder;
    ownerId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    updatedAt?: Prisma.SortOrder;
};
export type MediaSumOrderByAggregateInput = {
    bytes?: Prisma.SortOrder;
    width?: Prisma.SortOrder;
    height?: Prisma.SortOrder;
};
export type MediaCreateNestedOneWithoutAvatarOfInput = {
    create?: Prisma.XOR<Prisma.MediaCreateWithoutAvatarOfInput, Prisma.MediaUncheckedCreateWithoutAvatarOfInput>;
    connectOrCreate?: Prisma.MediaCreateOrConnectWithoutAvatarOfInput;
    connect?: Prisma.MediaWhereUniqueInput;
};
export type MediaCreateNestedManyWithoutOwnerInput = {
    create?: Prisma.XOR<Prisma.MediaCreateWithoutOwnerInput, Prisma.MediaUncheckedCreateWithoutOwnerInput> | Prisma.MediaCreateWithoutOwnerInput[] | Prisma.MediaUncheckedCreateWithoutOwnerInput[];
    connectOrCreate?: Prisma.MediaCreateOrConnectWithoutOwnerInput | Prisma.MediaCreateOrConnectWithoutOwnerInput[];
    createMany?: Prisma.MediaCreateManyOwnerInputEnvelope;
    connect?: Prisma.MediaWhereUniqueInput | Prisma.MediaWhereUniqueInput[];
};
export type MediaUncheckedCreateNestedManyWithoutOwnerInput = {
    create?: Prisma.XOR<Prisma.MediaCreateWithoutOwnerInput, Prisma.MediaUncheckedCreateWithoutOwnerInput> | Prisma.MediaCreateWithoutOwnerInput[] | Prisma.MediaUncheckedCreateWithoutOwnerInput[];
    connectOrCreate?: Prisma.MediaCreateOrConnectWithoutOwnerInput | Prisma.MediaCreateOrConnectWithoutOwnerInput[];
    createMany?: Prisma.MediaCreateManyOwnerInputEnvelope;
    connect?: Prisma.MediaWhereUniqueInput | Prisma.MediaWhereUniqueInput[];
};
export type MediaUpdateOneWithoutAvatarOfNestedInput = {
    create?: Prisma.XOR<Prisma.MediaCreateWithoutAvatarOfInput, Prisma.MediaUncheckedCreateWithoutAvatarOfInput>;
    connectOrCreate?: Prisma.MediaCreateOrConnectWithoutAvatarOfInput;
    upsert?: Prisma.MediaUpsertWithoutAvatarOfInput;
    disconnect?: Prisma.MediaWhereInput | boolean;
    delete?: Prisma.MediaWhereInput | boolean;
    connect?: Prisma.MediaWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.MediaUpdateToOneWithWhereWithoutAvatarOfInput, Prisma.MediaUpdateWithoutAvatarOfInput>, Prisma.MediaUncheckedUpdateWithoutAvatarOfInput>;
};
export type MediaUpdateManyWithoutOwnerNestedInput = {
    create?: Prisma.XOR<Prisma.MediaCreateWithoutOwnerInput, Prisma.MediaUncheckedCreateWithoutOwnerInput> | Prisma.MediaCreateWithoutOwnerInput[] | Prisma.MediaUncheckedCreateWithoutOwnerInput[];
    connectOrCreate?: Prisma.MediaCreateOrConnectWithoutOwnerInput | Prisma.MediaCreateOrConnectWithoutOwnerInput[];
    upsert?: Prisma.MediaUpsertWithWhereUniqueWithoutOwnerInput | Prisma.MediaUpsertWithWhereUniqueWithoutOwnerInput[];
    createMany?: Prisma.MediaCreateManyOwnerInputEnvelope;
    set?: Prisma.MediaWhereUniqueInput | Prisma.MediaWhereUniqueInput[];
    disconnect?: Prisma.MediaWhereUniqueInput | Prisma.MediaWhereUniqueInput[];
    delete?: Prisma.MediaWhereUniqueInput | Prisma.MediaWhereUniqueInput[];
    connect?: Prisma.MediaWhereUniqueInput | Prisma.MediaWhereUniqueInput[];
    update?: Prisma.MediaUpdateWithWhereUniqueWithoutOwnerInput | Prisma.MediaUpdateWithWhereUniqueWithoutOwnerInput[];
    updateMany?: Prisma.MediaUpdateManyWithWhereWithoutOwnerInput | Prisma.MediaUpdateManyWithWhereWithoutOwnerInput[];
    deleteMany?: Prisma.MediaScalarWhereInput | Prisma.MediaScalarWhereInput[];
};
export type MediaUncheckedUpdateManyWithoutOwnerNestedInput = {
    create?: Prisma.XOR<Prisma.MediaCreateWithoutOwnerInput, Prisma.MediaUncheckedCreateWithoutOwnerInput> | Prisma.MediaCreateWithoutOwnerInput[] | Prisma.MediaUncheckedCreateWithoutOwnerInput[];
    connectOrCreate?: Prisma.MediaCreateOrConnectWithoutOwnerInput | Prisma.MediaCreateOrConnectWithoutOwnerInput[];
    upsert?: Prisma.MediaUpsertWithWhereUniqueWithoutOwnerInput | Prisma.MediaUpsertWithWhereUniqueWithoutOwnerInput[];
    createMany?: Prisma.MediaCreateManyOwnerInputEnvelope;
    set?: Prisma.MediaWhereUniqueInput | Prisma.MediaWhereUniqueInput[];
    disconnect?: Prisma.MediaWhereUniqueInput | Prisma.MediaWhereUniqueInput[];
    delete?: Prisma.MediaWhereUniqueInput | Prisma.MediaWhereUniqueInput[];
    connect?: Prisma.MediaWhereUniqueInput | Prisma.MediaWhereUniqueInput[];
    update?: Prisma.MediaUpdateWithWhereUniqueWithoutOwnerInput | Prisma.MediaUpdateWithWhereUniqueWithoutOwnerInput[];
    updateMany?: Prisma.MediaUpdateManyWithWhereWithoutOwnerInput | Prisma.MediaUpdateManyWithWhereWithoutOwnerInput[];
    deleteMany?: Prisma.MediaScalarWhereInput | Prisma.MediaScalarWhereInput[];
};
export type IntFieldUpdateOperationsInput = {
    set?: number;
    increment?: number;
    decrement?: number;
    multiply?: number;
    divide?: number;
};
export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null;
    increment?: number;
    decrement?: number;
    multiply?: number;
    divide?: number;
};
export type MediaCreateWithoutAvatarOfInput = {
    id?: string;
    url: string;
    publicId: string;
    resourceType: string;
    format: string;
    bytes: number;
    width?: number | null;
    height?: number | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    owner: Prisma.UserCreateNestedOneWithoutMediaInput;
};
export type MediaUncheckedCreateWithoutAvatarOfInput = {
    id?: string;
    url: string;
    publicId: string;
    resourceType: string;
    format: string;
    bytes: number;
    width?: number | null;
    height?: number | null;
    ownerId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type MediaCreateOrConnectWithoutAvatarOfInput = {
    where: Prisma.MediaWhereUniqueInput;
    create: Prisma.XOR<Prisma.MediaCreateWithoutAvatarOfInput, Prisma.MediaUncheckedCreateWithoutAvatarOfInput>;
};
export type MediaCreateWithoutOwnerInput = {
    id?: string;
    url: string;
    publicId: string;
    resourceType: string;
    format: string;
    bytes: number;
    width?: number | null;
    height?: number | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    avatarOf?: Prisma.UserCreateNestedOneWithoutAvatarMediaInput;
};
export type MediaUncheckedCreateWithoutOwnerInput = {
    id?: string;
    url: string;
    publicId: string;
    resourceType: string;
    format: string;
    bytes: number;
    width?: number | null;
    height?: number | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    avatarOf?: Prisma.UserUncheckedCreateNestedOneWithoutAvatarMediaInput;
};
export type MediaCreateOrConnectWithoutOwnerInput = {
    where: Prisma.MediaWhereUniqueInput;
    create: Prisma.XOR<Prisma.MediaCreateWithoutOwnerInput, Prisma.MediaUncheckedCreateWithoutOwnerInput>;
};
export type MediaCreateManyOwnerInputEnvelope = {
    data: Prisma.MediaCreateManyOwnerInput | Prisma.MediaCreateManyOwnerInput[];
    skipDuplicates?: boolean;
};
export type MediaUpsertWithoutAvatarOfInput = {
    update: Prisma.XOR<Prisma.MediaUpdateWithoutAvatarOfInput, Prisma.MediaUncheckedUpdateWithoutAvatarOfInput>;
    create: Prisma.XOR<Prisma.MediaCreateWithoutAvatarOfInput, Prisma.MediaUncheckedCreateWithoutAvatarOfInput>;
    where?: Prisma.MediaWhereInput;
};
export type MediaUpdateToOneWithWhereWithoutAvatarOfInput = {
    where?: Prisma.MediaWhereInput;
    data: Prisma.XOR<Prisma.MediaUpdateWithoutAvatarOfInput, Prisma.MediaUncheckedUpdateWithoutAvatarOfInput>;
};
export type MediaUpdateWithoutAvatarOfInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    url?: Prisma.StringFieldUpdateOperationsInput | string;
    publicId?: Prisma.StringFieldUpdateOperationsInput | string;
    resourceType?: Prisma.StringFieldUpdateOperationsInput | string;
    format?: Prisma.StringFieldUpdateOperationsInput | string;
    bytes?: Prisma.IntFieldUpdateOperationsInput | number;
    width?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    height?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    owner?: Prisma.UserUpdateOneRequiredWithoutMediaNestedInput;
};
export type MediaUncheckedUpdateWithoutAvatarOfInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    url?: Prisma.StringFieldUpdateOperationsInput | string;
    publicId?: Prisma.StringFieldUpdateOperationsInput | string;
    resourceType?: Prisma.StringFieldUpdateOperationsInput | string;
    format?: Prisma.StringFieldUpdateOperationsInput | string;
    bytes?: Prisma.IntFieldUpdateOperationsInput | number;
    width?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    height?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    ownerId?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MediaUpsertWithWhereUniqueWithoutOwnerInput = {
    where: Prisma.MediaWhereUniqueInput;
    update: Prisma.XOR<Prisma.MediaUpdateWithoutOwnerInput, Prisma.MediaUncheckedUpdateWithoutOwnerInput>;
    create: Prisma.XOR<Prisma.MediaCreateWithoutOwnerInput, Prisma.MediaUncheckedCreateWithoutOwnerInput>;
};
export type MediaUpdateWithWhereUniqueWithoutOwnerInput = {
    where: Prisma.MediaWhereUniqueInput;
    data: Prisma.XOR<Prisma.MediaUpdateWithoutOwnerInput, Prisma.MediaUncheckedUpdateWithoutOwnerInput>;
};
export type MediaUpdateManyWithWhereWithoutOwnerInput = {
    where: Prisma.MediaScalarWhereInput;
    data: Prisma.XOR<Prisma.MediaUpdateManyMutationInput, Prisma.MediaUncheckedUpdateManyWithoutOwnerInput>;
};
export type MediaScalarWhereInput = {
    AND?: Prisma.MediaScalarWhereInput | Prisma.MediaScalarWhereInput[];
    OR?: Prisma.MediaScalarWhereInput[];
    NOT?: Prisma.MediaScalarWhereInput | Prisma.MediaScalarWhereInput[];
    id?: Prisma.StringFilter<"Media"> | string;
    url?: Prisma.StringFilter<"Media"> | string;
    publicId?: Prisma.StringFilter<"Media"> | string;
    resourceType?: Prisma.StringFilter<"Media"> | string;
    format?: Prisma.StringFilter<"Media"> | string;
    bytes?: Prisma.IntFilter<"Media"> | number;
    width?: Prisma.IntNullableFilter<"Media"> | number | null;
    height?: Prisma.IntNullableFilter<"Media"> | number | null;
    ownerId?: Prisma.StringFilter<"Media"> | string;
    createdAt?: Prisma.DateTimeFilter<"Media"> | Date | string;
    updatedAt?: Prisma.DateTimeFilter<"Media"> | Date | string;
};
export type MediaCreateManyOwnerInput = {
    id?: string;
    url: string;
    publicId: string;
    resourceType: string;
    format: string;
    bytes: number;
    width?: number | null;
    height?: number | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};
export type MediaUpdateWithoutOwnerInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    url?: Prisma.StringFieldUpdateOperationsInput | string;
    publicId?: Prisma.StringFieldUpdateOperationsInput | string;
    resourceType?: Prisma.StringFieldUpdateOperationsInput | string;
    format?: Prisma.StringFieldUpdateOperationsInput | string;
    bytes?: Prisma.IntFieldUpdateOperationsInput | number;
    width?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    height?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    avatarOf?: Prisma.UserUpdateOneWithoutAvatarMediaNestedInput;
};
export type MediaUncheckedUpdateWithoutOwnerInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    url?: Prisma.StringFieldUpdateOperationsInput | string;
    publicId?: Prisma.StringFieldUpdateOperationsInput | string;
    resourceType?: Prisma.StringFieldUpdateOperationsInput | string;
    format?: Prisma.StringFieldUpdateOperationsInput | string;
    bytes?: Prisma.IntFieldUpdateOperationsInput | number;
    width?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    height?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    avatarOf?: Prisma.UserUncheckedUpdateOneWithoutAvatarMediaNestedInput;
};
export type MediaUncheckedUpdateManyWithoutOwnerInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    url?: Prisma.StringFieldUpdateOperationsInput | string;
    publicId?: Prisma.StringFieldUpdateOperationsInput | string;
    resourceType?: Prisma.StringFieldUpdateOperationsInput | string;
    format?: Prisma.StringFieldUpdateOperationsInput | string;
    bytes?: Prisma.IntFieldUpdateOperationsInput | number;
    width?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    height?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MediaSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    url?: boolean;
    publicId?: boolean;
    resourceType?: boolean;
    format?: boolean;
    bytes?: boolean;
    width?: boolean;
    height?: boolean;
    ownerId?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    owner?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    avatarOf?: boolean | Prisma.Media$avatarOfArgs<ExtArgs>;
}, ExtArgs["result"]["media"]>;
export type MediaSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    url?: boolean;
    publicId?: boolean;
    resourceType?: boolean;
    format?: boolean;
    bytes?: boolean;
    width?: boolean;
    height?: boolean;
    ownerId?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    owner?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["media"]>;
export type MediaSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    url?: boolean;
    publicId?: boolean;
    resourceType?: boolean;
    format?: boolean;
    bytes?: boolean;
    width?: boolean;
    height?: boolean;
    ownerId?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    owner?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["media"]>;
export type MediaSelectScalar = {
    id?: boolean;
    url?: boolean;
    publicId?: boolean;
    resourceType?: boolean;
    format?: boolean;
    bytes?: boolean;
    width?: boolean;
    height?: boolean;
    ownerId?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
};
export type MediaOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "url" | "publicId" | "resourceType" | "format" | "bytes" | "width" | "height" | "ownerId" | "createdAt" | "updatedAt", ExtArgs["result"]["media"]>;
export type MediaInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    owner?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    avatarOf?: boolean | Prisma.Media$avatarOfArgs<ExtArgs>;
};
export type MediaIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    owner?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type MediaIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    owner?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type $MediaPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Media";
    objects: {
        owner: Prisma.$UserPayload<ExtArgs>;
        avatarOf: Prisma.$UserPayload<ExtArgs> | null;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        url: string;
        publicId: string;
        resourceType: string;
        format: string;
        bytes: number;
        width: number | null;
        height: number | null;
        ownerId: string;
        createdAt: Date;
        updatedAt: Date;
    }, ExtArgs["result"]["media"]>;
    composites: {};
};
export type MediaGetPayload<S extends boolean | null | undefined | MediaDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$MediaPayload, S>;
export type MediaCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<MediaFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: MediaCountAggregateInputType | true;
};
export interface MediaDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Media'];
        meta: {
            name: 'Media';
        };
    };
    findUnique<T extends MediaFindUniqueArgs>(args: Prisma.SelectSubset<T, MediaFindUniqueArgs<ExtArgs>>): Prisma.Prisma__MediaClient<runtime.Types.Result.GetResult<Prisma.$MediaPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends MediaFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, MediaFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__MediaClient<runtime.Types.Result.GetResult<Prisma.$MediaPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends MediaFindFirstArgs>(args?: Prisma.SelectSubset<T, MediaFindFirstArgs<ExtArgs>>): Prisma.Prisma__MediaClient<runtime.Types.Result.GetResult<Prisma.$MediaPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends MediaFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, MediaFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__MediaClient<runtime.Types.Result.GetResult<Prisma.$MediaPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends MediaFindManyArgs>(args?: Prisma.SelectSubset<T, MediaFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$MediaPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends MediaCreateArgs>(args: Prisma.SelectSubset<T, MediaCreateArgs<ExtArgs>>): Prisma.Prisma__MediaClient<runtime.Types.Result.GetResult<Prisma.$MediaPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends MediaCreateManyArgs>(args?: Prisma.SelectSubset<T, MediaCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends MediaCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, MediaCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$MediaPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends MediaDeleteArgs>(args: Prisma.SelectSubset<T, MediaDeleteArgs<ExtArgs>>): Prisma.Prisma__MediaClient<runtime.Types.Result.GetResult<Prisma.$MediaPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends MediaUpdateArgs>(args: Prisma.SelectSubset<T, MediaUpdateArgs<ExtArgs>>): Prisma.Prisma__MediaClient<runtime.Types.Result.GetResult<Prisma.$MediaPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends MediaDeleteManyArgs>(args?: Prisma.SelectSubset<T, MediaDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends MediaUpdateManyArgs>(args: Prisma.SelectSubset<T, MediaUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends MediaUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, MediaUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$MediaPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends MediaUpsertArgs>(args: Prisma.SelectSubset<T, MediaUpsertArgs<ExtArgs>>): Prisma.Prisma__MediaClient<runtime.Types.Result.GetResult<Prisma.$MediaPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends MediaCountArgs>(args?: Prisma.Subset<T, MediaCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], MediaCountAggregateOutputType> : number>;
    aggregate<T extends MediaAggregateArgs>(args: Prisma.Subset<T, MediaAggregateArgs>): Prisma.PrismaPromise<GetMediaAggregateType<T>>;
    groupBy<T extends MediaGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: MediaGroupByArgs['orderBy'];
    } : {
        orderBy?: MediaGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, MediaGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMediaGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: MediaFieldRefs;
}
export interface Prisma__MediaClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    owner<T extends Prisma.UserDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.UserDefaultArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    avatarOf<T extends Prisma.Media$avatarOfArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Media$avatarOfArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface MediaFieldRefs {
    readonly id: Prisma.FieldRef<"Media", 'String'>;
    readonly url: Prisma.FieldRef<"Media", 'String'>;
    readonly publicId: Prisma.FieldRef<"Media", 'String'>;
    readonly resourceType: Prisma.FieldRef<"Media", 'String'>;
    readonly format: Prisma.FieldRef<"Media", 'String'>;
    readonly bytes: Prisma.FieldRef<"Media", 'Int'>;
    readonly width: Prisma.FieldRef<"Media", 'Int'>;
    readonly height: Prisma.FieldRef<"Media", 'Int'>;
    readonly ownerId: Prisma.FieldRef<"Media", 'String'>;
    readonly createdAt: Prisma.FieldRef<"Media", 'DateTime'>;
    readonly updatedAt: Prisma.FieldRef<"Media", 'DateTime'>;
}
export type MediaFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MediaSelect<ExtArgs> | null;
    omit?: Prisma.MediaOmit<ExtArgs> | null;
    include?: Prisma.MediaInclude<ExtArgs> | null;
    where: Prisma.MediaWhereUniqueInput;
};
export type MediaFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MediaSelect<ExtArgs> | null;
    omit?: Prisma.MediaOmit<ExtArgs> | null;
    include?: Prisma.MediaInclude<ExtArgs> | null;
    where: Prisma.MediaWhereUniqueInput;
};
export type MediaFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MediaSelect<ExtArgs> | null;
    omit?: Prisma.MediaOmit<ExtArgs> | null;
    include?: Prisma.MediaInclude<ExtArgs> | null;
    where?: Prisma.MediaWhereInput;
    orderBy?: Prisma.MediaOrderByWithRelationInput | Prisma.MediaOrderByWithRelationInput[];
    cursor?: Prisma.MediaWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.MediaScalarFieldEnum | Prisma.MediaScalarFieldEnum[];
};
export type MediaFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MediaSelect<ExtArgs> | null;
    omit?: Prisma.MediaOmit<ExtArgs> | null;
    include?: Prisma.MediaInclude<ExtArgs> | null;
    where?: Prisma.MediaWhereInput;
    orderBy?: Prisma.MediaOrderByWithRelationInput | Prisma.MediaOrderByWithRelationInput[];
    cursor?: Prisma.MediaWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.MediaScalarFieldEnum | Prisma.MediaScalarFieldEnum[];
};
export type MediaFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MediaSelect<ExtArgs> | null;
    omit?: Prisma.MediaOmit<ExtArgs> | null;
    include?: Prisma.MediaInclude<ExtArgs> | null;
    where?: Prisma.MediaWhereInput;
    orderBy?: Prisma.MediaOrderByWithRelationInput | Prisma.MediaOrderByWithRelationInput[];
    cursor?: Prisma.MediaWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.MediaScalarFieldEnum | Prisma.MediaScalarFieldEnum[];
};
export type MediaCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MediaSelect<ExtArgs> | null;
    omit?: Prisma.MediaOmit<ExtArgs> | null;
    include?: Prisma.MediaInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.MediaCreateInput, Prisma.MediaUncheckedCreateInput>;
};
export type MediaCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.MediaCreateManyInput | Prisma.MediaCreateManyInput[];
    skipDuplicates?: boolean;
};
export type MediaCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MediaSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.MediaOmit<ExtArgs> | null;
    data: Prisma.MediaCreateManyInput | Prisma.MediaCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.MediaIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type MediaUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MediaSelect<ExtArgs> | null;
    omit?: Prisma.MediaOmit<ExtArgs> | null;
    include?: Prisma.MediaInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.MediaUpdateInput, Prisma.MediaUncheckedUpdateInput>;
    where: Prisma.MediaWhereUniqueInput;
};
export type MediaUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.MediaUpdateManyMutationInput, Prisma.MediaUncheckedUpdateManyInput>;
    where?: Prisma.MediaWhereInput;
    limit?: number;
};
export type MediaUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MediaSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.MediaOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.MediaUpdateManyMutationInput, Prisma.MediaUncheckedUpdateManyInput>;
    where?: Prisma.MediaWhereInput;
    limit?: number;
    include?: Prisma.MediaIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type MediaUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MediaSelect<ExtArgs> | null;
    omit?: Prisma.MediaOmit<ExtArgs> | null;
    include?: Prisma.MediaInclude<ExtArgs> | null;
    where: Prisma.MediaWhereUniqueInput;
    create: Prisma.XOR<Prisma.MediaCreateInput, Prisma.MediaUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.MediaUpdateInput, Prisma.MediaUncheckedUpdateInput>;
};
export type MediaDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MediaSelect<ExtArgs> | null;
    omit?: Prisma.MediaOmit<ExtArgs> | null;
    include?: Prisma.MediaInclude<ExtArgs> | null;
    where: Prisma.MediaWhereUniqueInput;
};
export type MediaDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.MediaWhereInput;
    limit?: number;
};
export type Media$avatarOfArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.UserSelect<ExtArgs> | null;
    omit?: Prisma.UserOmit<ExtArgs> | null;
    include?: Prisma.UserInclude<ExtArgs> | null;
    where?: Prisma.UserWhereInput;
};
export type MediaDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MediaSelect<ExtArgs> | null;
    omit?: Prisma.MediaOmit<ExtArgs> | null;
    include?: Prisma.MediaInclude<ExtArgs> | null;
};
