import { useState, useEffect, useCallback, useMemo } from 'react';
import {
	Users,
	Clock,
	CheckCircle,
	AlertCircle,
	Building,
	Eye,
	Calendar,
	Trash2,
	X,
	GraduationCap,
	Activity,
	ChevronRight,
	RefreshCw,
} from 'lucide-react';

import { supabase } from './lib/supabase';
import { StudentForm } from './components/StudentForm';
import { StudentList } from './components/StudentList';
import { Login } from './components/Login';
import { SimpleChatSystem } from './components/SimpleChatSystem';
import { Calendar as CalendarComponent } from './components/Calendar';

// Types
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

interface CompletedInterview extends QueueEntry {
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
	status: 'available' | 'busy' | 'unavailable';
	currentStudent: QueueEntry | null;
	interviewStartTime: Date | null;
}

interface DateData {
	registeredStudents: Student[];
	waitingQueue: QueueEntry[];
	completedInterviews: CompletedInterview[];
	currentNumber: number;
	professors: Professor[];
}

interface DateDataState {
	[key: string]: DateData;
}

interface DeleteModalState {
	show: boolean;
	student: Student | null;
}

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';

// Enhanced Button component with proper hover states
const Button = ({
	children,
	onClick,
	variant = 'default',
	size = 'default',
	disabled = false,
	className = '',
	...props
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
			disabled={disabled}
			{...props}>
			{children}
		</button>
	);
};

const Input = ({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) => {
	return (
		<input
			className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
			{...props}
		/>
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

const CardDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
	<p className={`text-sm text-muted-foreground ${className}`}>{children}</p>
);

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
	<div className={`p-6 pt-0 ${className}`}>{children}</div>
);

const Badge = ({
	children,
	variant = 'default',
	className = '',
}: {
	children: React.ReactNode;
	variant?: BadgeVariant;
	className?: string;
}) => {
	const variants = {
		default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
		secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
		destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
		outline: 'text-foreground',
	};

	return (
		<div
			className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variants[variant]} ${className}`}>
			{children}
		</div>
	);
};

const InterviewQueueSystem = () => {
	// Authentication state with localStorage persistence
	const [isLoggedIn, setIsLoggedIn] = useState(() => {
		return localStorage.getItem('isLoggedIn') === 'true';
	});
	const [userRole, setUserRole] = useState<'receptionist' | 'professor' | 'superadmin' | null>(() => {
		return localStorage.getItem('userRole') as 'receptionist' | 'professor' | 'superadmin' | null;
	});
	const [professorId, setProfessorId] = useState<number | null>(() => {
		const stored = localStorage.getItem('professorId');
		return stored ? parseInt(stored) : null;
	});
	
	// App state
	const [currentView, setCurrentView] = useState('students');
	const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

	// Date-based state management
	const [dateData, setDateData] = useState<DateDataState>({});
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>(
		'checking'
	);

	// Get current date data or initialize empty - memoized for performance
	const getCurrentDateData = useCallback((): DateData => {
		return (
			dateData[selectedDate] || {
				registeredStudents: [],
				waitingQueue: [],
				completedInterviews: [],
				currentNumber: 1,
				professors: [
					{
						id: 1,
						name: 'Prof. Mansouri',
						room: 'Room 7',
						floor: 'First Floor',
						status: 'available',
						currentStudent: null,
						interviewStartTime: null,
					},
					{
						id: 2,
						name: 'Prof. Bedaida',
						room: 'Room 8',
						floor: 'First Floor',
						status: 'available',
						currentStudent: null,
						interviewStartTime: null,
					},
					{
						id: 3,
						name: 'Prof. Touati',
						room: 'Room 9',
						floor: 'First Floor',
						status: 'available',
						currentStudent: null,
						interviewStartTime: null,
					},
				],
			}
		);
	}, [dateData, selectedDate]);

	const currentData = useMemo(() => getCurrentDateData(), [getCurrentDateData]);

	// State for modals and undo
	const [showCompletedInterviews, setShowCompletedInterviews] = useState(false);
	const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
		show: false,
		student: null,
	});
	const [lastAddedStudent, setLastAddedStudent] = useState<Student | null>(null);
	const [showUndoToast, setShowUndoToast] = useState(false);
	const [lastQueueEntry, setLastQueueEntry] = useState<QueueEntry | null>(null);
	const [showQueueUndoToast, setShowQueueUndoToast] = useState(false);

	// Memoized available professors
	const availableProfessors = useMemo(
		() => currentData.professors.filter((p: Professor) => p.status === 'available'),
		[currentData.professors]
	);

	// Load data from Supabase - fixed with proper error handling
	const loadDateData = useCallback(async () => {
		if (isLoading) return;

		setIsLoading(true);
		setError(null);

		try {
			console.log('Loading data for date:', selectedDate);

			// Load all data in parallel
			const [studentsResult, queueResult, completedResult, professorResult] = await Promise.all([
				supabase.from('students').select('*').eq('interview_date', selectedDate),
				supabase.from('interview_queue').select('*').eq('interview_date', selectedDate).order('queue_number'),
				supabase
					.from('completed_interviews')
					.select('*')
					.eq('interview_date', selectedDate)
					.order('completed_time', { ascending: false }),
				supabase.from('professor_status').select('*').eq('date', selectedDate),
			]);

			// Check for errors
			if (studentsResult.error) throw studentsResult.error;
			if (queueResult.error) throw queueResult.error;
			if (completedResult.error) throw completedResult.error;
			if (professorResult.error) throw professorResult.error;

			console.log('Loaded data:', {
				students: studentsResult.data,
				queue: queueResult.data,
				completed: completedResult.data,
				professors: professorResult.data,
			});

			// Transform and update data
			const newDateData: DateData = {
				registeredStudents:
					studentsResult.data?.map((s: any) => ({
						studentId: s.student_id,
						name: s.name,
					})) || [],
				waitingQueue:
					queueResult.data?.map((q: any) => ({
						studentId: q.student_id,
						name: q.name,
						queueNumber: q.queue_number,
						arrivalTime: new Date(q.arrival_time),
						status: q.status as 'waiting' | 'in-progress' | 'completed',
						assignedRoom: q.assigned_room,
					})) || [],
				completedInterviews:
					completedResult.data?.map((c: any) => ({
						studentId: c.student_id,
						name: c.name,
						queueNumber: c.queue_number,
						arrivalTime: new Date(),
						status: 'completed' as const,
						assignedRoom: c.room,
						completedTime: new Date(c.completed_time),
						interviewDuration: c.interview_duration,
						professorName: c.professor_name,
						room: c.room,
					})) || [],
				currentNumber: queueResult.data?.length
					? Math.max(...queueResult.data.map((q: any) => q.queue_number)) + 1
					: 1,
				professors:
					professorResult.data?.map((ps: any) => ({
						id: ps.professor_id,
						name: ps.name,
						room: ps.room,
						floor: ps.floor,
						status: ps.status as 'available' | 'busy' | 'unavailable',
						currentStudent: ps.current_student_id
							? {
									studentId: ps.current_student_id,
									name: ps.current_student_name || '',
									queueNumber: 0,
									arrivalTime: new Date(),
									status: 'in-progress' as const,
									assignedRoom: ps.room,
							  }
							: null,
						interviewStartTime: ps.interview_start_time ? new Date(ps.interview_start_time) : null,
					})) || currentData.professors, // Fallback to default professors
			};

			setDateData((prev) => ({
				...prev,
				[selectedDate]: newDateData,
			}));
		} catch (error) {
			console.error('Error loading data:', error);
			setError(`Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`);
		} finally {
			setIsLoading(false);
		}
	}, [selectedDate]);

	// Initialize professor data if not exists
	const initializeProfessorData = useCallback(async () => {
		try {
			const { data: existingProfs, error: checkError } = await supabase
				.from('professor_status')
				.select('*')
				.eq('date', selectedDate);

			if (checkError) throw checkError;

			if (!existingProfs || existingProfs.length === 0) {
				const professorData = [
					{
						professor_id: 1,
						name: 'Prof. Mansouri',
						room: 'Room 7',
						floor: 'First Floor',
						status: 'available',
						date: selectedDate,
					},
					{
						professor_id: 2,
						name: 'Prof. Bedaida',
						room: 'Room 8',
						floor: 'First Floor',
						status: 'available',
						date: selectedDate,
					},
					{
						professor_id: 3,
						name: 'Prof. Touati',
						room: 'Room 9',
						floor: 'First Floor',
						status: 'available',
						date: selectedDate,
					},
				];

				const { error: insertError } = await supabase.from('professor_status').insert(professorData);

				if (insertError) throw insertError;
				console.log('Initialized professor data for', selectedDate);
			}
		} catch (error) {
			console.error('Error initializing professor data:', error);
		}
	}, [selectedDate]);

	// Check Supabase connection
	const checkConnection = useCallback(async () => {
		setConnectionStatus('checking');
		try {
			const { error } = await supabase.from('students').select('count').limit(1);
			if (error) throw error;
			setConnectionStatus('connected');
			console.log('Supabase connection successful');
		} catch (error) {
			setConnectionStatus('disconnected');
			console.error('Supabase connection failed:', error);
			setError(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}, []);

	// Auto-load data on component mount and date change
	useEffect(() => {
		let mounted = true;

		const initAndLoad = async () => {
			if (!mounted) return;
			await checkConnection();
			if (!mounted) return;
			if (connectionStatus === 'connected' || connectionStatus === 'checking') {
				await initializeProfessorData();
				if (!mounted) return;
				await loadDateData();
			}
		};

		initAndLoad();

		return () => {
			mounted = false;
		};
	}, [selectedDate]);

	// Add student to queue - fixed
	const addStudentToQueue = useCallback(
		async (student: Student) => {
			try {
				setError(null);
				const newEntry = {
					student_id: student.studentId,
					name: student.name,
					queue_number: currentData.currentNumber,
					arrival_time: new Date().toISOString(),
					status: 'waiting',
					assigned_room: null,
					interview_date: selectedDate,
				};

				const { error } = await supabase.from('interview_queue').insert(newEntry);

				if (error) throw error;

				console.log('Successfully added to queue:', newEntry);

				// Update local state
				const queueEntry: QueueEntry = {
					...student,
					queueNumber: currentData.currentNumber,
					arrivalTime: new Date(),
					status: 'waiting',
					assignedRoom: null,
				};

				setDateData((prev) => ({
					...prev,
					[selectedDate]: {
						...currentData,
						waitingQueue: [...currentData.waitingQueue, queueEntry],
						currentNumber: currentData.currentNumber + 1,
					},
				}));

				// Show queue undo option
				setLastQueueEntry(queueEntry);
				setShowQueueUndoToast(true);
				
				// Auto-hide queue undo toast after 5 seconds
				setTimeout(() => {
					setShowQueueUndoToast(false);
				}, 5000);
			} catch (error) {
				console.error('Error adding student to queue:', error);
				setError(
					`Failed to add student to queue: ${error instanceof Error ? error.message : 'Unknown error'}`
				);
			}
		},
		[currentData, selectedDate]
	);

	// Send student to interview room - fixed
	const sendStudentToRoom = useCallback(
		async (student: QueueEntry, professorId: number) => {
			try {
				setError(null);
				const professor = currentData.professors.find((p: Professor) => p.id === professorId);
				if (!professor) return;

				// Update professor status and remove from queue
				const [professorUpdate, queueDelete] = await Promise.all([
					supabase
						.from('professor_status')
						.update({
							status: 'busy',
							current_student_id: student.studentId,
							current_student_name: student.name,
							interview_start_time: new Date().toISOString(),
						})
						.eq('professor_id', professorId)
						.eq('date', selectedDate),
					supabase
						.from('interview_queue')
						.delete()
						.eq('student_id', student.studentId)
						.eq('interview_date', selectedDate),
				]);

				if (professorUpdate.error) throw professorUpdate.error;
				if (queueDelete.error) throw queueDelete.error;

				console.log('Successfully sent student to room');

				// Update local state
				setDateData((prev) => ({
					...prev,
					[selectedDate]: {
						...currentData,
						waitingQueue: currentData.waitingQueue.filter(
							(s: QueueEntry) => s.studentId !== student.studentId
						),
						professors: currentData.professors.map((p: Professor) =>
							p.id === professorId
								? {
										...p,
										status: 'busy',
										currentStudent: student,
										interviewStartTime: new Date(),
								  }
								: p
						),
					},
				}));
			} catch (error) {
				console.error('Error sending student to room:', error);
				setError(
					`Failed to send student to room: ${error instanceof Error ? error.message : 'Unknown error'}`
				);
			}
		},
		[currentData, selectedDate]
	);

	// Complete interview - fixed
	const completeInterview = useCallback(
		async (professorId: number) => {
			try {
				setError(null);
				const professor = currentData.professors.find((p: Professor) => p.id === professorId);
				if (!professor || !professor.currentStudent || !professor.interviewStartTime) return;

				const duration = Math.floor((new Date().getTime() - professor.interviewStartTime.getTime()) / 60000);
				const completedData = {
					student_id: professor.currentStudent.studentId,
					name: professor.currentStudent.name,
					queue_number: professor.currentStudent.queueNumber,
					completed_time: new Date().toISOString(),
					interview_duration: duration,
					professor_name: professor.name,
					room: professor.room,
					interview_date: selectedDate,
				};

				// Insert completed interview and update professor status
				const [completedInsert, professorUpdate] = await Promise.all([
					supabase.from('completed_interviews').insert(completedData),
					supabase
						.from('professor_status')
						.update({
							status: 'available',
							current_student_id: null,
							current_student_name: null,
							interview_start_time: null,
						})
						.eq('professor_id', professorId)
						.eq('date', selectedDate),
				]);

				if (completedInsert.error) throw completedInsert.error;
				if (professorUpdate.error) throw professorUpdate.error;

				console.log('Successfully completed interview');

				// Create completed interview object
				const completedInterview: CompletedInterview = {
					...professor.currentStudent,
					completedTime: new Date(),
					interviewDuration: duration,
					professorName: professor.name,
					room: professor.room,
				};

				// Update local state
				setDateData((prev) => ({
					...prev,
					[selectedDate]: {
						...currentData,
						completedInterviews: [completedInterview, ...currentData.completedInterviews],
						professors: currentData.professors.map((p: Professor) =>
							p.id === professorId
								? {
										...p,
										status: 'available',
										currentStudent: null,
										interviewStartTime: null,
								  }
								: p
						),
					},
				}));
			} catch (error) {
				console.error('Error completing interview:', error);
				setError(`Failed to complete interview: ${error instanceof Error ? error.message : 'Unknown error'}`);
			}
		},
		[currentData, selectedDate]
	);

	// Add new student - fixed with proper validation and error handling
	const handleAddStudent = useCallback(async (student: Student) => {
		if (!student.name.trim() || !student.studentId.trim()) {
			setError('Please enter both student name and ID');
			return;
		}

		// Check if student ID already exists
		const existingStudent = currentData.registeredStudents.find(
			(s) => s.studentId.toLowerCase() === student.studentId.trim().toLowerCase()
		);

		if (existingStudent) {
			setError('Student ID already exists');
			return;
		}

		try {
			setError(null);
			const studentData = {
				student_id: student.studentId.trim(),
				name: student.name.trim(),
				interview_date: selectedDate,
			};

			const { error } = await supabase.from('students').insert(studentData);

			if (error) throw error;

			console.log('Successfully added new student:', studentData);

			// Create student object
			const newStudent: Student = {
				name: student.name.trim(),
				studentId: student.studentId.trim(),
			};

			// Update local state
			setDateData((prev) => ({
				...prev,
				[selectedDate]: {
					...currentData,
					registeredStudents: [...currentData.registeredStudents, newStudent],
				},
			}));

			// Show undo option
			setLastAddedStudent(newStudent);
			setShowUndoToast(true);
			
			// Auto-hide undo toast after 5 seconds
			setTimeout(() => {
				setShowUndoToast(false);
			}, 5000);
		} catch (error) {
			console.error('Error adding new student:', error);
			setError(`Failed to add student: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}, [currentData, selectedDate]);

	// Undo last added student
	const undoAddStudent = useCallback(async () => {
		if (!lastAddedStudent) return;

		try {
			setError(null);
			
			// Delete from database
			const { error } = await supabase
				.from('students')
				.delete()
				.eq('student_id', lastAddedStudent.studentId)
				.eq('interview_date', selectedDate);

			if (error) throw error;

			console.log('Successfully removed student:', lastAddedStudent);

			// Update local state - remove the student
			setDateData((prev) => ({
				...prev,
				[selectedDate]: {
					...currentData,
					registeredStudents: currentData.registeredStudents.filter(
						s => s.studentId !== lastAddedStudent.studentId
					),
				},
			}));

			// Clear undo state
			setLastAddedStudent(null);
			setShowUndoToast(false);
		} catch (error) {
			console.error('Error removing student:', error);
			setError(`Failed to remove student: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}, [lastAddedStudent, currentData, selectedDate]);

	// Undo last queue entry
	const undoQueueEntry = useCallback(async () => {
		if (!lastQueueEntry) return;

		try {
			setError(null);
			
			// Delete from database
			const { error } = await supabase
				.from('interview_queue')
				.delete()
				.eq('student_id', lastQueueEntry.studentId)
				.eq('interview_date', selectedDate);

			if (error) throw error;

			console.log('Successfully removed from queue:', lastQueueEntry);

			// Update local state - remove from queue
			setDateData((prev) => ({
				...prev,
				[selectedDate]: {
					...currentData,
					waitingQueue: currentData.waitingQueue.filter(
						q => q.studentId !== lastQueueEntry.studentId
					),
				},
			}));

			// Clear undo state
			setLastQueueEntry(null);
			setShowQueueUndoToast(false);
		} catch (error) {
			console.error('Error removing from queue:', error);
			setError(`Failed to remove from queue: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}, [lastQueueEntry, currentData, selectedDate]);

	// Handle login
	const handleLogin = useCallback((role: 'receptionist' | 'professor' | 'superadmin', profId?: number) => {
		setIsLoggedIn(true);
		setUserRole(role);
		
		// Persist to localStorage
		localStorage.setItem('isLoggedIn', 'true');
		localStorage.setItem('userRole', role);
		
		if (role === 'professor' && profId) {
			setProfessorId(profId);
			localStorage.setItem('professorId', profId.toString());
			setCurrentView('students'); // Professor can view dashboard
		} else {
			localStorage.removeItem('professorId');
			setCurrentView('students');
		}
	}, []);

	// Handle logout
	const handleLogout = useCallback(() => {
		setIsLoggedIn(false);
		setUserRole(null);
		setProfessorId(null);
		setCurrentView('students');
		
		// Clear localStorage
		localStorage.removeItem('isLoggedIn');
		localStorage.removeItem('userRole');
		localStorage.removeItem('professorId');
	}, []);

	// Remove student from queue
	const removeFromQueue = useCallback(async (queueEntry: QueueEntry) => {
		try {
			setError(null);
			
			// Delete from database
			const { error } = await supabase
				.from('interview_queue')
				.delete()
				.eq('student_id', queueEntry.studentId)
				.eq('interview_date', selectedDate);

			if (error) throw error;

			console.log('Successfully removed from queue:', queueEntry);

			// Update local state - remove from queue
			setDateData((prev) => ({
				...prev,
				[selectedDate]: {
					...currentData,
					waitingQueue: currentData.waitingQueue.filter(
						q => q.studentId !== queueEntry.studentId
					),
				},
			}));
		} catch (error) {
			console.error('Error removing from queue:', error);
			setError(`Failed to remove from queue: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}, [currentData, selectedDate]);

	// Delete student - enhanced with comprehensive cleanup
	const deleteStudent = useCallback(
		async (student: Student) => {
			try {
				setError(null);

				// Delete from all related tables
				const deleteOperations = await Promise.all([
					supabase
						.from('students')
						.delete()
						.eq('student_id', student.studentId)
						.eq('interview_date', selectedDate),
					supabase
						.from('interview_queue')
						.delete()
						.eq('student_id', student.studentId)
						.eq('interview_date', selectedDate),
					supabase
						.from('completed_interviews')
						.delete()
						.eq('student_id', student.studentId)
						.eq('interview_date', selectedDate),
				]);

				// Check for errors
				deleteOperations.forEach((result, index) => {
					if (result.error) {
						throw new Error(`Delete operation ${index} failed: ${result.error.message}`);
					}
				});

				// Free up professor if student was being interviewed
				const busyProfessor = currentData.professors.find(
					(p: Professor) => p.currentStudent?.studentId === student.studentId
				);

				if (busyProfessor) {
					const { error: professorError } = await supabase
						.from('professor_status')
						.update({
							status: 'available',
							current_student_id: null,
							current_student_name: null,
							interview_start_time: null,
						})
						.eq('professor_id', busyProfessor.id)
						.eq('date', selectedDate);

					if (professorError) throw professorError;
				}

				console.log('Successfully deleted student:', student.studentId);

				// Update local state
				setDateData((prev) => ({
					...prev,
					[selectedDate]: {
						...currentData,
						registeredStudents: currentData.registeredStudents.filter(
							(s: Student) => s.studentId !== student.studentId
						),
						waitingQueue: currentData.waitingQueue.filter(
							(s: QueueEntry) => s.studentId !== student.studentId
						),
						completedInterviews: currentData.completedInterviews.filter(
							(s: CompletedInterview) => s.studentId !== student.studentId
						),
						professors: currentData.professors.map((p: Professor) =>
							p.currentStudent?.studentId === student.studentId
								? {
										...p,
										status: 'available',
										currentStudent: null,
										interviewStartTime: null,
								  }
								: p
						),
					},
				}));

				setDeleteModal({ show: false, student: null });
			} catch (error) {
				console.error('Error deleting student:', error);
				setError(`Failed to delete student: ${error instanceof Error ? error.message : 'Unknown error'}`);
			}
		},
		[currentData, selectedDate]
	);

	// Helper functions for styling - memoized
	const getStatusColor = useMemo(
		() => (status: string) => {
			switch (status) {
				case 'available':
					return 'border-green-200 bg-green-50';
				case 'busy':
					return 'border-orange-200 bg-orange-50';
				default:
					return 'border-gray-200 bg-gray-50';
			}
		},
		[]
	);

	const getStatusVariant = useMemo(
		() =>
			(status: string): BadgeVariant => {
				switch (status) {
					case 'available':
						return 'default';
					case 'busy':
						return 'secondary';
					default:
						return 'outline';
				}
			},
		[]
	);

	// Confirmation Modal Component
	const ConfirmationModal = ({
		show,
		student,
		onConfirm,
		onCancel,
	}: {
		show: boolean;
		student: Student | null;
		onConfirm: () => void;
		onCancel: () => void;
	}) => {
		if (!show) return null;

		return (
			<div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
				<div className='bg-white rounded-lg shadow-lg max-w-md w-full p-6'>
					<div className='flex items-center justify-between mb-4'>
						<h3 className='text-lg font-semibold text-gray-900 flex items-center gap-2'>
							<AlertCircle className='h-5 w-5 text-red-600' />
							Confirm Deletion
						</h3>
						<Button variant='ghost' size='sm' onClick={onCancel}>
							<X className='h-4 w-4' />
						</Button>
					</div>

					<div className='mb-6'>
						<p className='text-gray-700 mb-2'>Are you sure you want to delete this student?</p>
						{student && (
							<div className='bg-gray-50 rounded-lg p-3 border'>
								<p className='font-medium text-gray-900'>{student.name}</p>
								<p className='text-sm text-gray-600'>{student.studentId}</p>
							</div>
						)}
						<p className='text-sm text-red-600 mt-2'>
							This action cannot be undone. The student will be removed from all lists including queue and
							completed interviews.
						</p>
					</div>

					<div className='flex gap-3 justify-end'>
						<Button variant='outline' onClick={onCancel}>
							Cancel
						</Button>
						<Button variant='destructive' onClick={onConfirm}>
							<Trash2 className='h-4 w-4 mr-2' />
							Delete Student
						</Button>
					</div>
				</div>
			</div>
		);
	};

	// Error Alert Component
	const ErrorAlert = ({ error, onDismiss }: { error: string; onDismiss: () => void }) => (
		<div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-4'>
			<div className='flex justify-between items-start'>
				<div className='flex'>
					<AlertCircle className='h-5 w-5 text-red-400 mt-0.5 mr-3' />
					<div>
						<h3 className='text-sm font-medium text-red-800'>Error</h3>
						<p className='text-sm text-red-700 mt-1'>{error}</p>
					</div>
				</div>
				<Button variant='ghost' size='sm' onClick={onDismiss} className='text-red-400 hover:text-red-600'>
					<X className='h-4 w-4' />
				</Button>
			</div>
		</div>
	);

	const StudentsView = () => {
		const isReadOnly = userRole === 'professor';
		
		return (
		<div className='space-y-6'>
			{/* Error Display */}
			{error && <ErrorAlert error={error} onDismiss={() => setError(null)} />}

			{/* Dashboard Stats */}
			<div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-2xl font-bold text-blue-600'>{currentData.registeredStudents.length}</p>
								<p className='text-sm text-muted-foreground'>Total Students</p>
							</div>
							<Users className='h-4 w-4 text-blue-600' />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-2xl font-bold text-yellow-600'>{currentData.waitingQueue.length}</p>
								<p className='text-sm text-muted-foreground'>Waiting Queue</p>
							</div>
							<Clock className='h-4 w-4 text-yellow-600' />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-2xl font-bold text-orange-600'>
									{currentData.professors.filter((p: Professor) => p.status === 'busy').length}
								</p>
								<p className='text-sm text-muted-foreground'>Active Interviews</p>
							</div>
							<Activity className='h-4 w-4 text-orange-600' />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-2xl font-bold text-green-600'>{currentData.completedInterviews.length}</p>
								<p className='text-sm text-muted-foreground'>Completed Today</p>
							</div>
							<CheckCircle className='h-4 w-4 text-green-600' />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Completed Interviews Section */}
			{currentData.completedInterviews.length > 0 && (
				<Card>
					<CardContent className='p-6'>
						<Button
							onClick={() => setShowCompletedInterviews(!showCompletedInterviews)}
							variant='ghost'
							className='w-full flex items-center justify-between p-4 h-auto hover:bg-gray-50'>
							<div className='flex items-center gap-3'>
								<CheckCircle className='h-5 w-5 text-green-600' />
								<div className='text-left'>
									<span className='font-semibold'>Completed Interviews</span>
									<p className='text-sm text-muted-foreground'>
										{currentData.completedInterviews.length} interviews finished today
									</p>
								</div>
							</div>
							<ChevronRight
								className={`h-4 w-4 transition-transform duration-200 ${
									showCompletedInterviews ? 'rotate-90' : ''
								}`}
							/>
						</Button>

						{showCompletedInterviews && (
							<div className='mt-4 pt-4 border-t'>
								<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
									{currentData.completedInterviews.map((interview: CompletedInterview, index: number) => (
										<div key={`${interview.studentId}-${index}`} className='border rounded-lg p-4'>
											<div className='flex items-center gap-2 mb-2'>
												<Badge variant='secondary'>#{interview.queueNumber}</Badge>
											</div>
											<p className='font-medium mb-1'>{interview.name}</p>
											<p className='text-sm text-muted-foreground mb-1'>{interview.professorName}</p>
											<p className='text-sm text-muted-foreground'>{interview.interviewDuration} minutes</p>
											<p className='text-xs text-muted-foreground mt-1'>
												{interview.completedTime.toLocaleTimeString()}
											</p>
										</div>
									))}
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* Main Grid */}
			<div className='grid grid-cols-1 xl:grid-cols-12 gap-6'>
				{/* Student Management */}
				<div className='xl:col-span-5'>
					<div className='space-y-4'>
						<StudentList
							students={currentData.registeredStudents}
							waitingQueue={currentData.waitingQueue}
							onAddToQueue={isReadOnly ? () => {} : addStudentToQueue}
							onDeleteStudent={isReadOnly ? () => {} : (student) => setDeleteModal({ show: true, student })}
							isLoading={isLoading}
							readOnly={isReadOnly}
						/>
						{!isReadOnly && <StudentForm onAddStudent={handleAddStudent} disabled={isLoading} />}
					</div>
				</div>

				{/* Queue Management */}
				<div className='xl:col-span-4'>
					<Card className='h-full'>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Clock className='h-5 w-5' />
								Interview Queue
							</CardTitle>
							<CardDescription>{currentData.waitingQueue.length} students waiting</CardDescription>
						</CardHeader>
						<CardContent>
							<div className='space-y-3'>
								{currentData.waitingQueue.length === 0 ? (
									<div className='text-center py-8'>
										<Clock className='h-12 w-12 text-muted-foreground mx-auto mb-3' />
										<p className='text-muted-foreground'>Queue is Empty</p>
										<p className='text-sm text-muted-foreground mt-1'>
											Add students from the registry to get started
										</p>
									</div>
								) : (
									currentData.waitingQueue.map((student: QueueEntry, index: number) => (
										<div
											key={`${student.studentId}-${student.queueNumber}`}
											className='relative border rounded-lg p-4 hover:shadow-md transition-shadow duration-200'>
											{/* Queue Position */}
											<div className='absolute -left-2 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center text-white text-xs font-bold'>
												{index + 1}
											</div>

											<div className='ml-4'>
												<div className='flex items-start justify-between mb-3'>
													<div className='flex items-center gap-3'>
														<div className='w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm'>
															{student.name
																.split(' ')
																.map((n) => n[0])
																.join('')
																.toUpperCase()}
														</div>
														<div>
															<p className='font-medium'>{student.name}</p>
															<p className='text-sm text-muted-foreground'>{student.studentId}</p>
															<p className='text-xs text-muted-foreground'>
																Queue #{student.queueNumber} • {student.arrivalTime.toLocaleTimeString()}
															</p>
														</div>
													</div>
												</div>

												{availableProfessors.length > 0 ? (
													<div className='space-y-2'>
														<p className='text-sm font-medium text-green-700'>Ready for Interview</p>
														<div className='flex gap-2 flex-wrap'>
															{availableProfessors.map((professor: Professor) => (
																<Button
																	key={professor.id}
																	onClick={isReadOnly ? undefined : () => sendStudentToRoom(student, professor.id)}
																	size='sm'
																	variant='outline'
																	disabled={isReadOnly}
																	className={`transition-all duration-200 ${isReadOnly ? 'opacity-50 cursor-not-allowed' : 'border-indigo-300 text-indigo-700 hover:bg-indigo-600 hover:text-white'}`}>
																	Send to {professor.room}
																</Button>
															))}
														</div>
														{!isReadOnly && (
															<Button
																onClick={() => removeFromQueue(student)}
																variant='outline'
																size='sm'
																className='w-full border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-all duration-200'>
																<X className='h-4 w-4 mr-2' />
																Remove from Queue
															</Button>
														)}
													</div>
												) : (
													<div className='flex items-center justify-between'>
														<div className='flex items-center gap-2 text-sm text-orange-600'>
															<Clock className='h-4 w-4' />
															<p>All professors are busy. Please wait.</p>
														</div>
														{!isReadOnly && (
															<Button
																onClick={() => removeFromQueue(student)}
																variant='outline'
																size='sm'
																className='border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-all duration-200'>
																<X className='h-4 w-4' />
															</Button>
														)}
													</div>
												)}
											</div>
										</div>
									))
								)}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Room Status */}
				<div className='xl:col-span-3'>
					<Card className='h-full'>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Building className='h-5 w-5' />
								Room Status
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='space-y-3'>
								{currentData.professors.map((professor: Professor) => (
									<div
										key={professor.id}
										className={`border rounded-lg p-4 transition-all duration-200 ${getStatusColor(
											professor.status
										)}`}>
										<div className='flex justify-between items-start mb-2'>
											<div>
												<p className='font-medium'>{professor.name}</p>
												<p className='text-sm text-muted-foreground'>{professor.room}</p>
											</div>
											<Badge variant={getStatusVariant(professor.status)}>{professor.status}</Badge>
										</div>
										{professor.currentStudent && (
											<div>
												<p className='text-sm mb-1'>
													Interviewing: #{professor.currentStudent.queueNumber} -{' '}
													{professor.currentStudent.name}
												</p>
												{professor.interviewStartTime && (
													<p className='text-xs text-muted-foreground'>
														Started: {professor.interviewStartTime.toLocaleTimeString()}
													</p>
												)}
											</div>
										)}
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
		);
	};

	const ProfessorView = ({ professorId }: { professorId: number }) => {
		const professor = currentData.professors.find((p: Professor) => p.id === professorId);
		const isReadOnly = userRole === 'professor';

		return (
			<div className='space-y-6'>
				{/* Error Display */}
				{error && <ErrorAlert error={error} onDismiss={() => setError(null)} />}

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center justify-between">
							<span>{professor?.name}</span>
							{isReadOnly && (
								<div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
									<Eye className="h-4 w-4" />
									View Only
								</div>
							)}
						</CardTitle>
						<CardDescription>
							{professor?.room} - {professor?.floor}
						</CardDescription>
					</CardHeader>
				</Card>

				<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
					<div className='lg:col-span-2'>
						<Card className='h-full'>
							<CardHeader>
								<CardTitle>Current Status</CardTitle>
							</CardHeader>
							<CardContent>
								<div
									className={`p-6 rounded-lg border transition-all duration-200 ${getStatusColor(
										professor?.status || 'available'
									)}`}>
									<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4'>
										<span className='text-lg font-medium'>
											{professor?.status === 'available' ? 'Ready for Next Student' : 'Interview in Progress'}
										</span>
										<Badge variant={getStatusVariant(professor?.status || 'available')}>
											{professor?.status}
										</Badge>
									</div>

									{professor?.currentStudent ? (
										<div className='space-y-4'>
											<div className='flex items-center gap-3'>
												<Badge>#{professor.currentStudent.queueNumber}</Badge>
												<p className='font-medium text-lg'>{professor.currentStudent.name}</p>
											</div>
											<p className='text-muted-foreground'>{professor.currentStudent.studentId}</p>
											{professor.interviewStartTime && (
												<p className='text-muted-foreground'>
													Started: {professor.interviewStartTime.toLocaleTimeString()}
													<span className='ml-2 text-sm'>
														(
														{Math.floor(
															(new Date().getTime() - professor.interviewStartTime.getTime()) / 60000
														)}{' '}
														min ago)
													</span>
												</p>
											)}
											{professor?.currentStudent && (
												<Button
													onClick={() => completeInterview(professorId)}
													className='w-full bg-green-600 hover:bg-green-700 text-white transition-colors duration-200'>
													<CheckCircle className='h-4 w-4 mr-2' />
													Complete Interview
												</Button>
											)}
										</div>
									) : (
										<div className='text-center py-12'>
											<Eye className='h-16 w-16 text-muted-foreground mx-auto mb-4' />
											<p className='text-muted-foreground'>Waiting for next student from reception...</p>
											{currentData.waitingQueue.length > 0 && (
												<p className='text-sm text-blue-600 mt-2'>
													{currentData.waitingQueue.length} student
													{currentData.waitingQueue.length > 1 ? 's' : ''} waiting in queue
												</p>
											)}
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					</div>

					<div className='lg:col-span-1'>
						<Card className='h-full'>
							<CardHeader>
								<CardTitle>Queue Overview</CardTitle>
							</CardHeader>
							<CardContent>
								<div className='space-y-4'>
									<div className='text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200'>
										<p className='text-2xl font-bold text-yellow-800'>{currentData.waitingQueue.length}</p>
										<p className='text-yellow-700 font-medium text-sm'>Students Waiting</p>
									</div>
									<div className='text-center p-4 bg-blue-50 rounded-lg border border-blue-200'>
										<p className='text-2xl font-bold text-blue-800'>
											{currentData.professors.filter((p: Professor) => p.status === 'busy').length}
										</p>
										<p className='text-blue-700 font-medium text-sm'>Interviews Active</p>
									</div>
									<div className='text-center p-4 bg-green-50 rounded-lg border border-green-200'>
										<p className='text-2xl font-bold text-green-800'>
											{currentData.completedInterviews.length}
										</p>
										<p className='text-green-700 font-medium text-sm'>Completed Today</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Other Interview Rooms</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							{currentData.professors
								.filter((p: Professor) => p.id !== professorId)
								.map((prof: Professor) => (
									<div
										key={prof.id}
										className={`border rounded-lg p-4 transition-all duration-200 ${getStatusColor(
											prof.status
										)}`}>
										<div className='flex justify-between items-start mb-2'>
											<div>
												<p className='font-medium'>{prof.name}</p>
												<p className='text-sm text-muted-foreground'>{prof.room}</p>
											</div>
											<Badge variant={getStatusVariant(prof.status)}>{prof.status}</Badge>
										</div>
										{prof.currentStudent && (
											<div>
												<p className='text-sm mb-1'>
													Interviewing: #{prof.currentStudent.queueNumber} - {prof.currentStudent.name}
												</p>
												{prof.interviewStartTime && (
													<p className='text-xs text-muted-foreground'>
														Started: {prof.interviewStartTime.toLocaleTimeString()}
													</p>
												)}
											</div>
										)}
									</div>
								))}
						</div>
					</CardContent>
				</Card>
			</div>
		);
	};

	// Show login screen if not authenticated
	if (!isLoggedIn) {
		return <Login onLogin={handleLogin} />;
	}


	// Receptionist has full access
	return (
		<div className='min-h-screen bg-background'>
			{/* Header */}
			<div className='border-b'>
				<div className='container mx-auto px-4 py-6'>
					<div className='flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6'>
						<div className='flex items-center gap-4'>
							<div className='w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center'>
								<GraduationCap className='h-6 w-6 text-white' />
							</div>
							<div>
								<h1 className='text-2xl font-bold'>Interview Hub</h1>
								<p className='text-muted-foreground'>
									University Management System
									{userRole === 'superadmin' && ' - Super Admin'}
									{userRole === 'receptionist' && ' - Receptionist'}
									{userRole === 'professor' && ` - Professor (${currentData.professors.find(p => p.id === professorId)?.name || 'View Only'})`}
								</p>
							</div>
						</div>

						{/* Controls */}
						<div className='flex flex-col sm:flex-row items-start sm:items-center gap-4'>
							<div className='flex items-center gap-3'>
								<CalendarComponent
									value={selectedDate}
									onChange={setSelectedDate}
									className='w-64'
								/>
								<Button
									variant='outline'
									size='sm'
									onClick={() => loadDateData()}
									disabled={isLoading}
									className='hover:bg-gray-50 transition-colors duration-200'>
									<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
								</Button>
							</div>

							{/* Connection Status */}
							<div className='flex items-center gap-2'>
								<div
									className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
										connectionStatus === 'connected'
											? 'bg-green-50 text-green-700 border border-green-200'
											: connectionStatus === 'disconnected'
											? 'bg-red-50 text-red-700 border border-red-200'
											: 'bg-yellow-50 text-yellow-700 border border-yellow-200'
									}`}>
									{connectionStatus === 'connected' && <CheckCircle className='h-4 w-4' />}
									{connectionStatus === 'disconnected' && <AlertCircle className='h-4 w-4' />}
									{connectionStatus === 'checking' && <RefreshCw className='h-4 w-4 animate-spin' />}
									<span className='capitalize'>
										{connectionStatus === 'checking' ? 'Connecting...' : connectionStatus}
									</span>
								</div>
							</div>

							{/* Navigation */}
							<div className='flex gap-2 flex-wrap'>
								<Button
									onClick={() => setCurrentView('students')}
									variant={currentView === 'students' ? 'default' : 'outline'}
									size='sm'
									className={
										currentView === 'students'
											? 'bg-indigo-600 hover:bg-indigo-700 text-white transition-colors duration-200'
											: 'border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-200'
									}>
									<Users className='h-4 w-4 mr-2' />
									Dashboard
								</Button>
								{userRole === 'superadmin' && currentData.professors.map((professor: Professor) => (
									<Button
										key={professor.id}
										onClick={() => setCurrentView(`professor-${professor.id}`)}
										variant={currentView === `professor-${professor.id}` ? 'default' : 'outline'}
										size='sm'
										className={
											currentView === `professor-${professor.id}`
												? 'bg-indigo-600 hover:bg-indigo-700 text-white transition-colors duration-200'
												: 'border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-200'
										}>
										{professor.room}
									</Button>
								))}
								{userRole === 'professor' && professorId && (
									<Button
										onClick={() => setCurrentView(`professor-${professorId}`)}
										variant={currentView === `professor-${professorId}` ? 'default' : 'outline'}
										size='sm'
										className={
											currentView === `professor-${professorId}`
												? 'bg-indigo-600 hover:bg-indigo-700 text-white transition-colors duration-200'
												: 'border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-200'
										}>
										My Room ({currentData.professors.find(p => p.id === professorId)?.room})
									</Button>
								)}
								<Button onClick={handleLogout} variant="outline" size="sm" className="ml-4">
									Logout
								</Button>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className='container mx-auto px-4 py-6'>
				{/* Loading State */}
				{isLoading && (
					<div className='flex items-center justify-center py-8'>
						<RefreshCw className='h-6 w-6 animate-spin mr-2' />
						<span>Loading data...</span>
					</div>
				)}

				{!isLoading && (
					<>
						{currentView === 'students' && <StudentsView />}
						{currentView.startsWith('professor-') && (
							<ProfessorView professorId={parseInt(currentView.split('-')[1])} />
						)}
					</>
				)}
			</div>

			{/* Confirmation Modal */}
			<ConfirmationModal
				show={deleteModal.show}
				student={deleteModal.student}
				onConfirm={() => deleteModal.student && deleteStudent(deleteModal.student)}
				onCancel={() => setDeleteModal({ show: false, student: null })}
			/>


			{/* Simple Chat System */}
			{isLoggedIn && (
				<SimpleChatSystem 
					currentUser={{
						id: userRole === 'professor' && professorId ? `prof-${professorId}` : userRole === 'receptionist' ? 'receptionist-1' : 'superadmin-1',
						name: userRole === 'professor' && professorId ? 
							professorId === 1 ? 'Prof. Mansouri' :
							professorId === 2 ? 'Prof. Bedaida' :
							professorId === 3 ? 'Prof. Touati' : 
							`Professor ${professorId}` :
							userRole === 'receptionist' ? 'Receptionist' : 'Super Admin',
						role: userRole || 'receptionist'
					}} 
				/>
			)}

			{/* Undo Toast Notifications */}
			{showUndoToast && lastAddedStudent && (
				<div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50">
					<span>Added <strong>{lastAddedStudent.name}</strong> to registry</span>
					<Button 
						onClick={undoAddStudent}
						variant="ghost" 
						size="sm" 
						className="text-white hover:bg-gray-700 px-2"
					>
						Undo
					</Button>
					<Button 
						onClick={() => setShowUndoToast(false)}
						variant="ghost" 
						size="sm" 
						className="text-white hover:bg-gray-700 px-1"
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			)}

			{/* Queue Undo Toast Notification */}
			{showQueueUndoToast && lastQueueEntry && (
				<div className="fixed bottom-4 right-4 bg-blue-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50">
					<span>Added <strong>{lastQueueEntry.name}</strong> to interview queue</span>
					<Button 
						onClick={undoQueueEntry}
						variant="ghost" 
						size="sm" 
						className="text-white hover:bg-blue-700 px-2"
					>
						Undo
					</Button>
					<Button 
						onClick={() => setShowQueueUndoToast(false)}
						variant="ghost" 
						size="sm" 
						className="text-white hover:bg-blue-700 px-1"
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			)}
		</div>
	);
};

export default InterviewQueueSystem;
