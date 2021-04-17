## Dependencies
- [Node.js](https://nodejs.org/)
- `curl`
- `tar`

## Download Files
The first step in this process is to create the folder where the database will live and then move ourselves into that newly created folder. Below is an example of how to perform this operation.
```sh
mkdir sloshdb
cd sloshdb
```
Once you have created a new directory for the database and moved into it you'll need to download the database files. <br />
This is as simple as using curl to download our pre-packaged content. <br />
Once it is downloaded you'll need to unpack the archive. <br />
Once it is unpacked you'll need to delete the archive for future updates.
```sh
curl -Lo xandra.tar.gz https://github.com/oadpoaw/sloshdb/releases/latest/download/xandra.tar.gz
tar -xzvf xandra.tar.gz
rm xandra.tar.gz
```

## Installation
Now that all of the files have been downloaded we need to configure some core aspects of the database.

```sh
# Install the Dependencies
npm install --production

# Create your first user in the database
# And follow the prompts along
npm run u:create
# Get the username and password
# <username>:<password>

# To delete a user
npm run u:delete

# To edit or view a user
npm run u:edit

# To list all users in the database
npm run u:list
```

## Starting
```sh
npm start
```

## Updating

See [Updating](Updating.md)