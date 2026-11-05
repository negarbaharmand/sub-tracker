import { describe, it, expect, vi, beforeEach } from "vitest";
import dayjs from "dayjs";

vi.mock("../models/subscription.model.js", () => ({
  default: { findById: vi.fn() },
}));
vi.mock("../utils/send-email.js", () => ({
  sendReminderEmail: vi.fn(),
}));

const { default: Subscription } = await import("../models/subscription.model.js");
const { sendReminderEmail } = await import("../utils/send-email.js");
const { runReminders } = await import("../controllers/workflow.controller.js");

// Doc stand-in: findById(...).populate(...) resolves to a doc with toObject().
// The first lookup (workflow start) sees `atStart`; every later lookup (the
// re-check before sending) sees `later`, so extra lookups don't break the tests.
const mockFindById = (atStart, later) => {
  const query = (doc) => ({
    populate: vi.fn().mockResolvedValue(doc && { toObject: () => doc }),
  });
  Subscription.findById
    .mockReturnValueOnce(query(atStart))
    .mockReturnValue(query(later));
};

// Fake Upstash context: run executes the step, sleepUntil returns immediately.
const makeContext = () => ({
  requestPayload: { subscriptionId: "sub1" },
  run: vi.fn(async (_label, fn) => fn()),
  sleepUntil: vi.fn(async () => {}),
});

// Renewal in 2 days => the "2 days before" reminder is due today.
const makeSub = (status) => ({
  _id: "sub1",
  status,
  renewalDate: dayjs().add(2, "day").toDate(),
  user: { name: "Test", email: "test@example.com" },
});

describe("workflow re-check before send", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends the reminder when subscription is still active (control)", async () => {
    mockFindById(makeSub("active"), makeSub("active"));
    await runReminders(makeContext());
    expect(sendReminderEmail).toHaveBeenCalledTimes(1);
  });

  it("AC-8: does not send when cancelled after workflow started", async () => {
    mockFindById(makeSub("active"), makeSub("cancelled"));
    await runReminders(makeContext());
    expect(sendReminderEmail).not.toHaveBeenCalled();
  });

  it("AC-9: exits without throwing when deleted mid-workflow", async () => {
    mockFindById(makeSub("active"), null);
    await expect(runReminders(makeContext())).resolves.toBeUndefined();
    expect(sendReminderEmail).not.toHaveBeenCalled();
  });
});
