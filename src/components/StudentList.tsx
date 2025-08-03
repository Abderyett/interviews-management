import React, { useState, useMemo, useCallback } from 'react';
import { Users, Trash2, Plus, Edit2, Check, X, ChevronDown } from 'lucide-react';
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

interface CompletedInterview {
	studentId: string;
	name: string;
	completedTime: Date;
	interviewDuration: number;
	professorName: string;
	room: string;
}

interface Professor {
	id: number;
	name: string;
	room: string;
	floor: string;
	status: 'available' | 'busy' | 'unavailable' | 'offline';
	currentStudent: Student | null;
	interviewStartTime: Date | null;
}

interface StudentListProps {
	students: Student[];
	waitingQueue: QueueEntry[];
	completedInterviews: CompletedInterview[];
	professors: Professor[];
	onAddToQueue: (student: Student) => void;
	onDeleteStudent: (student: Student) => void;
	onEditStudent?: (oldStudent: Student, newStudent: Student) => void;
	isLoading?: boolean;
	readOnly?: boolean;
	userRole?: string;
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

const STUDENT_PROGRAMS = [
	{ value: 'LAC', label: 'LAC' },
	{ value: 'LINFO', label: 'LINFO' },
	{ value: 'LFC', label: 'LFC' },
	{ value: 'MASTER MM', label: 'MASTER MM' },
	{ value: 'MASTER TD', label: 'MASTER TD' },
	{ value: 'No Program', label: 'No Program' }
];

export const StudentList: React.FC<StudentListProps> = ({
	students,
	waitingQueue,
	completedInterviews,
	professors,
	onAddToQueue,
	onDeleteStudent,
	onEditStudent,
	isLoading = false,
	readOnly = false,
	userRole = ''
}) => {
	const [searchTerm, setSearchTerm] = useState('');
	const [editingStudent, setEditingStudent] = useState<string | null>(null);
	const [editName, setEditName] = useState('');
	const [editProgram, setEditProgram] = useState('');
	const [showProgramDropdown, setShowProgramDropdown] = useState(false);

	// Only superadmin can delete students from registry
	const canDeleteStudents = userRole === 'superadmin';

	const handleSearchChange = useCallback((value: string) => {
		setSearchTerm(value);
	}, []);

	const startEdit = useCallback((student: Student) => {
		setEditingStudent(student.studentId);
		setEditName(student.name);
		setEditProgram(student.studentId);
		setShowProgramDropdown(false);
	}, []);

	const cancelEdit = useCallback(() => {
		setEditingStudent(null);
		setEditName('');
		setEditProgram('');
		setShowProgramDropdown(false);
	}, []);

	const saveEdit = useCallback((originalStudent: Student) => {
		if (!editName.trim() || !onEditStudent) return;
		
		const updatedStudent: Student = {
			name: editName.trim(),
			studentId: editProgram.trim() || 'No Program'
		};

		onEditStudent(originalStudent, updatedStudent);
		setEditingStudent(null);
		setEditName('');
		setEditProgram('');
		setShowProgramDropdown(false);
	}, [editName, editProgram, onEditStudent]);

	const filteredStudents = useMemo(
		() => {
			const filtered = students.filter(
				(student) =>
					student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
			);
			
			// Sort: non-queued students first, then queued students
			return filtered.sort((a, b) => {
				const aInQueue = waitingQueue.some((w) => w.studentId === a.studentId);
				const bInQueue = waitingQueue.some((w) => w.studentId === b.studentId);
				
				if (aInQueue === bInQueue) return 0; // Keep original order if both have same status
				return aInQueue ? 1 : -1; // Non-queued first (return -1), queued second (return 1)
			});
		},
		[students, searchTerm, waitingQueue]
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
						const isCompleted = completedInterviews.some((c) => c.studentId === student.studentId);
						const isInInterview = professors.some((prof) => 
							prof.status === 'busy' && 
							prof.currentStudent?.studentId === student.studentId
						);
						const isEditing = editingStudent === student.studentId;

						return (
							<div
								key={student.studentId}
								className='flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200'>
								<div className='flex-1'>
									{isEditing ? (
										<div className='space-y-2'>
											{/* Edit Name Input */}
											<input
												type='text'
												value={editName}
												onChange={(e) => setEditName(e.target.value)}
												className='w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
												placeholder='Student Name'
												disabled={isLoading}
											/>
											
											{/* Edit Program Dropdown */}
											<div className="relative">
												<button
													type="button"
													onClick={() => setShowProgramDropdown(!showProgramDropdown)}
													disabled={isLoading}
													className="flex w-full items-center justify-between px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
												>
													<span className={editProgram ? 'text-foreground' : 'text-muted-foreground'}>
														{editProgram || 'Select Program...'}
													</span>
													<ChevronDown className="h-3 w-3 opacity-50" />
												</button>
												
												{showProgramDropdown && !isLoading && (
													<div className="absolute z-50 top-full mt-1 w-full min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
														{STUDENT_PROGRAMS.map((program) => (
															<button
																key={program.value}
																type="button"
																onClick={() => {
																	setEditProgram(program.value);
																	setShowProgramDropdown(false);
																}}
																className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
															>
																{program.label}
															</button>
														))}
													</div>
												)}
											</div>
										</div>
									) : (
										<div>
											<div className='font-medium'>{student.name}</div>
											<div className='text-sm text-muted-foreground'>{student.studentId}</div>
										</div>
									)}
								</div>
								
								<div className='flex items-center gap-2'>
									{isEditing ? (
										<>
											<Button
												onClick={() => saveEdit(student)}
												size='sm'
												disabled={!editName.trim() || isLoading}
												className='bg-green-600 hover:bg-green-700 text-white'>
												<Check className='h-4 w-4' />
											</Button>
											<Button
												onClick={cancelEdit}
												size='sm'
												variant='outline'
												disabled={isLoading}
												className='border-gray-300 text-gray-600 hover:bg-gray-600 hover:text-white'>
												<X className='h-4 w-4' />
											</Button>
										</>
									) : (
										<>
											{isCompleted && (
												<div className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
													Completed
												</div>
											)}
											{isInInterview && !isCompleted && (
												<div className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
													In Interview
												</div>
											)}
											{!isInQueue && !isCompleted && !readOnly && (
												<Button
													onClick={() => onAddToQueue(student)}
													size='sm'
													disabled={isLoading}
													className='bg-indigo-600 hover:bg-indigo-700 text-white transition-colors duration-200'>
													<Plus className='h-4 w-4 mr-1' />
													Add to Queue
												</Button>
											)}
											{!isCompleted && !isInInterview && !readOnly && onEditStudent && (
												<Button
													onClick={() => startEdit(student)}
													size='sm'
													variant='outline'
													disabled={isLoading}
													className='border-blue-300 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-200'>
													<Edit2 className='h-4 w-4' />
												</Button>
											)}
											{!isCompleted && !isInInterview && !readOnly && canDeleteStudents && (
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
										</>
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