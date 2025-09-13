export interface RegisterUserRequestBody {
    username: string;
    email: string;
    password: string;
    role: string;   
}

export interface LoginUserRequestBody {
    email: string;
    password: string;
}

export interface LoginUserResponse {
    message: string;
    user?: any;
    token?: string;
    error?: string;
}

export interface JwtPayload {
    userId: string;
    email: string;
}
