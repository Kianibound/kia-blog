import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  // Seed base roles
  const roles = ['USER', 'AUTHOR', 'ADMIN'];

  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Find an existing AUTHOR user for test posts
  const author = await prisma.user.findFirst({
    where: {
      role: {
        name: 'AUTHOR',
      },
    },
  });

  if (!author) {
    throw new Error('No AUTHOR user found for post seeding.');
  }

  // Seed test posts for pagination testing
  for (let i = 1; i <= 25; i++) {
    const slug = `test-post-${i}`;

    await prisma.post.upsert({
      where: {
        slug,
      },
      update: {},
      create: {
        title: `Test Post ${i}`,
        slug,
        content: `This is test content for post ${i}.`,
        status: i % 3 === 0 ? 'DRAFT' : 'PUBLISHED',
        publishedAt: i % 3 === 0 ? null : new Date(),
        authorId: author.id,
      },
    });
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
