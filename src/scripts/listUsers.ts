import { User, dispatcher } from '../dispatcher/dispatcher';

dispatcher.authenticate().then(async () => {

    const usernames = (await User.findAll()).map((user) => user.username);

    if (!usernames.length) throw new Error(`There are no users in the database`);

    console.log(usernames);

});