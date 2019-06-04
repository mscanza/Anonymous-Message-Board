/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');
var testingId;
var testingId2;
var testingReplyId;
chai.use(chaiHttp);

suite('Functional Tests', function() {

  suite('API ROUTING FOR /api/threads/:board', function() {
    
    
    suite('POST', function() {
      
      test('POST a new thread on general board', function(done){
       chai.request(server)
       .post('/api/threads/general')
       .send({
        text: 'This is a test',
        delete_password: 'cowabunga'
      })
      .end(function(err, res){
         testingId = res.body._id;
        assert.equal(res.status, 200)
        assert.equal(res.body.text, 'This is a test')
        assert.property(res.body, 'created_on')
        assert.property(res.body, 'bumped_on')
        assert.equal(res.body.reported, false) 
        assert.isArray(res.body.replies, 'Replies should be an array')
        done();
      })
    })
      test('POST 2nd new thread on general board', function(done){
       chai.request(server)
       .post('/api/threads/general')
       .send({
        text: 'This is another test',
        delete_password: 'cows'
      })
      .end(function(err, res){
         testingId2 = res.body._id;
        assert.equal(res.status, 200)
        assert.equal(res.body.text, 'This is another test')
        assert.property(res.body, 'created_on')
        assert.property(res.body, 'bumped_on')
        assert.equal(res.body.reported, false) 
        assert.isArray(res.body.replies, 'Replies should be an array')
        done();
      })
    })

    });
 
    suite('GET', function() {
      test('GET request to the general board', function(done){
        chai.request(server)
         .get('/api/threads/general')
         .query({})
         .end(function(err, res){
          assert.equal(res.status, 200)
          assert.isArray(res.body, 'Response should be an array')
          assert.property(res.body[0], '_id')
          assert.property(res.body[0], 'text')
          assert.property(res.body[0], 'created_on')
          assert.property(res.body[0], 'bumped_on')
          assert.property(res.body[0], 'replycount')
          assert.isArray(res.body[0].replies)
          done();
        })
        
      })
    });
    
    suite('DELETE', function() {
      test('DELETE thread using incorrect password', function(done){
        chai.request(server)
         .delete('/api/threads/general')
         .send({board: 'general', thread_id: testingId, delete_password: 'dodgers'})
         .end(function(err, res){
          assert.equal(res.status, 200)
          assert.equal(res.text, 'incorrect password')
          done();
        })
      })
      
       test('DELETE thread using correct password', function(done){
        chai.request(server)
         .delete('/api/threads/general')
         .send({board: 'general', thread_id: testingId, delete_password: 'cowabunga'})
         .end(function(err, res){
          assert.equal(res.status, 200)
          assert.equal(res.text, 'success')
          done();
        })
      })
      
    });
    
    suite('PUT', function() {
      test('PUT request reporting a thread', function(done){
        chai.request(server)
         .put('/api/threads/general')
         .send({thread_id: testingId2})
         .end(function(err, res){
          assert.equal(res.status, 200)
          assert.equal(res.text, 'success')
          done()
        })
      })
    });
    
  });
      
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST', function() {
      test('POST a reply to thread on general board', function(done){
        chai.request(server)
         .post('/api/replies/general')
         .send({thread_id: testingId2,text: 'This is a reply', delete_password: 'deletereply'})
         .end(function(err, res){
          console.log(res.body)
          assert.equal(res.status, 200)
          assert.equal()
          done();
        })
      })
      
      test('GET request check thread bumped_on equals reply created_on', function(done){
        chai.request(server)
        .get('/api/replies/general')
        .query({thread_id: testingId2})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.bumped_on, res.body.replies[0].created_on)
          done();
       })
      })
       
    });
    
    suite('GET', function() {
      test('GET replies from thread on general', function(done){
        chai.request(server)
         .get('/api/replies/general')
         .query({thread_id: testingId2})
         .end(function(err, res){
          testingReplyId = res.body.replies[0]._id
          assert.equal(res.status, 200) 
          assert.isAtLeast(res.body.replies.length, 1)
          assert.property(res.body.replies[0], 'created_on')
          assert.property(res.body.replies[0], '_id')
          assert.property(res.body.replies[0], 'text')
          assert.equal(res.body.replies[0].text, 'This is a reply')
          done();
        })
      })
    });
     
    suite('PUT', function() {
      test('PUT request to report reply', function(done){
        chai.request(server)
         .put('/api/replies/general')
         .send({board: 'general',thread_id: testingId2, reply_id: testingReplyId})
         .end(function(err, res){
          assert.equal(res.status, 200)
          assert.equal(res.text, 'success')
          done();
        })
      })
    });
    
    suite('DELETE', function() {
      test('DELETE a reply from a thread on the general board using incorrect password', function(done){
        chai.request(server)
         .delete('/api/replies/general')
         .send({thread_id: testingId2, reply_id: testingReplyId, delete_password: 'differentdeletepassword'})
         .end(function(err, res){
          assert.equal(res.status, 200)
          assert.equal(res.text, 'incorrect password')
          done();
        })
         
      })
       
       test('DELETE a reply from a thread on the general board using correct password', function(done){
        chai.request(server)
         .delete('/api/replies/general')
         .send({thread_id: testingId2, reply_id: testingReplyId, delete_password: 'deletereply'})
         .end(function(err, res){
          assert.equal(res.status, 200)
          assert.equal(res.text, 'success')
          done();
        })
         
      })
        test('GET request check reply was deleted', function(done){
        chai.request(server)
          .get('/api/replies/general')
          .query({thread_id: testingId2})
          .end(function(err, res){
          assert.equal(res.status, 200)
          assert.equal(res.body.replies[0].text, '[deleted]')
          done();
        })
       
        
      })
    });
    
  });

});
