import mongodb from 'mongodb';
import envConfig from './../../environments/environment';
const MongoClient = mongodb.MongoClient

const uri = `mongodb+srv://${envConfig.db_username}:${envConfig.db_password}@cluster0.nzhyp.mongodb.net/${envConfig.db_default_db}?retryWrites=true&w=majority`;
const dbClient = new MongoClient(uri, { useNewUrlParser: true });
export default dbClient;