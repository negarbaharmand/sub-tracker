const errorMiddleware = (err, req, res, next) => {
    try {
        let error = {...err};

        error.message = err.message;

        if (process.env.NODE_ENV !== 'test') console.error(err);

// Mongoose bad ObjectId
        if (err.name === 'CastError') {
            const message = 'Resource not found';
            error = new Error(message);
            error.statusCode = 404;
        }
        // Mongoose duplicate key
        if (err.code === 11000) {
            const message = 'Duplicate field value entered';
            error = new Error(message);
            error.statusCode = 400;
        }
        // Mongoose validation error
        if (err.neme === 'ValidationError') {
            const message = Object.values(err.errors).map(val => val.message).join(', ');
            error = new Error(message);
            error.statusCode = 400;
        }
        res.status(err.statusCode || 500).json({success: false, error: error.message || 'Server error'});
    } catch (error) {
        next(error);
    }
};
// Create a subscription -> middlewares (check for renewal date) -> middlewares (check for errors) -> next -> controller

export default errorMiddleware;