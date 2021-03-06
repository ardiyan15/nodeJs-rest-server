const path = require('path')
const express = require('express')
const mongoose = require('mongoose')
const multer = require('multer')
const { v4: uuidv4} = require('uuid') 

const feedRoutes = require('./routes/feed')
const authRoutes = require('./routes/auth')

const password = encodeURIComponent('Hiro@)@!')
const MONGODB_URI =
  `mongodb://ardiyan:${password}@cluster0-shard-00-00.hzc5z.mongodb.net:27017,cluster0-shard-00-01.hzc5z.mongodb.net:27017,cluster0-shard-00-02.hzc5z.mongodb.net:27017/messages?ssl=true&replicaSet=atlas-9m52el-shard-0&authSource=admin&retryWrites=true&w=majority`;
const app = express()

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images')
    },
    filename: (req, file, cb) => {
        cb(null, uuidv4())
    }
})

const fileFilter = (req, file, cb) => {
    if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true)
    } else {
        cb(null, false)
    }
}

app.use(express.json())
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'))
app.use('/images', express.static(path.join(__dirname, 'images')))

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    next()
})

app.use('/feed', feedRoutes)
app.use('/auth', authRoutes)

app.use((error, req, res, next) => {
    console.log(error)
    const status = error.statusCode || 500
    const message = error.message
    const data = error.data
    res.status(status).json({message: message, data: data})
})

mongoose.connect(MONGODB_URI, {useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true})
    .then(result => {
        const server = app.listen(8080)
        const io = require('socket.io')(server, {
            cors: {
                origin: "http://localhost:3000",
                methods: ["GET","POST"]
            }
        })
        io.on('connection', socket => {
            console.log('Client Connected')
        })
    }).catch(err => console.log(err))