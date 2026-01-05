import { PrismaClient } from "@prisma/client";
import { betterAuth, includes } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
// If your Prisma file is located elsewhere, you can change the path
import { polar, checkout, portal, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { env } from "~/env";
import { error } from "console";
import { db } from "~/server/db";

const polarClient = new Polar({
  accessToken: env.POLAR_ACCESS_TOKEN,
  server: "sandbox",
});

const prisma = new PrismaClient();
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or "mysql", "postgresql", ...etc
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              productId: "ee1cf832-02fd-4ca0-82dd-86d9ed11d7ab",
              slug: "small",
            },
            {
              productId: "b6892222-d100-462e-b139-c920b0422240",
              slug: "medium",
            },
            {
              productId: "5b3bd9bc-a872-4725-b140-8430dcc88c2a",
              slug: "large",
            },
          ],
          successUrl: "/dashboard",
          authenticatedUsersOnly: true,
        }),
        portal(),
        webhooks({
          secret: env.POLAR_WEBHOOK_SECRET,
          onOrderPaid: async (order) => {
            const externalCustomerId = order.data.customer.externalId;
            if (!externalCustomerId) {
              console.error("No external customer ID found.");
              throw new Error("No external customer id found");
            }
            const productId = order.data.productId;
            let creditsToAdd = 0;
            switch (productId) {
              case "ee1cf832-02fd-4ca0-82dd-86d9ed11d7ab":
                creditsToAdd = 50;
                break;
              case "b6892222-d100-462e-b139-c920b0422240":
                creditsToAdd = 200;
                break;
              case "5b3bd9bc-a872-4725-b140-8430dcc88c2a":
                creditsToAdd = 400;
                break;
            }
            await db.user.update({
              where: { id: externalCustomerId },
              data: {
                credits: {
                  increment: creditsToAdd,
                },
              },
            });
          },
        }),
      ],
    }),
  ],
});
