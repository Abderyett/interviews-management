import React, { useState } from 'react';
import { GraduationCap, User, LogIn } from 'lucide-react';

interface LoginProps {
	onLogin: (
		role: 'receptionist' | 'professor' | 'superadmin' | 'sales',
		professorId?: number,
		salesId?: number
	) => void;
}

const Button = ({
	children,
	onClick,
	variant = 'default',
	disabled = false,
	className = '',
	type = 'button',
}: {
	children: React.ReactNode;
	onClick?: () => void;
	variant?: 'default' | 'outline';
	disabled?: boolean;
	className?: string;
	type?: 'button' | 'submit';
}) => {
	const baseClasses =
		'inline-flex items-center justify-center rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2';

	const variants = {
		default: 'bg-indigo-600 text-white hover:bg-indigo-700',
		outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
	};

	return (
		<button
			type={type}
			className={`${baseClasses} ${variants[variant]} ${className}`}
			onClick={onClick}
			disabled={disabled}>
			{children}
		</button>
	);
};

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
	<div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>{children}</div>
);

const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
	<div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
	<h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>{children}</h3>
);

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
	<div className={`p-6 pt-0 ${className}`}>{children}</div>
);

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
	const [selectedRole, setSelectedRole] = useState<
		'receptionist' | 'professor' | 'superadmin' | 'sales' | null
	>(null);
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	// Mock user credentials
	const users = {
		superadmin: {
			username: 'superadmin',
			password: 'super123',
		},
		receptionist: {
			username: 'asma',
			password: 'admin123',
		},
		professors: [
			{ id: 1, username: 'prof.mansouri', password: 'prof123', name: 'Prof. Mansouri', room: 'Room 7' },
			{ id: 2, username: 'prof.bedaida', password: 'prof123', name: 'Prof. Bedaida', room: 'Room 8' },
			{ id: 3, username: 'prof.touati', password: 'prof123', name: 'Prof. Touati', room: 'Room 9' },
		],
		sales: [
			{ id: 1, username: 'samir.hadjout', password: 'sales123', name: 'Samir Hadjout' },
			{ id: 2, username: 'samy.bouaddou', password: 'sales123', name: 'Samy Bouaddou' },
			{ id: 3, username: 'imen.mouzaoui', password: 'sales123', name: 'Imen Mouzaoui' },
			{ id: 4, username: 'wassim.benkhannouf', password: 'sales123', name: 'Wassim Benkhannouf' },
			{ id: 5, username: 'gassbi.wassil', password: 'sales123', name: 'Gassbi Wassil' },
			{ id: 6, username: 'adem.bentayeb', password: 'sales123', name: 'Adem Bentayeb' },
			{ id: 7, username: 'lyna.guita', password: 'sales123', name: 'Lyna Guita' },
		],
	};

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setIsLoading(true);

		// Simulate API delay
		await new Promise((resolve) => setTimeout(resolve, 1000));

		try {
			if (selectedRole === 'superadmin') {
				if (username === users.superadmin.username && password === users.superadmin.password) {
					onLogin('superadmin');
				} else {
					throw new Error('Invalid super admin credentials');
				}
			} else if (selectedRole === 'receptionist') {
				if (username === users.receptionist.username && password === users.receptionist.password) {
					onLogin('receptionist');
				} else {
					throw new Error('Invalid receptionist credentials');
				}
			} else if (selectedRole === 'professor') {
				const professor = users.professors.find((p) => p.username === username && p.password === password);
				if (professor) {
					onLogin('professor', professor.id);
				} else {
					throw new Error('Invalid professor credentials');
				}
			} else if (selectedRole === 'sales') {
				const salesperson = users.sales.find((s) => s.username === username && s.password === password);
				if (salesperson) {
					onLogin('sales', undefined, salesperson.id);
				} else {
					throw new Error('Invalid sales credentials');
				}
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Login failed');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className='min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4'>
			<div className='w-full max-w-md'>
				{/* Header */}
				<div className='text-center mb-8'>
					<div className='w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4'>
						<GraduationCap className='h-8 w-8 text-white' />
					</div>
					<h1 className='text-3xl font-bold text-gray-900'>Interview Hub</h1>
					<p className='text-gray-600 mt-2'>University Management System</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className='text-center'>Login</CardTitle>
					</CardHeader>
					<CardContent>
						{!selectedRole ? (
							<div className='space-y-4'>
								<p className='text-center text-gray-600 mb-6'>Select your role to continue</p>

								<Button
									onClick={() => setSelectedRole('superadmin')}
									variant='outline'
									className='w-full justify-start h-16 text-left'>
									<GraduationCap className='h-6 w-6 mr-4 text-purple-600' />
									<div>
										<div className='font-semibold text-purple-600'>Super Admin</div>
										<div className='text-sm text-gray-500'>Complete system administration</div>
									</div>
								</Button>

								<Button
									onClick={() => setSelectedRole('receptionist')}
									variant='outline'
									className='w-full justify-start h-16 text-left'>
									<User className='h-6 w-6 mr-4' />
									<div>
										<div className='font-semibold'>Receptionist</div>
										<div className='text-sm text-gray-500'>Manage students and interviews</div>
									</div>
								</Button>

								<Button
									onClick={() => setSelectedRole('professor')}
									variant='outline'
									className='w-full justify-start h-16 text-left'>
									<GraduationCap className='h-6 w-6 mr-4' />
									<div>
										<div className='font-semibold'>Professor</div>
										<div className='text-sm text-gray-500'>View dashboard and room status</div>
									</div>
								</Button>

								<Button
									onClick={() => setSelectedRole('sales')}
									variant='outline'
									className='w-full justify-start h-16 text-left'>
									<User className='h-6 w-6 mr-4 text-green-600' />
									<div>
										<div className='font-semibold text-green-600'>Sales</div>
										<div className='text-sm text-gray-500'>Manage student admissions</div>
									</div>
								</Button>
							</div>
						) : (
							<form onSubmit={handleLogin} className='space-y-4'>
								<div className='text-center mb-4'>
									<div className='inline-flex items-center gap-2 text-lg font-semibold'>
										{selectedRole === 'superadmin' ? (
											<>
												<GraduationCap className='h-5 w-5 text-purple-600' /> Super Admin Login
											</>
										) : selectedRole === 'receptionist' ? (
											<>
												<User className='h-5 w-5' /> Receptionist Login
											</>
										) : selectedRole === 'professor' ? (
											<>
												<GraduationCap className='h-5 w-5' /> Professor Login
											</>
										) : (
											<>
												<User className='h-5 w-5 text-green-600' /> Sales Login
											</>
										)}
									</div>
								</div>

								{error && (
									<div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg'>
										{error}
									</div>
								)}

								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>Username</label>
									<input
										type='text'
										value={username}
										onChange={(e) => setUsername(e.target.value)}
										className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
										placeholder={
											selectedRole === 'receptionist'
												? 'receptionist'
												: selectedRole === 'sales'
												? 'firstname.lastname'
												: 'prof.username'
										}
										required
									/>
								</div>

								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>Password</label>
									<input
										type='password'
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
										placeholder='Enter your password'
										required
									/>
								</div>

								<div className='flex gap-3'>
									<Button
										type='button'
										variant='outline'
										onClick={() => {
											setSelectedRole(null);
											setUsername('');
											setPassword('');
											setError('');
										}}
										className='flex-1'>
										Back
									</Button>
									<Button type='submit' disabled={isLoading} className='flex-1'>
										{isLoading ? (
											<>
												<div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2'></div>
												Signing in...
											</>
										) : (
											<>
												<LogIn className='h-4 w-4 mr-2' />
												Sign In
											</>
										)}
									</Button>
								</div>
							</form>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
};
