const {Log} = require('../model');

class LogService {
    /**
     * 
     * @param {*} user ObjectId of user
     * @param {*} action Insert|Update|Delete
     * @param {*} collectionName Collection String where are the action
     * @param {*} query Query to get what was modified
     * @param {*} message Alternative, to let know with words what happend
     */
    static log(user, action, collectionName, query, message) {
        return new Log({
            user,
            action,
            collectionName,
            query,
            message
        }).save();
    }
}

module.exports = LogService;
