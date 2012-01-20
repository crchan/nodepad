var mongoose = require('mongoose');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

Document = new Schema({
  'title': {type: String, index: true},
  'data': String,
  'tags': [String]
});

Document.virtual('id').get(function() {
  return this._id.toHexString();
});

// 몽구스에게 만들어진 문서 알려주기
mongoose.model('Document', Document);

exports.Document = function(db) {
  return db.model('Document');  // ‘Document’라는 문서모델에 접근한다.
};
