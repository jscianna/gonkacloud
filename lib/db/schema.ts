import { relations } from "drizzle-orm";
import { bigint, boolean, decimal, integer, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkId: varchar("clerk_id", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  balanceUsd: decimal("balance_usd", { precision: 12, scale: 4 }).notNull().default("0"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).unique(),
  gonkaAddress: varchar("gonka_address", { length: 255 }),
  encryptedPrivateKey: text("encrypted_private_key"),
  encryptedMnemonic: text("encrypted_mnemonic"),
  inferenceRegistered: boolean("inference_registered").notNull().default(false),
  inferenceRegisteredAt: timestamp("inference_registered_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  keyHash: text("key_hash").notNull().unique(),
  keyPrefix: varchar("key_prefix", { length: 32 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});

export const usageLogs = pgTable("usage_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  apiKeyId: uuid("api_key_id").references(() => apiKeys.id, { onDelete: "set null" }),
  model: varchar("model", { length: 120 }).notNull(),
  promptTokens: integer("prompt_tokens").notNull().default(0),
  completionTokens: integer("completion_tokens").notNull().default(0),
  costUsd: decimal("cost_usd", { precision: 12, scale: 6 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 32 }).notNull(),
  amountUsd: decimal("amount_usd", { precision: 12, scale: 4 }).notNull(),
  balanceAfterUsd: decimal("balance_after_usd", { precision: 12, scale: 4 }),
  stripePaymentId: varchar("stripe_payment_id", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// New: API Subscriptions for token-based billing
export const apiSubscriptions = pgTable("api_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }).unique(),
  stripePriceId: varchar("stripe_price_id", { length: 255 }),
  status: varchar("status", { length: 32 }).notNull().default("active"), // active, canceled, past_due, trialing
  tokensAllocated: bigint("tokens_allocated", { mode: "bigint" }).notNull().default(0n),
  tokensUsed: bigint("tokens_used", { mode: "bigint" }).notNull().default(0n),
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  canceledAt: timestamp("canceled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Token transfers (sending GONKA to user wallets)
export const tokenTransfers = pgTable("token_transfers", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  subscriptionId: uuid("subscription_id").references(() => apiSubscriptions.id, { onDelete: "set null" }),
  fromAddress: varchar("from_address", { length: 255 }).notNull(),
  toAddress: varchar("to_address", { length: 255 }).notNull(),
  amountNgonka: varchar("amount_ngonka", { length: 64 }).notNull(),
  txHash: varchar("tx_hash", { length: 255 }),
  status: varchar("status", { length: 32 }).notNull().default("pending"), // pending, success, failed
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  apiKeys: many(apiKeys),
  usageLogs: many(usageLogs),
  transactions: many(transactions),
  subscription: one(apiSubscriptions),
  tokenTransfers: many(tokenTransfers),
}));

export const apiKeysRelations = relations(apiKeys, ({ one, many }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
  usageLogs: many(usageLogs),
}));

export const usageLogsRelations = relations(usageLogs, ({ one }) => ({
  user: one(users, {
    fields: [usageLogs.userId],
    references: [users.id],
  }),
  apiKey: one(apiKeys, {
    fields: [usageLogs.apiKeyId],
    references: [apiKeys.id],
  }),
}));

export const apiSubscriptionsRelations = relations(apiSubscriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [apiSubscriptions.userId],
    references: [users.id],
  }),
  tokenTransfers: many(tokenTransfers),
}));

export const tokenTransfersRelations = relations(tokenTransfers, ({ one }) => ({
  user: one(users, {
    fields: [tokenTransfers.userId],
    references: [users.id],
  }),
  subscription: one(apiSubscriptions, {
    fields: [tokenTransfers.subscriptionId],
    references: [apiSubscriptions.id],
  }),
}));
