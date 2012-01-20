var util = require("util"),
    mongoose = require('mongoose'),
    crypto = require('crypto');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;


//Document
Document = new Schema({
  'title': {type: String, index: true},
  'data': String,
  'tags': [String]
});

Document.virtual('id').get(function() {
  return this._id.toHexString();
});


//User
function validatePresenceOf(value) {
  return value && value.length;
}

User = new Schema({
  'email': {
    type: String,
    validate: [validatePresenceOf, 'an email is required'],
    index: { unique: true } // 이메일 주소의 사용자가 오직 한명임을 확실히 하기 위해 unique 사용
  },
  'hashed_password': String,
  'salt': String
});

User.virtual('id').get(function() {
  return this._id.toHexString();
});

User.virtual('password').set(function(password) {
  this._password = password;
  this.salt = this.makeSalt();
  this.hashed_password = this.encryptPassword(password);
})
.get(function() { return this._password; });

User.method('authenticate', function(plainText) {
  return this.encryptPassword(plainText) === this.hashed_password;
});

User.method('makeSalt', function() {
  return Math.round((new Date().valueOf() * Math.random())) + '';
});

User.method('encryptPassword', function(password) {
  return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
});

// Mongoose 미들웨어 정의 - save 호출시에 발생
User.pre('save', function(next) {
  if (!validatePresenceOf(this.password)) {
    next(new Error('Invalid password'));
  } else {
    next();
  }
});


// 모델 생성
mongoose.model('Document', Document);
mongoose.model('User', User);


//모델 접근
exports.Document = function(db) {
  return db.model('Document');
};
exports.User = function(db) {
  return db.model('User');
};
