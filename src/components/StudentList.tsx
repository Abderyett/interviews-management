import React, { useState, useMemo, useCallback } from 'react';
import { Users, Trash2, Plus } from 'lucide-react';
import { SearchInput } from './SearchInput';

interface Student {
	studentId: string;
	name: string;
}

interface QueueEntry extends Student {
	queueNumber: number;
	arrivalTime: Date;
	status: 'waiting' | 'in-progress' | 'completed';
	assignedRoom: string | null;
}

interface StudentListProps {
	students: Student[];
	waitingQueue: QueueEntry[];
	onAddToQueue: (student: Student) => void;
	onDeleteStudent: (student: Student) => void;
	isLoading?: boolean;
	readOnly?: boolean;
}

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
	<div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>{children}</div>
);

const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
	<div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
	<h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>{children}</h3>
);

const CardDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
	<p className={`text-sm text-muted-foreground ${className}`}>{children}</p>
);

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
	<div className={`p-6 pt-0 ${className}`}>{children}</div>
);

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
	variant?: 'default' | 'outline' | 'ghost' | 'destructive';
	size?: 'default' | 'sm';
	disabled?: boolean;
	className?: string;
}) => {
	const baseClasses =
		'inline-flex items-center justify-center rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

	const variants = {
		default: 'bg-primary text-primary-foreground hover:bg-primary/90',
		outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
		ghost: 'hover:bg-accent hover:text-accent-foreground',
		destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
	};

	const sizes = {
		default: 'h-10 px-4 py-2',
		sm: 'h-9 rounded-md px-3',
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

export const StudentList: React.FC<StudentListProps> = ({
	students,
	waitingQueue,
	onAddToQueue,
	onDeleteStudent,
	isLoading = false,
	readOnly = false
}) => {
	const [searchTerm, setSearchTerm] = useState('');

	const handleSearchChange = useCallback((value: string) => {
		setSearchTerm(value);
	}, []);

	const filteredStudents = useMemo(
		() =>
			students.filter(
				(student) =>
					student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
			),
		[students, searchTerm]
	);

	return (
		<Card>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<Users className='h-5 w-5' />
					Student Registry
				</CardTitle>
				<CardDescription>{filteredStudents.length} students registered</CardDescription>
			</CardHeader>
			<CardContent className='space-y-4'>
				<SearchInput
					value={searchTerm}
					onChange={handleSearchChange}
					placeholder='Search by name or student ID...'
					disabled={isLoading}
				/>

				<div className='max-h-80 overflow-y-auto space-y-2'>
					{filteredStudents.map((student) => {
						const isInQueue = waitingQueue.some((w) => w.studentId === student.studentId);

						return (
							<div
								key={student.studentId}
								className='flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200'>
								<div className='flex-1'>
									<div className='font-medium'>{student.name}</div>
									<div className='text-sm text-muted-foreground'>{student.studentId}</div>
								</div>
								<div className='flex items-center gap-2'>
									{!isInQueue && !readOnly && (
										<Button
											onClick={() => onAddToQueue(student)}
											size='sm'
											disabled={isLoading}
											className='bg-indigo-600 hover:bg-indigo-700 text-white transition-colors duration-200'>
											<Plus className='h-4 w-4 mr-1' />
											Add to Queue
										</Button>
									)}
									{!readOnly && (
										<Button
											onClick={() => onDeleteStudent(student)}
											size='sm'
											variant='outline'
											disabled={isLoading}
											className='border-red-300 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-200'>
											<Trash2 className='h-4 w-4' />
										</Button>
									)}
									{readOnly && (
										<div className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
											View Only
										</div>
									)}
								</div>
							</div>
						);
					})}
					{filteredStudents.length === 0 && (
						<div className='text-center py-8 text-muted-foreground'>
							{searchTerm ? 'No students found matching your search.' : 'No students registered yet.'}
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
};