import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";

vi.mock("../middlewares/arcjet.middleware.js", () => ({
  default: (req, res, next) => next(),
}));

describe("PUT /api/v1/subscriptions/:id/cancel (T2)", () => {
  let mongod, app, Subscription, alice, token;

  const makeSub = () =>
    Subscription.create({
      name: "Netflix",
      price: 10,
      frequency: "monthly",
      category: "entertainment",
      paymentMethod: "card",
      startDate: new Date(),
      user: alice._id,
    });

  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret";
    process.env.DB_URI = "mongodb://127.0.0.1:27017/test";
    process.env.ARCJET_KEY = "ajkey_test";

    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    ({ default: app } = await import("../app.js"));
    const { default: User } = await import("../models/user.model.js");
    ({ default: Subscription } = await import("../models/subscription.model.js"));

    alice = await User.create({ name: "alice", email: "alice@example.com", password: "secret123" });
    token = jwt.sign({ userId: alice.id }, process.env.JWT_SECRET);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it("AC-1: active sub -> 200, cancelled, renewalDate unchanged", async () => {
    const sub = await makeSub();
    const res = await request(app)
      .put(`/api/v1/subscriptions/${sub.id}/cancel`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("cancelled");
    expect(new Date(res.body.data.renewalDate).getTime()).toBe(sub.renewalDate.getTime());
    const stored = await Subscription.findById(sub.id);
    expect(stored.status).toBe("cancelled");
    expect(stored.renewalDate.getTime()).toBe(sub.renewalDate.getTime());
  });

  it("AC-2: already cancelled -> 200, still cancelled", async () => {
    const sub = await makeSub();
    const url = `/api/v1/subscriptions/${sub.id}/cancel`;
    await request(app).put(url).set("Authorization", `Bearer ${token}`);
    const res = await request(app).put(url).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("cancelled");
  });

  it("AC-6: no token -> 401", async () => {
    const sub = await makeSub();
    const res = await request(app).put(`/api/v1/subscriptions/${sub.id}/cancel`);
    expect(res.status).toBe(401);
  });
});
