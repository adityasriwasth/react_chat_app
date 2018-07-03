import React, { Component } from 'react';
import SideBar from '../sidebar/SideBar'
import {COMMUNITY_CHAT, MESSAGE_SENT, MESSAGE_RECIEVED, TYPING, PRIVATE_MESSAGE, USER_CONNECTED, USER_DISCONNECTED} from '../../Events'
import ChatHeading from './ChatHeading'
import Messages from '../messages/Messages'
import MessageInput from '../messages/MessageInput'
import { values } from 'lodash'

export default class ChatContainer extends Component {
	constructor(props) {
	  super(props);	
	
	  this.state = {
		  chats:[],
		  users:[],
	  	activeChat:null
	  }
	}

	componentDidMount() {
		const { socket } = this.props
		this.initSocket(socket)
	}
	
	componentWillUnmount() {
		const { socket } = this.props
		socket.off(PRIVATE_MESSAGE)
		socket.off(USER_CONNECTED)
		socket.off(USER_DISCONNECTED)
	}
	
	initSocket(socket){
		socket.emit(COMMUNITY_CHAT, this.resetChat)
		socket.on(PRIVATE_MESSAGE, this.addChat)
		socket.on('connect', ()=>{
			socket.emit(COMMUNITY_CHAT, this.resetChat)
		})
		socket.on(USER_CONNECTED, (users)=>{
			this.setState({ users: values(users) })
		})
		socket.on(USER_DISCONNECTED, (users)=>{
			this.setState({ users: values(users) })			
		})
	}

	sendOpenPrivateMessage = (reciever) => {
		const { socket, user } = this.props
		const { activeChat } = this.state
		socket.emit(PRIVATE_MESSAGE, {reciever, sender:user.name, activeChat})

	}

	//To reset the chat
	resetChat = (chat)=>{
		return this.addChat(chat, true)
	}

	//This adds the chat to the chat container
	addChat = (chat, reset = false)=>{
		const { socket } = this.props
		const { chats } = this.state

		const newChats = reset ? [chat] : [...chats, chat]
		this.setState({chats:newChats, activeChat:reset ? chat : this.state.activeChat})

		const messageEvent = `${MESSAGE_RECIEVED}-${chat.id}`
		const typingEvent = `${TYPING}-${chat.id}`

		socket.on(typingEvent, this.updateTypingInChat(chat.id))
		socket.on(messageEvent, this.addMessageToChat(chat.id))
	}

	addMessageToChat = (chatId)=>{
		return message => {
			const { chats } = this.state
			let newChats = chats.map((chat)=>{
				if(chat.id === chatId)
					chat.messages.push(message)
				return chat
			})

			this.setState({chats:newChats})
		}
	}

	//Updates the chat history
	updateTypingInChat = (chatId) =>{
		return ({isTyping, user})=>{
			if(user !== this.props.user.name){

				const { chats } = this.state

				let newChats = chats.map((chat)=>{
					if(chat.id === chatId){
						if(isTyping && !chat.typingUsers.includes(user)){
							chat.typingUsers.push(user)
						}else if(!isTyping && chat.typingUsers.includes(user)){
							chat.typingUsers = chat.typingUsers.filter(u => u !== user)
						}
					}
					return chat
				})
				this.setState({chats:newChats})
			}
		}
	}

	//Adds a message to the list of messages in one chat
	sendMessage = (chatId, message)=>{
		const { socket } = this.props
		socket.emit(MESSAGE_SENT, {chatId, message} )
	}

	//Sends the status of the type chat to server
	sendTyping = (chatId, isTyping)=>{
		const { socket } = this.props
		socket.emit(TYPING, {chatId, isTyping})
	}

	setActiveChat = (activeChat)=>{
		this.setState({activeChat})
	}
	render() {
		const { user, logout } = this.props
		const { chats, activeChat, users } = this.state
		return (
			<div className="container">
				<SideBar
					logout={logout}
					chats={chats}
					user={user}
					users={users}
					activeChat={activeChat}
					setActiveChat={this.setActiveChat}
					onSendPrivateMessage={this.sendOpenPrivateMessage}
					/>
				<div className="chat-room-container">
					{
						activeChat !== null ? (

							<div className="chat-room">
								<ChatHeading name={activeChat.name} />
								<Messages 
									messages={activeChat.messages}
									user={user}
									typingUsers={activeChat.typingUsers}
									/>
								<MessageInput 
									sendMessage={
										(message)=>{
											this.sendMessage(activeChat.id, message)
										}
									}
									sendTyping={
										(isTyping)=>{
											this.sendTyping(activeChat.id, isTyping)
										}
									}
									/>

							</div>
						):
						<div className="chat-room choose">
							<h3>Choose a chat!</h3>
						</div>
					}
				</div>

			</div>
		);
	}
}