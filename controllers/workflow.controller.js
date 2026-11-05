import dayjs from 'dayjs'

import {createRequire} from 'module';

const require = createRequire(import.meta.url);
const {serve} = require('@upstash/workflow/express');

import Subscription from "../models/subscription.model.js";
import {sendReminderEmail} from "../utils/send-email.js";


const REMINDERS = [7, 5, 2, 1];

export const runReminders = async (context) => {
    const {subscriptionId} = context.requestPayload;

    const subscription = await fetchSubscription(context, subscriptionId);

    if (!subscription || subscription.status !== 'active') return;

    const renewalDate = dayjs(subscription.renewalDate);
    if (renewalDate.isBefore(dayjs())) {
        console.log(`Renewal date has passed for subscription ${subscriptionId}.Stopping workflow`);
        return;
    }

    for (const daysBefore of REMINDERS) {
        const reminderDate = renewalDate.subtract(daysBefore, 'day');
        //renewal date = 22 feb, reminder date = 15 feb, 17 feb, 20 feb, 21 feb
        if (reminderDate.isAfter(dayjs())) {
            await sleepUntilReminders(context, `Reminder ${daysBefore} days before`, reminderDate)
        }
        if (dayjs().isSame(reminderDate, 'day')) {
            await triggerReminder(context, `${daysBefore} days before reminder`, subscription);
        }
    }
};

export const sendReminders = serve(runReminders);

const fetchSubscription = async (context, subscriptionId) => {
    const doc = await Subscription.findById(subscriptionId).populate('user', 'name email');
    if (!doc) return null;

    const subscription = doc.toObject(); // Flatten it
    await context.run('log subscription fetch', () => {
        console.log(`Fetched subscription ${subscriptionId}`);
    });

    return subscription;
};

const sleepUntilReminders = async (context, label, date) => {
    console.log(`Sleeping until ${label} reminder at ${date}`);
    await context.sleepUntil(label, date.toDate());
}

const triggerReminder = async (context, label, subscription) => {
    return await context.run(label, async () => {
        // Re-check: subscription may have been cancelled or deleted while sleeping.
        const doc = await Subscription.findById(subscription._id).populate('user', 'name email');
        if (!doc) return;
        const fresh = doc.toObject();
        if (fresh.status !== 'active') return;

        console.log(`Triggering ${label} reminder`);
        //send email, SMS, push notification

        await sendReminderEmail({
            to: fresh.user.email,
            type: label,
            subscription: fresh,
        });
    });
}