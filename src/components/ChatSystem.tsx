import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MessageCircle, Send, X, Users, Minimize2, Maximize2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Message {
	id: string;
	sender: string;
	senderRole: 'superadmin' | 'receptionist' | 'professor';
	senderName: string;
	content: string;
	timestamp: Date;
	type: 'broadcast' | 'direct';
	recipient?: string;
}

interface ChatUser {
	id: string;
	name: string;
	role: 'superadmin' | 'receptionist' | 'professor';
	online: boolean;
}

interface ChatSystemProps {
	currentUser: {
		id: string;
		name: string;
		role: 'superadmin' | 'receptionist' | 'professor';
	};
}

const Button = ({
	children,
	onClick,
	variant = 'default',
	size = 'default',
	disabled = false,
	className = '',
}: {
	children: React.ReactNode;
	onClick?: () => void;
	variant?: 'default' | 'outline' | 'ghost';
	size?: 'default' | 'sm';
	disabled?: boolean;
	className?: string;
}) => {
	const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50';
	
	const variants = {
		default: 'bg-indigo-600 text-white hover:bg-indigo-700',
		outline: 'border border-input bg-background hover:bg-accent',
		ghost: 'hover:bg-accent hover:text-accent-foreground',
	};
	
	const sizes = {
		default: 'h-9 px-4 py-2',
		sm: 'h-8 px-3 text-sm',
	};
	
	return (
		<button
			className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
			onClick={onClick}
			disabled={disabled}>
			{children}
		</button>
	);
};

export const ChatSystem: React.FC<ChatSystemProps> = ({ currentUser }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isMinimized, setIsMinimized] = useState(false);
	const [messages, setMessages] = useState<Message[]>([]);
	const [newMessage, setNewMessage] = useState('');
	const [selectedChat, setSelectedChat] = useState<'all' | string>('all');
	const [onlineUsers, setOnlineUsers] = useState<ChatUser[]>([]);
	const [loading, setLoading] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Initialize user in database and set online status
	useEffect(() => {
		const initializeUser = async () => {
			console.log('🔄 Initializing user:', currentUser);
			try {
				// Test if chat_users table exists
				const { data: testData, error: testError } = await supabase
					.from('chat_users')
					.select('count', { count: 'exact', head: true });

				if (testError) {
					console.error('❌ chat_users table test failed:', testError);
					alert(`Chat tables not set up properly. Please run the SQL script first.\nError: ${testError.message}`);
					return;
				}

				console.log('✅ chat_users table exists');

				// Upsert current user
				const { data, error } = await supabase
					.from('chat_users')
					.upsert({
						user_id: currentUser.id,
						name: currentUser.name,
						role: currentUser.role,
						online: true,
						last_seen: new Date().toISOString()
					}, {
						onConflict: 'user_id'
					})
					.select();

				if (error) {
					console.error('❌ Error initializing user:', error);
					alert(`Failed to initialize user: ${error.message}`);
				} else {
					console.log('✅ User initialized successfully:', data);
				}
			} catch (error) {
				console.error('❌ Error in initializeUser:', error);
				alert(`Unexpected error initializing user: ${error instanceof Error ? error.message : 'Unknown error'}`);
			}
		};

		initializeUser();

		// Set user offline on component unmount
		return () => {
			supabase
				.from('chat_users')
				.update({ 
					online: false, 
					last_seen: new Date().toISOString() 
				})
				.eq('user_id', currentUser.id)
				.then(({ error }) => {
					if (error) console.error('Error setting user offline:', error);
				});
		};
	}, [currentUser]);

	// Load online users
	useEffect(() => {
		const loadOnlineUsers = async () => {
			try {
				const { data, error } = await supabase
					.from('chat_users')
					.select('*')
					.neq('user_id', currentUser.id)
					.order('name');

				if (error) {
					console.error('Error loading users:', error);
					return;
				}

				const users: ChatUser[] = data.map(user => ({
					id: user.user_id,
					name: user.name,
					role: user.role as 'superadmin' | 'receptionist' | 'professor',
					online: user.online
				}));

				setOnlineUsers(users);
			} catch (error) {
				console.error('Error in loadOnlineUsers:', error);
			}
		};

		loadOnlineUsers();

		// Subscribe to user changes
		const userSubscription = supabase
			.channel('chat_users_changes')
			.on('postgres_changes', 
				{ 
					event: '*', 
					schema: 'public', 
					table: 'chat_users',
					filter: `user_id.neq.${currentUser.id}`
				}, 
				() => {
					loadOnlineUsers();
				}
			)
			.subscribe();

		return () => {
			userSubscription.unsubscribe();
		};
	}, [currentUser]);

	// Load messages
	useEffect(() => {
		const loadMessages = async () => {
			try {
				const { data, error } = await supabase
					.from('chat_messages')
					.select('*')
					.order('created_at', { ascending: true })
					.limit(100);

				if (error) {
					console.error('Error loading messages:', error);
					return;
				}

				const loadedMessages: Message[] = data.map(msg => ({
					id: msg.id,
					sender: msg.sender_id,
					senderRole: msg.sender_role as 'superadmin' | 'receptionist' | 'professor',
					senderName: msg.sender_name,
					content: msg.content,
					timestamp: new Date(msg.created_at),
					type: msg.message_type as 'broadcast' | 'direct',
					recipient: msg.recipient_id || undefined
				}));

				setMessages(loadedMessages);
			} catch (error) {
				console.error('Error in loadMessages:', error);
			}
		};

		loadMessages();

		// Subscribe to new messages
		const messageSubscription = supabase
			.channel('chat_messages_changes')
			.on('postgres_changes', 
				{ 
					event: 'INSERT', 
					schema: 'public', 
					table: 'chat_messages' 
				}, 
				(payload) => {
					const newMsg = payload.new;
					const message: Message = {
						id: newMsg.id,
						sender: newMsg.sender_id,
						senderRole: newMsg.sender_role,
						senderName: newMsg.sender_name,
						content: newMsg.content,
						timestamp: new Date(newMsg.created_at),
						type: newMsg.message_type,
						recipient: newMsg.recipient_id || undefined
					};
					setMessages(prev => [...prev, message]);
				}
			)
			.subscribe();

		return () => {
			messageSubscription.unsubscribe();
		};
	}, []);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	const sendMessage = useCallback(async () => {
		if (!newMessage.trim() || loading) return;

		console.log('🚀 Attempting to send message:', {
			sender_id: currentUser.id,
			sender_name: currentUser.name,
			sender_role: currentUser.role,
			content: newMessage.trim(),
			message_type: selectedChat === 'all' ? 'broadcast' : 'direct',
			recipient_id: selectedChat === 'all' ? null : selectedChat
		});

		setLoading(true);
		try {
			// Test Supabase connection first
			const { data: testData, error: testError } = await supabase
				.from('chat_messages')
				.select('count', { count: 'exact', head: true });

			if (testError) {
				console.error('❌ Supabase connection test failed:', testError);
				alert(`Database connection error: ${testError.message}`);
				return;
			}

			console.log('✅ Supabase connection OK, message count:', testData);

			// Insert the message
			const { data, error } = await supabase
				.from('chat_messages')
				.insert({
					sender_id: currentUser.id,
					sender_name: currentUser.name,
					sender_role: currentUser.role,
					content: newMessage.trim(),
					message_type: selectedChat === 'all' ? 'broadcast' : 'direct',
					recipient_id: selectedChat === 'all' ? null : selectedChat
				})
				.select();

			if (error) {
				console.error('❌ Error sending message:', error);
				alert(`Failed to send message: ${error.message}`);
				return;
			}

			console.log('✅ Message sent successfully:', data);
			setNewMessage('');
		} catch (error) {
			console.error('❌ Error in sendMessage:', error);
			alert(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
		} finally {
			setLoading(false);
		}
	}, [newMessage, currentUser, selectedChat, loading]);

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	};

	const getRoleColor = (role: string) => {
		switch (role) {
			case 'superadmin': return 'text-purple-600';
			case 'receptionist': return 'text-blue-600';
			case 'professor': return 'text-green-600';
			default: return 'text-gray-600';
		}
	};

	const getRoleBadge = (role: string) => {
		switch (role) {
			case 'superadmin': return 'bg-purple-100 text-purple-800';
			case 'receptionist': return 'bg-blue-100 text-blue-800';
			case 'professor': return 'bg-green-100 text-green-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	};

	const filteredMessages = selectedChat === 'all' 
		? messages.filter(m => m.type === 'broadcast')
		: messages.filter(m => 
			(m.type === 'direct' && (m.sender === selectedChat || m.recipient === selectedChat)) ||
			(m.sender === currentUser.id && m.recipient === selectedChat) ||
			(m.sender === selectedChat && m.recipient === currentUser.id)
		);

	if (!isOpen) {
		return (
			<button
				onClick={() => setIsOpen(true)}
				className="fixed bottom-4 left-4 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-colors z-50">
				<MessageCircle className="h-6 w-6" />
				{messages.length > 0 && (
					<div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
						{messages.length > 9 ? '9+' : messages.length}
					</div>
				)}
			</button>
		);
	}

	return (
		<div className={`fixed bottom-4 left-4 bg-white border rounded-lg shadow-xl z-50 transition-all duration-200 ${
			isMinimized ? 'w-80 h-12' : 'w-96 h-96'
		}`}>
			{/* Header */}
			<div className="flex items-center justify-between p-3 border-b bg-indigo-50">
				<div className="flex items-center gap-2">
					<MessageCircle className="h-5 w-5 text-indigo-600" />
					<span className="font-semibold text-indigo-900">
						{selectedChat === 'all' ? 'General Chat' : onlineUsers.find(u => u.id === selectedChat)?.name}
					</span>
				</div>
				<div className="flex items-center gap-1">
					<Button
						onClick={() => setIsMinimized(!isMinimized)}
						variant="ghost"
						size="sm">
						{isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
					</Button>
					<Button
						onClick={() => setIsOpen(false)}
						variant="ghost"
						size="sm">
						<X className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{!isMinimized && (
				<>
					{/* Chat Selection */}
					<div className="p-2 border-b bg-gray-50">
						<div className="flex gap-1 flex-wrap">
							<button
								onClick={() => setSelectedChat('all')}
								className={`px-2 py-1 text-xs rounded ${
									selectedChat === 'all' 
										? 'bg-indigo-600 text-white' 
										: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
								}`}>
								<Users className="h-3 w-3 inline mr-1" />
								All
							</button>
							{onlineUsers.map(user => (
								<button
									key={user.id}
									onClick={() => setSelectedChat(user.id)}
									className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${
										selectedChat === user.id 
											? 'bg-indigo-600 text-white' 
											: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
									}`}>
									<div className={`w-2 h-2 rounded-full ${user.online ? 'bg-green-400' : 'bg-gray-400'}`} />
									{user.name}
								</button>
							))}
						</div>
					</div>

					{/* Messages */}
					<div className="flex-1 overflow-y-auto p-3 h-60">
						<div className="space-y-3">
							{filteredMessages.map(message => (
								<div key={message.id} className={`flex ${message.sender === currentUser.id ? 'justify-end' : 'justify-start'}`}>
									<div className={`max-w-xs ${
										message.sender === currentUser.id 
											? 'bg-indigo-600 text-white' 
											: 'bg-gray-100 text-gray-900'
									} rounded-lg px-3 py-2`}>
										{message.sender !== currentUser.id && (
											<div className="flex items-center gap-1 mb-1">
												<span className={`text-xs font-semibold ${getRoleColor(message.senderRole)}`}>
													{message.senderName}
												</span>
												<span className={`text-xs px-1 rounded ${getRoleBadge(message.senderRole)}`}>
													{message.senderRole}
												</span>
											</div>
										)}
										<p className="text-sm">{message.content}</p>
										<p className={`text-xs mt-1 ${
											message.sender === currentUser.id ? 'text-indigo-200' : 'text-gray-500'
										}`}>
											{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
										</p>
									</div>
								</div>
							))}
							<div ref={messagesEndRef} />
						</div>
					</div>

					{/* Input */}
					<div className="p-3 border-t bg-white">
						<div className="flex items-center gap-2">
							<input
								type="text"
								value={newMessage}
								onChange={(e) => setNewMessage(e.target.value)}
								onKeyPress={handleKeyPress}
								placeholder={`Message ${selectedChat === 'all' ? 'everyone' : onlineUsers.find(u => u.id === selectedChat)?.name}...`}
								className="flex-1 h-9 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm outline-none"
								disabled={loading}
							/>
							<Button 
								onClick={sendMessage} 
								disabled={!newMessage.trim() || loading}
								size="sm"
								className="h-9 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md flex-shrink-0"
							>
								{loading ? (
									<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
								) : (
									<Send className="h-4 w-4" />
								)}
							</Button>
						</div>
					</div>
				</>
			)}
		</div>
	);
};