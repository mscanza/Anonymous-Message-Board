/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';
var mongo = require('mongodb').MongoClient;
var expect = require('chai').expect;
var CONNECTION_STRING = process.env.DB
var ObjectId = require('mongodb').ObjectId

module.exports = function (app) {
  
 mongo.connect(CONNECTION_STRING, function(err, db){
   if (err) {
     return console.log("Database error: " + err)
   }
   console.log('Successful Database Connection')
    
   app.route('/api/threads/:board')
   .get(function(req, res){
     var board = req.params.board;
   db.collection(board)
     .aggregate([
     {$match: {}},
     {$sort: {bumped_on: -1}},
     {$limit: 10},
     {$project: {_id: true, text: true, created_on: true, bumped_on: true, replies: { $slice: ["$replies", -3] },
      replycount: { $size: {$ifNull: ["$replies", []]} }    
                }}
   ]).toArray(function(err, docs){
     if (err){
       return console.log(err)
     }
  
     docs.forEach(function(doc){
       doc.replies = doc.replies.map(function(reply){
         return {_id: reply._id, text: reply.text, created_on: reply.created_on}
       })
     })
     return res.json(docs);
   })
   })
  
    .post(function(req, res){
     const board = req.params.board
     db.collection(board).insertOne({
       text: req.body.text,
       delete_password: req.body.delete_password,
       created_on: new Date(),
       bumped_on: new Date(),
       reported: false,
       replies: []
     }, {new: true}, function(err, doc){
       if (err) {
         return console.log(err)
       }
       //For testing
       if (board === 'general' && process.env.NODE_ENV === 'test'){
         return res.send(doc.ops[0])
       }
        res.redirect('/b/'+board+'/');
       return doc.ops[0];
     }) 
  }) 
   .put(function(req, res){
     const board = req.params.board;
     var id;
     try {
       id = ObjectId(req.body.report_id)
     } catch(err) {
       return res.send('Invalid thread id')
     }
     db.collection(board).findAndModify(
      {_id: id},
      {},
      {$set: {reported: true}},
       {new: true},
       function(err, doc){
         if (err){
           return console.log(err)
         }
         return res.send('success')
       }
     )
   })
   .delete(function(req, res){
     var board = req.params.board;
     var id;
     try {
       id = ObjectId(req.body.thread_id)
     }catch(err) {
       return res.send('Invalid thread id')
     }
    db.collection(board).findOne({_id: id}, function(err, doc){
      if (err) {
        return console.log(err)
      }
      if (req.body.delete_password !== doc.delete_password){
        return res.send('incorrect password')
      }
      db.collection(board).deleteOne({_id: id}, function(err, doc){
        if (err) {
          return console.log(err);
        }
        return res.send('success')
      })
    })
   })
  
   
  app.route('/api/replies/:board')
   .get(function(req, res){
    var board = req.params.board;
    var id;
    
    try {
      id = ObjectId(req.query.thread_id)
    } catch(err) {
      return res.send('Invalid thread id')
    }
    db.collection(board).find({_id: id}, {_id: 1, text: 1, created_on: 1, bumped_on: 1, replies: 1}).toArray(function(err, docs){
      if (err){
        return console.log(err);
      }
      if (!docs.length){
        return res.send('Cannot find thread')
      }
      docs[0].replies = docs[0].replies.map(function(doc){
        return {_id: doc._id, text: doc.text, created_on: doc.created_on}
      })
      return res.json(docs[0])
    })
  })
   .post(function(req, res){
    const board = req.params.board;
    var id;
    try {
      id = ObjectId(req.body.thread_id)
    } catch(err){
      return res.send('Invalid thread id')
    }
    db.collection(board).findAndModify(
    {_id: id},
     {},
    {$set: {bumped_on: new Date()},
    $push: { replies: {
      _id: new ObjectId(),
      delete_password: req.body.delete_password,
      text: req.body.text,
      created_on: new Date(),
      reported: false
    }}
    },{new: true},
      function(err, doc){
        if (err) {
          return console.log(err)
        }

        res.redirect('/b/'+board+'/'+req.body.thread_id)
        return doc.value
      }
    )
  }) 
   .put(function(req, res){
    var board = req.params.board
    var thread_id;
    var reply_id;
    try {
      thread_id = ObjectId(req.body.thread_id)
    } catch(err){
      return res.send('Invalid thread id')
    }
    try {
      reply_id = ObjectId(req.body.reply_id);
    } catch(err) {
      return res.send('Invalid reply id')
    }
    db.collection(board).update(
    {_id: thread_id,
    "replies._id": reply_id
    },
      {$set: {"replies.$.reported": true}},
      function(err, doc){
        if (err){
          return console.log(err)
        }
        return res.send('success')
      }
    )
  })
   .delete(function(req, res){
    var board = req.params.board
    var thread_id;
    var reply_id;
    try {
      thread_id = ObjectId(req.body.thread_id)
    } catch(err){
      return res.send('Invalid thread id')
    }
    try {
      reply_id = ObjectId(req.body.reply_id);
    } catch(err) {
      return res.send('Invalid reply id')
    }
    db.collection(board).findOne({_id: thread_id}, function(err, doc){
    doc.replies.forEach(function(reply){
      if (reply._id == req.body.reply_id){
        if (reply.delete_password !== req.body.delete_password){
          return res.send('incorrect password');
        } else if (reply.delete_password === req.body.delete_password){
          db.collection(board).update(
            {_id: thread_id,
            "replies._id": reply_id
            },
            {$set: {"replies.$.text": '[deleted]'}},
            function(err, doc){
              return res.send('success')
              }
            )
        }
      }
    })
    })

  })
   
   //404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});
   
 }) 
  


};
