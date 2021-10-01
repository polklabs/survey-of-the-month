export class APIData {
    ok!: boolean;
    data?: any;
    error?: APIError;
}

export class APIError {
    code!: string;
    body!: {
        error: string;
        reason: string;
    };
}
