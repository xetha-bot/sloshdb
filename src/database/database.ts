import { Sequelize, DataTypes } from 'sequelize';
import Logger from '../utils/Logger';
import User from './models/User';
import DataStore from './models/DataStore';

const sequelize = new Sequelize(process.env.DATABASE_URI || 'sqlite://tmp/temp.sqlite');

User.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
    },
    username: {
        type: DataTypes.STRING,
        unique: true,
        primaryKey: true,
    },
    pwd: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '',
    }
}, { sequelize, modelName: 'user' });

DataStore.init({
    namespace: DataTypes.STRING,
    name: DataTypes.STRING,
    key: DataTypes.STRING,
    value: DataTypes.JSON,
}, { sequelize, modelName: 'datastore' });

if (!process.argv.includes('--migrate')) {
    (async function () {
        if (process.argv.includes('--init')) {
            (await sequelize.sync({ force: true })).authenticate().catch((err) => Logger.error(err));
        } else {
            (await sequelize.sync()).authenticate().catch((err) => Logger.error(err));
        }
    }());
}

export { sequelize, User };