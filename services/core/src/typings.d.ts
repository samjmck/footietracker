declare namespace Express {
    interface Request {
        user: {
            id: number;
            customerId: string;
        };
    }
}
