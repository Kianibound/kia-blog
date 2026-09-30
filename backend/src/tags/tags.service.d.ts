import { PrismaService } from '../database/prisma.service';
import type { CreateTagDto } from './dto/create-tag.dto';
import type { UpdateTagDto } from './dto/update-tag.dto';
export declare class TagsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateTagDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
    }>;
    findAll(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
    }[]>;
    update(id: string, dto: UpdateTagDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
