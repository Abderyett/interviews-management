import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MessageCircle, Send, X, Users, Minimize2, Maximize2, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Message {
	id: string;
	sender: string;
	senderRole: 'superadmin' | 'receptionist' | 'professor' | 'sales';
	senderName: string;
	content: string;
	timestamp: Date;
	type: 'broadcast' | 'direct';
	recipient?: string;
}


interface ChatSystemProps {
	currentUser: {
		id: string;
		name: string;
		role: 'superadmin' | 'receptionist' | 'professor' | 'sales';
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

export const SimpleChatSystem: React.FC<ChatSystemProps> = ({ currentUser }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isMinimized, setIsMinimized] = useState(false);
	const [messages, setMessages] = useState<Message[]>([]);
	const [newMessage, setNewMessage] = useState('');
	const [selectedChat, setSelectedChat] = useState<'all' | string>('all');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string>('');
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Manual refresh function
	const refreshMessages = useCallback(async () => {
		try {
			console.log('🔄 Refreshing messages...');
			const { data, error } = await supabase
				.from('chat_messages')
				.select('*')
				.order('created_at', { ascending: true })
				.limit(50);

			if (error) {
				console.error('❌ Error loading messages:', error);
				setError(`Failed to load messages: ${error.message}`);
				return;
			}

			const loadedMessages: Message[] = data.map(msg => ({
				id: msg.id,
				sender: msg.sender_id,
				senderRole: msg.sender_role as 'superadmin' | 'receptionist' | 'professor' | 'sales',
				senderName: msg.sender_name,
				content: msg.content,
				timestamp: new Date(msg.created_at),
				type: msg.message_type as 'broadcast' | 'direct',
				recipient: msg.recipient_id || undefined
			}));

			setMessages(loadedMessages);
			console.log('✅ Messages loaded:', loadedMessages.length);
		} catch (err) {
			console.error('❌ Error in refreshMessages:', err);
			setError('Failed to refresh messages');
		}
	}, []);

	// Load messages on component mount and when opened
	useEffect(() => {
		if (isOpen) {
			refreshMessages();
		}
	}, [isOpen, refreshMessages]);

	// Auto-refresh every 5 seconds when chat is open
	useEffect(() => {
		if (!isOpen) return;

		const interval = setInterval(refreshMessages, 5000);
		return () => clearInterval(interval);
	}, [isOpen, refreshMessages]);

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
		setError('');

		try {
			// Try direct insert without any RLS checks
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
				setError(`Failed to send: ${error.message}`);
				
				// Show user-friendly error
				if (error.message.includes('row-level security')) {
					setError('Database permissions issue. Please run the ultimate_rls_fix.sql script.');
				}
				return;
			}

			console.log('✅ Message sent successfully:', data);
			setNewMessage('');
			
			// Refresh messages immediately to show the new message
			setTimeout(refreshMessages, 500);
			
		} catch (error) {
			console.error('❌ Error in sendMessage:', error);
			setError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
		} finally {
			setLoading(false);
		}
	}, [newMessage, currentUser, selectedChat, loading, refreshMessages]);

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
			case 'sales': return 'text-orange-600';
			default: return 'text-gray-600';
		}
	};

	const getRoleBadge = (role: string) => {
		switch (role) {
			case 'superadmin': return 'bg-purple-100 text-purple-800';
			case 'receptionist': return 'bg-blue-100 text-blue-800';
			case 'professor': return 'bg-green-100 text-green-800';
			case 'sales': return 'bg-orange-100 text-orange-800';
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
						Simple Chat (Manual Refresh)
					</span>
				</div>
				<div className="flex items-center gap-1">
					<Button
						onClick={refreshMessages}
						variant="ghost"
						size="sm">
						<RefreshCw className="h-4 w-4" />
					</Button>
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
					{/* Error Display */}
					{error && (
						<div className="p-2 bg-red-50 border-b">
							<div className="text-xs text-red-600">{error}</div>
						</div>
					)}

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
								All ({messages.filter(m => m.type === 'broadcast').length})
							</button>
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
								placeholder="Message everyone..."
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