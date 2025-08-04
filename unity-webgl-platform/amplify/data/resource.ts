import { a, defineData, type ClientSchema } from "@aws-amplify/backend";

const schema = a.schema({
  Entity: a
    .model({
      // Core keys
      pk: a.id().required(),
      sk: a.string().required(),
      
      // GSI keys
      gsi1pk: a.string(),
      gsi1sk: a.string(),
      gsi2pk: a.string(),
      gsi2sk: a.string(),
      
      // Metadata
      type: a.string().required(),
      createdAt: a.datetime().required(),
      updatedAt: a.datetime().required(),
      
      // Unity Page attributes
      name: a.string(),
      slug: a.string(),
      enabled: a.boolean(),
      s3Path: a.string(),
      config: a.json(),
      
      // Analytics attributes
      pageId: a.string(),
      sessionId: a.string(),
      eventType: a.string(),
      eventData: a.json(),
      
      // Session attributes
      startTime: a.datetime(),
      completed: a.boolean(),
      progress: a.float(),
      score: a.float(),
      feedback: a.string(),
    })
    .identifier(["pk", "sk"])
    .secondaryIndexes((index) => [
      index("gsi1pk").sortKeys(["gsi1sk"]).name("bySession"),
      index("gsi2pk").sortKeys(["gsi2sk"]).name("byType"),
    ])
    .authorization((allow) => [
      allow.groups(["ADMINS"]).to(["create", "read", "update", "delete"]),
      allow.guest().to(["read"]),
      allow.authenticated().to(["read"]),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});