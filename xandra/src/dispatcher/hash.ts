import { SHA512 } from 'crypto-js';

export default function hash(value: string) {
    return SHA512(value).toString();
}
