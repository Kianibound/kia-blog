export declare const userPublicSelect: {
    id: true;
    email: true;
    username: true;
    name: true;
    avatarUrl: true;
    emailVerified: true;
    createdAt: true;
    updatedAt: true;
    role: {
        select: {
            name: true;
        };
    };
};
