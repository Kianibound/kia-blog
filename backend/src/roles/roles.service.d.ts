import { PrismaService } from '../database/prisma.service';
export declare class RolesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findRequiredByName(name: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
