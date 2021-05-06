import { prompt } from 'inquirer';
import { User, dispatcher } from '../dispatcher/dispatcher';

dispatcher.authenticate().then(async () => {
    const usernames = (await User.findAll()).map((user) => user.username);

    if (!usernames.length)
        throw new Error(`There are no users in the database`);

    prompt([
        {
            type: 'list',
            message: 'Select User',
            name: 'username',
            choices: usernames,
        },
    ]).then((results) => {
        const { username } = results as { username: string };

        prompt([
            {
                type: 'confirm',
                message: `Are you sure to delete '${username}'?`,
                name: 'confirmation',
                default: false,
            },
        ]).then((value) => {
            const { confirmation } = value as { confirmation: string };

            if (confirmation) {
                User.destroy({ where: { username } }).then(() => {
                    console.log(`User '${username}' has been deleted.`);
                });
            } else {
                console.log('I guess not.');
            }
        });
    });
});
