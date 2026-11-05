import {Router} from 'express';
import authorize from "../middlewares/auth.middleware.js";
import {createSubscription, deleteSubscription, getUserSubscriptions} from "../controllers/subscription.controller.js";

const subscriptionRouter = Router();

subscriptionRouter.get('/', (req, res) => res.send({title: 'Get all subscriptions'}));

subscriptionRouter.get('/:id', (req, res) => res.send({title: 'Get subscription details'}));

subscriptionRouter.post('/',authorize,createSubscription);

subscriptionRouter.put('/:id', (req, res) => res.send({title: 'Update subscription'}));

subscriptionRouter.delete('/:id', authorize, deleteSubscription);

subscriptionRouter.get('/user/:id', authorize, getUserSubscriptions);

subscriptionRouter.put('/:id/cancel', (req, res) => res.send({title: 'Cancel user subscriptions'}));

subscriptionRouter.get('/upcoming-renewals', (req, res) => res.send({title: 'Get upcoming renewals'}));


export default subscriptionRouter;