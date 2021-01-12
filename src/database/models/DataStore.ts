import { Model } from 'sequelize';

export default class DataStore extends Model {
    public namespace!: string;
    public name!: string;
    public key!: string;
    public value!: any;
    public static async get(namespace: string, name: string, key: string) {
        return await this.findOne({ where: { namespace, name, key } });
    }
    public static async set(namespace: string, name: string, key: string, value: any) {
        let document = await this.findOne({ where: { namespace, name, key } });
        if (document) await this.update({ value }, { where: { namespace, name, key } });
        else await this.create({ namespace, name, key, value });
    }
    public static async delete(namespace: string, name: string, key: string) {
        return await this.destroy({ where: { namespace, name, key } });
    }
    public static async getAll(namespace: string, name: string) {
        return (await this.findAll({ where: { namespace, name } })).map((d) => {
            return {
                key: d.key,
                value: d.value,
            }
        });
    }
}