const http = require('http')            
const path = require('path')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { getUser, removeUser, addUser, getUsersInRoom} = require('./utils/user')

//Setting the application and server
const app= express()
const server = http.createServer(app)
const io = socketio(server)      // Creates a instance of socket.io

const port = process.env.PORT || 3000
const pubicDirectoryPath = path.join(__dirname,'../public')

app.use(express.static(pubicDirectoryPath))

// Listening the connection event when a user connects to the server. We don't have to emit connection as it automatically emits when a users joins
io.on('connection',(socket)=>{
    //Listening for the join event. We can get the username and room of a user
    socket.on('join',({username,room},callback)=>{
        const {user,error}=addUser({id:socket.id,username,room})
        if(error){
            return callback(error)
        }
        socket.join(user.room)      //This function allows user to only join to a specific room

        //Emiting the msg event with welcome message
        socket.emit('message',generateMessage('System','Welcome!'))

        //.broadcast method is used to emit the given event to all users in a specific room except the users who is broadcasting it
        socket.broadcast.to(user.room).emit('message',generateMessage('System',`${user.username} has joined`))
        
        //io.emit is used to emit event to all users in room
        io.to(user.room).emit('roomData',{
            room : user.room,
            users :getUsersInRoom(user.room)
        })
        //this function is optional and only used to acknowledge that this event is successfully handled
        callback()
    })

    //Listening for the sendMessage event 
    socket.on('sendMessage',(message,callback)=>{
        const user = getUser(socket.id)
        const filter = new Filter()
        if(filter.isProfane(message)){
            return callback('Profanity is not allowed')
        }
        io.to(user.room).emit('message',generateMessage(user.username,message))
        callback()
    })

    //Listening for the sendLocation event 
    socket.on('sendLocation',(coords,callback)=>{
        const user = getUser(socket.id)
    
        //Emiting the locationMessage event with the location url as data
       io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`http://google.com/maps?@${coords.latitude},${coords.longitude}`))
       callback()
    })

    //This event executed when a user is disconnected
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