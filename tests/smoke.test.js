import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";

describe("smoke", () => {
  let app;

  beforeAll(async () => {
    // env.js reads these at import time, so set them before loading app.js.
    process.env.DB_URI = "mongodb://127.0.0.1:27017/test";
    process.env.ARCJET_KEY = "ajkey_test";
    ({ default: app } = await import("../app.js"));
  });

  it("GET / returns the welcome message", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.text).toBe("Welcome to the Subscription Tracker API");
  });
});
