import mongoose from "mongoose";
import Subscription from '../models/subscription.model.js';
import {workflowClient} from "../config/upstash.js";
import {SERVER_URL} from "../config/env.js";

// Throws an error with statusCode 400/404/403 so callers can `next(error)`.
export const findOwnedSubscription = async (id, userId) => {
    if (!mongoose.isValidObjectId(id)) {
        const error = new Error('Invalid subscription id');
        error.statusCode = 400;
        throw error;
    }
    const subscription = await Subscription.findById(id);
    if (!subscription) {
        const error = new Error('Subscription not found');
        error.statusCode = 404;
        throw error;
    }
    if (subscription.user.toString() !== String(userId)) {
        const error = new Error('You are not the owner of this subscription');
        error.statusCode = 403;
        throw error;
    }
    return subscription;
};

export const createSubscription = async (req, res, next) => {
    try {
        const subscription = await Subscription.create({
            ...req.body,
            user: req.user._id, //The user needs to be logged in, add authorize middleware to the route
        });

        const {workflowRunId} = await workflowClient.trigger({
            url: `${SERVER_URL}/api/v1/workflows/subscription/reminder`,
            body: {
                subscriptionId: subscription.id,
            },
            headers: {
                "content-type": "application/json",
            },
            retries: 0,
        });

        res.status(201).json({
            success: true,
            message: "Subscription created successfully",
            data: {
                subscription,
                workflowRunId,
            },
        });
    } catch (error) {
        next(error);
    }
};


export const getUserSubscriptions = async (req, res, next) => {
    try {
        //Check if the user is the same as the one in the token
        if (req.params.id !== req.user.id) {
            const error = new Error('You are not the owner of this account');
            error.statusCode = 403;
            throw error;
        }
        const subscriptions = await Subscription.find({user: req.params.id});
        res.status(200).json({success: true, data: subscriptions});
    } catch (error) {
        next(error);
    }
}

export const deleteSubscription = async (req, res, next) => {
    try {
        const subscription = await findOwnedSubscription(req.params.id, req.user.id);
        await subscription.deleteOne();
        res.status(204).end();
    } catch (error) {
        next(error);
    }
};
