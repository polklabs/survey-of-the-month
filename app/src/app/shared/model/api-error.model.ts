export class APIError {
    code!: string;
    body!: {
        error: string;
        reason: string;
    };
}
