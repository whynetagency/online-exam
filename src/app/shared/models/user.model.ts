export interface IUser {
    uid: string;
    email: string;
    name: string;
    balances: IBalances;
    createdAt: any;
    isAdmin?: boolean;
}

export interface IBalances {
    [key: string]: {
        amount: number,
        expirationDate: any
    }
}

export interface ISignUpData {
    email: string;
    name: string;
    phone: string;
    password: string;
}

export interface ISignInData {
    email: string;
    password: string;
}
