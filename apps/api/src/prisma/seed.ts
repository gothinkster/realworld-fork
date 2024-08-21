import {
  randEmail,
  randFullName,
  randLines,
  randParagraph,
  randPassword,
  randPhrase,
  randWord,
} from '@ngneat/falso';
import { PrismaClient } from '@prisma/client';
import { RegisteredUser } from '../app/models/registered-user.model';
import { createUser } from '../app/services/auth.service';
import { addComment, createArticle } from '../app/services/article.service';

const prisma = new PrismaClient();

export const generateUser = async (): Promise<RegisteredUser> =>
  createUser({
    username: randFullName(),
    email: randEmail(),
    password: randPassword(),
    image: 'https://api.realworld.io/images/demo-avatar.png',
    demo: true,
  });

export const generateArticle = async (id: number) =>
  createArticle(
    {
      title: randPhrase(),
      description: randParagraph(),
      body: randLines({ length: 10 }).join(' '),
      tagList: randWord({ length: 4 }),
    },
    id,
  );

export const generateComment = async (id: number, slug: string) =>
  addComment(randParagraph(), slug, id);

export const main = async () => {
  const users = await Promise.all(Array.from({ length: 11 }, () => generateUser()));
  users?.map(user => user);

  // eslint-disable-next-line no-restricted-syntax
  for await (const user of users) {
    const articles = [];

    for (let i = 0; i < 20; i++) {
      const article = await generateArticle(user.id);
      articles.push(article);
    }

    // eslint-disable-next-line no-restricted-syntax
    for await (const article of articles) {
      for await (const user of users) {
        await generateComment(user.id, article.slug);
      }
    }
  }
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.log(err)
    await prisma.$disconnect();
    process.exit(1);
  });
