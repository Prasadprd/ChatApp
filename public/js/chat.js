const socket = io()

// Elements from html page
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')

const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
const $sidebar = document.querySelector('#sidebar')
//Templates
const $messageTemplate = document.querySelector('#message-template').innerHTML
const $locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
//options
const {username , room} = Qs.parse(location.search,{ignoreQueryPrefix : true})

const autoscroll=()=>{
    //New message Element
    const $newMessage = $messages.lastElementChild

    // Height of message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible Height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled
    const scrollOffset = $messages.scrollTop +visibleHeight

    if(containerHeight-newMessageHeight <=scrollOffset){
        $messages.scrollTop = $messages.scrollHeight

    }
}

socket.on('message',(message)=>{
    console.log(message)
    const html = Mustache.render($messageTemplate,{
        username:message.username,
        message: message.message,
        createdAt : moment(message.createdAt).format('h:mm a')
    })
    //const html = `<div> ${message.message}</div>`
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('locationMessage',(message)=>{
    //console.log(url)
    const html = Mustache.render($locationMessageTemplate,{
        username : message.username,
        url : message.url,
        createdAt : moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('roomData',({room,users})=>{
    const html =Mustache.render(sidebarTemplate,{
        room,users
    })
    $sidebar.innerHTML=html
})
$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault()
    $messageFormButton.setAttribute('disabled','disabled')
    const message = e.target.elements.message.value

    socket.emit('sendMessage',message,(error)=>{
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value =''
        $messageFormInput.focus()
        if(error){
            return console.log(error)
        }

        console.log('Message sent',message)
    })
})

$sendLocationButton.addEventListener('click',(e)=>{
    e.preventDefault()

    if(! navigator.geolocation){
        return alert('Location cannot be shared')
    }
    $sendLocationButton.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position)=>{
        const message = {
            latitude : position.coords.latitude,
            longitude : position.coords.longitude
        }
        socket.emit('sendLocation',message,()=>{
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared')
        })
    })
})

socket.emit('join',{username,room},(error)=>{
    if(error){
        alert(error)
        location.href ='/'
    }
})