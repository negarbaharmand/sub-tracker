import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";

// Arcjet calls an external service; let every request through.
vi.mock("../middlewares/arcjet.middleware.js", () => ({
  default: (req, res, next) => next(),
}));

describe("DELETE /api/v1/subscriptions/:id (T3)", () => {
  let mongod, app, User, Subscription;
  let alice, bob, aliceToken, bobToken;

  const makeUser = (name) =>
    User.create({ name, email: `${name}@example.com`, password: "secret123" });

  const makeSub = (user) =>
    Subscription.create({
      name: "Netflix",
      price: 10,
      frequency: "monthly",
      category: "entertainment",
      paymentMethod: "card",
      startDate: new Date(),
      user: user._id,
    });

  const del = (id, token) => {
    const req = request(app).delete(`/api/v1/subscriptions/${id}`);
    return token ? req.set("Authorization", `Bearer ${token}`) : req;
  };

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

    alice = await makeUser("alice");
    bob = await makeUser("bob");
    aliceToken = jwt.sign({ userId: alice.id }, process.env.JWT_SECRET);
    bobToken = jwt.sign({ userId: bob.id }, process.env.JWT_SECRET);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it("AC-7: owner deletes -> 204 empty body, no longer listed", async () => {
    const sub = await makeSub(alice);
    const res = await del(sub.id, aliceToken);
    expect(res.status).toBe(204);
    expect(res.text).toBe("");

    const list = await request(app)
      .get(`/api/v1/subscriptions/user/${alice.id}`)
      .set("Authorization", `Bearer ${aliceToken}`);
    expect(list.status).toBe(200);
    expect(list.body.data.map((s) => s._id)).not.toContain(sub.id);
  });

  it("AC-3: other user's subscription -> 403, document kept", async () => {
    const sub = await makeSub(alice);
    const res = await del(sub.id, bobToken);
    expect(res.status).toBe(403);
    expect(await Subscription.findById(sub.id)).not.toBeNull();
  });

  it("AC-4: non-existent id -> 404", async () => {
    const res = await del(new mongoose.Types.ObjectId().toString(), aliceToken);
    expect(res.status).toBe(404);
  });

  it("AC-5: invalid ObjectId -> 400", async () => {
    const res = await del("abc", aliceToken);
    expect(res.status).toBe(400);
  });
});
