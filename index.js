const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const mongoose = require('mongoose')
const mySecret = process.env['MONGO_URI']
mongoose.connect(mySecret);
const Schema = mongoose.Schema;

let bodyParser = require("body-parser")
app.use("/", bodyParser.urlencoded({ extended: false }));

const userSchema = new Schema({
  username: {type: String, required: true, unique: true},
});
let userModel = mongoose.model("user", userSchema)

const exerciseSchema = new Schema({
  userId: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: new Date() }
})
let exerciseModel = mongoose.model("exercise", exerciseSchema);

app.post('/api/users', function (req, res){
  let username = req.body.username;
  let newUser = new userModel({ username: username });
  newUser.save();
  res.json(newUser);
});

app.get('/api/users', function(req, res){
  userModel.find({}).then((users) => {
    res.json(users);
  })
})

app.post('/api/users/:_id/exercises', function(req, res){
  
  let userId = req.params._id;

  exerciseObj = {
    userId: userId,
    description: req.body.description,
    duration: req.body.duration
  }

  if (req.body.date != ''){
    exerciseObj.date = req.body.date
  }

  let newExercise = new exerciseModel(exerciseObj);

  userModel.findById(userId).then(function(userFound){
    newExercise.save();
    res.json({
       _id: userFound._id, username: userFound.username,
       description: newExercise.description, duration: newExercise.duration,
      date: new Date(newExercise.date).toDateString()
    })
  }) 
})

app.get('/api/users/:_id/logs', (req, res) => {

  let fromParam = req.query.from;
  let toParam = req.query.to;
  let limitParam = req.query.limit;  
  let userId = req.params._id;
  
  limitParam = limitParam ? parseInt(limitParam): limitParam

  userModel.findById(userId).then(function(userFound){
    
      let queryObj = {
        userId: userId
      };
    if (fromParam || toParam){
    
          queryObj.date = {}
          if (fromParam){
            queryObj.date['$gte'] = fromParam;
          }
          if (toParam){
            queryObj.date['$lte'] = toParam;
          }
        }

   exerciseModel.find(queryObj).limit(limitParam).exec().then(function(exercises){
     
     let resObj = 
       {_id: userFound._id,
         username: userFound.username
        }
     
     exercises = exercises.map((x) => {
        return {
          description: x.description,
          duration: x.duration,
          date: new Date(x.date).toDateString()
        }
      })
     resObj.log = exercises;
      resObj.count = exercises.length;
       console.log("resObj", resObj)
      res.json(resObj);
   });
    })
    })




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
