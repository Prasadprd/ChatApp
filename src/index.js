const http = require('http')
const path = require('path')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { getUser, removeUser, addUser, getUsersInRoom} = require('./utils/user')



const app= express()
const server = http.createServer(app)
const io = socketio(server)      // Creates a instance of socket.io

const port = process.env.PORT || 3000
const pubicDirectoryPath = path.join(__dirname,'../public')

app.use(express.static(pubicDirectoryPath))

io.on('connection',(socket)=>{
    //console.log(socket)
    socket.on('join',({username,room},callback)=>{
        const {user,error}=addUser({id:socket.id,username,room})
        if(error){
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('message',generateMessage('System','Welcome!'))
        socket.broadcast.to(user.room).emit('message',generateMessage('System',`${user.username} has joined`))
        io.to(user.room).emit('roomData',{
            room : user.room,
            users :getUsersInRoom(user.room)
        })
        callback()
    })
    socket.on('sendMessage',(message,callback)=>{
        const user = getUser(socket.id)
        const filter = new Filter()
        if(filter.isProfane(message)){
            return callback('Profanity is not allowed')
        }
        io.to(user.room).emit('message',generateMessage(user.username,message))
        callback()
    })

    socket.on('sendLocation',(coords,callback)=>{
        const user = getUser(socket.id)
       io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`http://google.com/maps?@${coords.latitude},${coords.longitude}`))
       callback()
    })
    socket.on('disconnect',()=>{
        const user =removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message',generateMessage('System',`${user.username} has left`))
            socket.to(user.room).emit('roomData',{
                room : user.room,
                users :getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port,()=>{
    console.log('Server is running on ',port)
})