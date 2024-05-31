const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const passport = require('passport')
const keys = require('../../config/keys')

// Express router
const router = express.Router()

// Load User Model
const User = require('../../models/User')

// Load input validation
const validateRegisterInput = require('../../validation/register')
const validateLoginInput = require('../../validation/login')

// @route GET     /api/users/register
// @description   register users
// @access        public
router.post('/register', (req, res) => {  
  const { errors, isValid } = validateRegisterInput(req.body);

  // Check Validation
  if (!isValid) {
    return res.status(400).json(errors);
  }


  User.findOne({ email: req.body.email }).then(user => {
    if (user) {
      errors.email = 'Email already exists';
      return res.status(400).json(errors);
    } else {

      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
      })

      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err
          newUser.password = hash;
          newUser
            .save()
            .then(user => res.json(user))
            .catch(err => console.log(err))
        })
      })
    }
  })
})

// @route GET     /api/users/login
// @description   login in page 
// @access        public
router.post('/login', (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body)
  const email = req.body.email
  const password = req.body.password

  if (!isValid) {
    return res.status(400).json(errors);
  }

  User.findOne({ email })
  .then(user => {
    if (!user) {
      return res.status(404).json({ email: 'User not found' })
    }

    // Check password
    bcrypt.compare(password, user.password)
      .then(isMatch => {
        // user matched
        if (isMatch) {
          // Create jwt payload
          const payload = { id: user.id, name: user.name, email: user.email }

          // sign token
          jwt.sign(
            payload,
            keys.secretOrKey,
            { expiresIn: 3600 },
            (err, token) => {
              if (err) console.log(err)

              res.json({
                message: true, 
                token: 'Bearer ' + token
              })
          }) // expires within an hour
        } else {
          return res.status(400).json({ password: 'Password incorrect' })
        }
      })  
  })
  .catch(err => console.log(err))
})

// @route GET     /api/users/current
// @description   Return current user
// @access        Private
router.get('/current', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.json({
    id: req.user.id, 
    name: req.user.name, 
    email: req.user.email
  })
})


module.exports = router

