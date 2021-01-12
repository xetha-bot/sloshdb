import { Model } from 'sequelize';
import { SHA512, enc } from 'crypto-js';
import { randomBytes } from 'crypto';

export default class User extends Model {
    public id!: number;
    public username!: string;
    public pwd!: string;
    public get password() {
        return this.pwd;
    }
    public set password(value: string) {
        this.pwd = SHA512(value + process.env.ENCRYPTION_KEY).toString(enc.Utf8);
    }
    public comparePassword(value: string) {
        return this.pwd === SHA512(value + process.env.ENCRYPTION_KEY).toString(enc.Utf8);
    }
    public randomPassword() {
        const pwd = randomBytes(12).toString('utf-8');
        this.pwd === SHA512(pwd + process.env.ENCRYPTION_KEY).toString(enc.Utf8);
        return pwd;
    }
}