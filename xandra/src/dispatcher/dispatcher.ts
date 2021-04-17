import { config } from 'dotenv';
config();

import processor from '@xetha/processor';
import { Sequelize, DataTypes, Model } from 'sequelize';
import Logger from '../utils/Logger';
import hash from './hash';

processor(Logger);

const dispatcher = new Sequelize('sqlite://data/users.sqlite', { logging: false });

class User extends Model {

    public username!: string;
    public password!: string;
    public admin!: boolean;
    public databases!: string[];

}

User.init({
    username: {
        type: DataTypes.STRING,
        unique: true,
        primaryKey: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        set(val: string) {
            this.setDataValue('password', hash(val))
        }
    },
    admin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    databases: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: ['/'],
    },
}, {
    sequelize: dispatcher,
    freezeTableName: true,
    modelName: 'user',
    tableName: 'user',
});

dispatcher.sync()
    .then(() => dispatcher.authenticate())
    .catch((err) => {
        Logger.error(err);
        process.exit(1);
    });

export {
    User,
    dispatcher,
};