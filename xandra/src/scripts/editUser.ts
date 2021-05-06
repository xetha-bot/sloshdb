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
        {
            type: 'list',
            message: 'Select what to edit',
            name: 'selection',
            choices: ['databases', 'permissions'],
        },
    ]).then(async (results) => {
        const { username, selection } = results as {
            username: string;
            selection: 'databases' | 'permissions';
        };

        if (selection === 'permissions') {
            prompt([
                {
                    type: 'confirm',
                    message: 'Admin User?',
                    name: 'admin',
                    default: false,
                },
            ]).then((value) => {
                const { admin } = value as { admin: boolean };

                User.update({ admin }, { where: { username } }).then(() => {
                    console.log(admin);
                });
            });
        } else {
            prompt([
                {
                    type: 'list',
                    message: 'Select Action',
                    name: 'action',
                    choices: ['add', 'remove', 'list'],
                },
            ]).then(async (value) => {
                const { action } = value as {
                    action: 'add' | 'remove' | 'list';
                };

                const user = await User.findOne({ where: { username } });

                switch (action) {
                    case 'add': {
                        prompt([
                            {
                                type: 'input',
                                message: 'Add Access to Database',
                                name: 'database',
                            },
                        ]).then(({ database }) => {
                            database = `/${database.replace(/\//g, '')}`;
                            if (user.databases.includes(database)) {
                                console.log(
                                    'The user already has access to that database',
                                );
                            } else {
                                User.update(
                                    {
                                        databases: user.databases.concat(
                                            database,
                                        ),
                                    },
                                    { where: { username } },
                                ).then(() => {
                                    console.log(
                                        `'${username}' now has access to that database`,
                                    );
                                });
                            }
                        });

                        break;
                    }

                    case 'remove': {
                        if (!user.databases.length)
                            throw new Error(
                                `This user does not have access to any databases`,
                            );

                        prompt([
                            {
                                type: 'list',
                                message: 'Select Database to remove access',
                                name: 'database',
                                choices: user.databases,
                            },
                        ]).then(({ database }) => {
                            User.update(
                                {
                                    databases: user.databases.filter(
                                        (db) => db !== database,
                                    ),
                                },
                                { where: { username } },
                            ).then(() => {
                                console.log(
                                    `'${username}' has no longer have access to '${database}'`,
                                );
                            });
                        });

                        break;
                    }

                    case 'list': {
                        console.log(user.databases);
                        break;
                    }
                }
            });
        }
    });
});
