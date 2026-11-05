import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";

// Arcjet calls an external service; let every request through.
vi.mock("../middlewares/arcjet.middleware.js", () => ({
  default: (req, res, next) => next(),
}));

describe("ownership guard (T1)", () => {
  let mongod, app, User, Subscription, findOwnedSubscription;
  let alice, bob, aliceSub, aliceToken;

  const makeUser = (name) =>
    User.create({ name, email: `${name}@example.com`, password: "secret123" });

  beforeAll(async () => {
    // env.js reads these at import time, so set them before loading app.js.
    process.env.JWT_SECRET = "test-secret";
    process.env.DB_URI = "mongodb://127.0.0.1:27017/test";
    process.env.ARCJET_KEY = "ajkey_test";

    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    ({ default: app } = await import("../app.js"));
    ({ default: User } = await import("../models/user.model.js"));
    ({ default: Subscription } = await import("../models/subscription.model.js"));
    ({ findOwnedSubscription } = await import("../controllers/subscription.controller.js"));

    alice = await makeUser("alice");
    bob = await makeUser("bob");
    aliceToken = jwt.sign({ userId: alice.id }, process.env.JWT_SECRET);
    aliceSub = await Subscription.create({
      name: "Netflix",
      price: 10,
      frequency: "monthly",
      category: "entertainment",
      paymentMethod: "card",
      startDate: new Date(),
      user: alice._id,
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  describe("findOwnedSubscription", () => {
    it("AC-3: other user's subscription -> 403", async () => {
      await expect(findOwnedSubscription(aliceSub.id, bob.id)).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    it("AC-4: non-existent id -> 404", async () => {
      const missing = new mongoose.Types.ObjectId().toString();
      await expect(findOwnedSubscription(missing, alice.id)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("AC-5: invalid ObjectId -> 400", async () => {
      await expect(findOwnedSubscription("abc", alice.id)).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("returns the document for its owner", async () => {
      const found = await findOwnedSubscription(aliceSub.id, alice.id);
      expect(found.id).toBe(aliceSub.id);
    });
  });

  describe("GET /api/v1/subscriptions/user/:id", () => {
    it("AC-10: another user's id -> 403", async () => {
      const res = await request(app)
        .get(`/api/v1/subscriptions/user/${bob.id}`)
        .set("Authorization", `Bearer ${aliceToken}`);
      expect(res.status).toBe(403);
    });

    it("own id -> 200 with own subscriptions", async () => {
      const res = await request(app)
        .get(`/api/v1/subscriptions/user/${alice.id}`)
        .set("Authorization", `Bearer ${aliceToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });
});
