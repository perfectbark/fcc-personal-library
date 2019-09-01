/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
const MONGODB_CONNECTION_STRING = process.env.DB;
//Example connection: MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {});
let client, db;

(async function(){
  try {
    client = new MongoClient(MONGODB_CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    db = client.db('fcc');
  } catch(err) {
    console.error('connection error', err);
  }
})();

module.exports = function (app) {

  app.route('/api/books')
    .get(async function (req, res){
      //response will be array of book objects
      //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
      try {
        const r = await db.collection('books').aggregate([{$project: {title:1, comments:1, commentcount: { $size: "$comments"}}}]).toArray();
        return res.json(r);
      } catch (err) {
        console.error('get books error', err);
      }
    })
    
    .post(async function (req, res){
      var title = req.body.title;
      //response will contain new book object including atleast _id and title
      try {
        if (req.body.title) {
          const r = await db.collection('books').insertOne({title:req.body.title, comments:[]})
          return res.json({title: req.body.title, _id: r.insertedId, comments: []});
        } else {
          return res.send('missing title');
        }
      } catch (err) {
        console.error('post book error', err);
      }
    })
    
    .delete(async function(req, res){
      //if successful response will be 'complete delete successful'
      try {
        await db.collection('books').deleteMany({});
        return res.send('complete delete successful');
      } catch (err) {
        console.error('delete all books error', err);
      }
    });



  app.route('/api/books/:id')
    .get(async function (req, res){
      var bookid = req.params.id;
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
      try {
        const r = await db.collection('books').findOne({_id: ObjectId(bookid)})
        if (r == null) {
          return res.send('no book exists');
        }
        return res.json(r);
      } catch (err) {
        console.error('get books/:id error', err);
      }
    })
    
    .post(async function(req, res){
      var bookid = req.params.id;
      var comment = req.body.comment;
      //json res format same as .get
      try {
        if (bookid && comment) {
          let r = await db.collection('books').findOneAndUpdate({_id: ObjectId(bookid)}, {$push: {comments: comment}}, {returnOriginal: false});
          return res.json(r.value);
        } else {
          return res.send('missing id or comment');
        }
      } catch (err) {
        console.error('post comment error', err);
      }
    })
    
    .delete(async function(req, res){
      var bookid = req.params.id;
      //if successful response will be 'delete successful'
      try {
        const r = await db.collection('books').findOneAndDelete({_id: ObjectId(bookid)});
        return res.send('delete successful');
      } catch (err) {
        console.error('delete book error', err);
      }
    });
  
};
