export class APIData {
    ok!: boolean;
    data?: any;
    error?: {
        code: string,
        body: {
            error: string;
            reason: string;
        }
    };
}
