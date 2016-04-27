/**
 * Created by ericcarlton on 4/21/16.
 */
"use strict";

const mongo = require('mongodb').MongoClient;
const privateProperties = require('../config/privateProperties');
const appProperties = require('../config/appProperties');
const bunyan = require('bunyan');

const log = bunyan.createLogger({
    name: 'name-that-song',
    streams: [
        {
            level: appProperties.stdErrLvl,
            stream: process.stdout
        },
        {
            type: 'rotating-file',
            path: 'log/name-that-song-trace.log',
            level: 'trace',
            period: '1d',
            count: 7
        }
    ]
});

/**
 *  Performs CRUD operations on a mongodb collection.
 */
class Collection {
    /**
     * Sets this.collectionName.
     * @param collectionName    -   the name of the mongodb collection to perform CRUD operations on.
     */
    constructor(collectionName) {
        this.collectionName = collectionName;
    }

    /**
     * Connects to a mongodb instance and retrieves a collection with the name this.collectionName.
     * @returns {Promise}   -   If the operation was successful, resolves with result.db being the mongodb instance and
     *                          result.collection being the collection.  Otherwise, rejects with an error.
     * @private
     */
    _connectToDb() {
        log.trace('Entered Collection._connectToDb');

        return new Promise((resolve, reject) => {
            mongo.connect(privateProperties.mongoUrl).then((db) => {
                log.trace('Connection to DB successful, resolving from Collection._connectToDb');
                resolve({collection: db.collection(this.collectionName), db: db});
            }, (err) => {
                log.error({error: err}, 'Error with DB connection, rejecting from Collection._connectToDb');
                reject({
                    error: {
                        code: 1006,
                        message: appProperties.errorMessages['1006']
                    }
                });
            });
        });
    }

    /**
     * Inserts a document into this.collectionName. Returns a promise that resolves with the inserted document.
     * @param document          -   The document to insert.
     * @param retrievalQuery    -   A GET query that can be used to retrieve the document that was inserted.
     * @returns {Promise}       -   If the operation was a success, resolves with the document that was inserted.
     *                              Otherwise, rejects with an error.
     */
    insertDocument(document, retrievalQuery) {
        log.trace({collection: this.collectionName, document: document}, 'Entered Collection.insert');

        return new Promise((resolve, reject) => {
            this._connectToDb().then((connection) => {
                connection.collection.insertOne(document).then((result) => {
                    log.trace({
                        collection: this.collectionName,
                        document: document,
                        result: result
                    }, 'Document inserted');

                    this.getDocument(retrievalQuery).then((retrieved) => {
                        connection.db.close();

                        log.trace({
                            collection: this.collectionName,
                            document: retrieved
                        }, 'Document retrieved after insertion, resolving from Collection.insertDocument');

                        resolve(retrieved);
                    }, (err) => {
                        //error occurred while retrieving document
                        connection.db.close();

                        log.error({
                            collection: this.collectionName,
                            document: document,
                            error: err
                        }, 'Error retrieving document after insertion, rejecting from Collection.insertDocument');
                        reject({
                            error: {
                                code: 1006,
                                message: appProperties.errorMessages['1006']
                            }
                        });
                    });
                }, (err) => {
                    //error occurred while inserting document
                    connection.db.close();

                    log.error({
                        collection: this.collectionName,
                        document: document,
                        error: err
                    }, 'Error inserting document, rejecting from Collection.insertDocument');
                    reject({
                        error: {
                            code: 1006,
                            message: appProperties.errorMessages['1006']
                        }
                    });
                });
            }, (err) => {
                //error occurred while connecting to db
                log.trace({
                    collection: this.collectionName,
                    document: document,
                    error: err
                }, 'Error connecting to DB, rejecting from Collection.insertDocument');
                reject(err);
            });
        });
    }

    /**
     * Retrieves a document from this.collectionName. Returns a promise that resolves with the document retrieved.
     * @param query         -   The query used to retrieve the document.
     * @returns {Promise}   -   If the operation was a success, resolves with the document retrieved by the query ( even if it is null ).
     *                          Otherwise, rejects with an error.
     */
    getDocument(query) {
        log.trace({collection: this.collectionName, query: query}, 'Entered Collection.getDocument');

        return new Promise((resolve, reject) => {
            this._connectToDb().then((connection) => {
                connection.collection.find(query).limit(1).next().then((document) => {
                        connection.db.close();
                        if (document) {
                            log.trace({
                                collection: this.collectionName,
                                id: document._id
                            }, 'Document found, resolving from Collection.getDocument');
                        }
                        //document retrieved is null, log that the operation was successful but nothing was found
                        else {
                            log.trace({
                                collection: this.collectionName,
                                query: query
                            }, 'Document not found, resolving from Collection.getDocument with null');
                        }

                        resolve(document);
                    },
                    (err) => {
                        //error occurred while retrieving document
                        connection.db.close();
                        log.error({
                            collection: this.collectionName,
                            error: err,
                            query: query
                        }, 'Error while searching for document, rejecting from Collection.getDocument');
                        reject({
                            error: {
                                code: 1006,
                                message: appProperties.errorMessages['1006']
                            }
                        });
                    });
            }, (err) => {
                //error occurred while connecting to db
                log.trace({
                    collection: this.collectionName,
                    query: query,
                    error: err
                }, 'Error connecting to DB, rejecting from Collection.getDocument');
                reject(err);
            });
        });
    }

    /**
     * Inserts a document into this.collectionName. Returns a promise that resolves with the updated document.
     * @param document          -   The document to update.
     * @param retrievalQuery    -   A GET query that can be used to retrieve the document that was updated.
     * @returns {Promise}       -   If the operation was a success, resolves with the document that was updated.
     *                              Otherwise, rejects with an error.
     */
    updateDocument(document, retrievalQuery) {
        log.trace({collection: this.collectionName, id: document._id}, 'Entered Collection.updateDocument');

        return new Promise((resolve, reject) => {
            this._connectToDb().then((connection) => {
                connection.collection.updateOne({_id: document._id}, document).then((result) => {
                    log.trace({
                        collection: this.collectionName,
                        result: result,
                        id: document._id
                    }, 'Document updated');
                    this.getDocument(retrievalQuery).then((retrieved) => {
                        connection.db.close();

                        log.trace({
                            collection: this.collectionName,
                            result: result,
                            id: retrieved._id
                        }, 'Document retrieved after update, resolving from Collection.updateDocument');

                        resolve(retrieved);
                    }, (err) => {
                        //error occurred while retrieving document
                        connection.db.close();

                        log.error({
                            collection: this.collectionName,
                            id: document._id,
                            error: err
                        }, 'Error retrieving document after update, rejecting from Collection.updateDocument');
                        reject({
                            error: {
                                code: 1006,
                                message: appProperties.errorMessages['1006']
                            }
                        });
                    });
                }, (err) => {
                    //error occurred while updating document
                    connection.db.close();

                    log.error({
                        collection: this.collectionName,
                        error: err,
                        id: document._id
                    }, 'Error while updating document, rejecting from Collection.updateDocument');
                    reject({
                        error: {
                            code: 1006,
                            message: appProperties.errorMessages['1006']
                        }
                    });
                });
            }, (err) => {
                //error occurred while connection to db
                log.trace({
                    collection: this.collectionName,
                    id: document._id,
                    error: err
                }, 'Error connecting to DB, rejecting from Collection.updateDocument');
                reject(err);
            });
        });
    }

    /**
     * Deletes a document into this.collectionName. Returns a promise that resolves with the deleted document ( hopefully null ).
     * @param document          -   The document to delete.
     * @param retrievalQuery    -   A GET query that can be used to retrieve the document that was deleted.
     * @returns {Promise}       -   If the operation was a success, resolves with the document that was deleted ( hopefully null ).
     *                              Otherwise, rejects with an error.
     */
    deleteDocument(document, retrievalQuery) {
        log.trace({collection: this.collectionName, id: document._id}, 'Entered Collection.deleteDocument');

        return new Promise((resolve, reject) => {
            this._connectToDb().then((connection) => {
                connection.collection.deleteOne({_id: document._id}).then((result) => {
                    log.trace({
                        collection: this.collectionName,
                        result: result,
                        roomId: document._id
                    }, 'Document deleted');
                    this.getDocument(retrievalQuery).then((retrieved) => {
                        connection.db.close();

                        log.trace({
                            collection: this.collectionName,
                            id: document._id,
                            document: retrieved
                        }, 'Document retrieved after delete, resolving from Collection.deleteDocument');

                        resolve(retrieved);
                    }, (err) => {
                        //error occurred while retrieving document
                        connection.db.close();

                        log.error({
                            collection: this.collectionName,
                            id: document._id,
                            error: err
                        }, 'Error retrieving document after delete, rejecting from Collection.deleteDocument');

                        reject({
                            error: {
                                code: 1006,
                                message: appProperties.errorMessages['1006']
                            }
                        });
                    });
                }, (err) => {
                    //error occurred while deleting document
                    connection.db.close();

                    log.error({
                        collection: this.collectionName,
                        error: err,
                        id: document._id
                    }, 'Error while deleting document, rejecting from Collection.deleteDocument');

                    reject({
                        error: {
                            code: 1006,
                            message: appProperties.errorMessages['1006']
                        }
                    });
                });
            }, (err) => {
                //error occurred while connecting to db
                log.trace({
                    collection: this.collectionName,
                    id: document._id,
                    error: err
                }, 'Error connecting to DB, rejecting from Collection.deleteDocument');

                reject(err);
            });
        });
    }
}

module.exports = Collection;