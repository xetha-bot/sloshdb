import { prompt } from 'inquirer';
import Random from '@xetha/random';
import { User } from '../dispatcher/dispatcher';

prompt([
    {
        type: 'input',
        message: 'Username',
        name: 'username',
    },
    {
        type: 'confirm',
        message: 'Admin User?',
        name: 'admin',
        default: false,
    },
]).then(async (results) => {

    const { username, admin } = results as { username: string, admin: boolean; };
    const password = Random.string(16);

    const exist = await User.findOne({ where: { username } });
    if (exist) throw new Error(`Username with '${username}' already exists.`);

    User.create({
        username,
        password,
        admin,
    }).then(() => {

        console.log(`${username}:${password}`);

    });

}).catch(console.error);