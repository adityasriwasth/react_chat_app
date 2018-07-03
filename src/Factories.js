//These act like JSON objects to help with sending and recieving messages between users
const uuidv4 = require('uuid/v4')

//When a new user joins in
const createUser = ({name = "", socketId = null } = {})=>(
	{
		id:uuidv4(),
		name,
		socketId
		
	}
)

//When a user writes and sends the message
const createMessage = ({message = "", sender = ""} = { })=>(
		{
			id:uuidv4(),
			time:getTime(new Date(Date.now())),
			message,
			sender	
		}

	)

const createChat = ({messages = [], name = "Community", users = [], isCommunity = false} = {})=>(
	{
		id:uuidv4(),
		name: isCommunity ? name : createChatNameFromUsers(users),
		messages,
		users,
		typingUsers:[],
		isCommunity
	}
)

//To create a name for each chat
const createChatNameFromUsers = (users, excludedUser = "") => {
	return users.filter(u => u !== excludedUser).join(' & ') || "Empty Chat"
}


const getTime = (date)=>{
	return `${date.getHours()}:${("0"+date.getMinutes()).slice(-2)}`
}

module.exports = {
	createMessage,
	createChat,
	createUser,
	createChatNameFromUsers
}
