import { useState, useEffect, useCallback, useMemo } from 'react';
import {
	Users,
	Clock,
	CheckCircle,
	AlertCircle,
	Building,
	Eye,
	Trash2,
	X,
	GraduationCap,
	Activity,
	ChevronRight,
	RefreshCw,
	GripVertical,
	Timer,
	Bell,
} from 'lucide-react';

import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { supabase } from './lib/supabase';
import { StudentForm } from './components/StudentForm';
import { StudentList } from './components/StudentList';
import { Login } from './components/Login';
import { Calendar as CalendarComponent } from './components/Calendar';
import { StudentAdmissionForm } from './components/StudentAdmissionForm';
import { ProfessorInterviewForm } from './components/ProfessorInterviewForm';
import { AdministrationView } from './components/AdministrationView';
import TestManagement from './components/TestManagement';

// Types
interface Student {
	studentId: string;
	name: string;
}

interface StudentFormData {
	name: string;
	program: string;
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
	status: 'available' | 'busy' | 'unavailable' | 'offline';
	currentStudent: QueueEntry | null;
	interviewStartTime: Date | null;
}

interface DateData {
	waitingQueue: QueueEntry[];
	completedInterviews: CompletedInterview[];
	currentNumber: number;
	professors: Professor[];
}

interface DateDataState {
	[key: string]: DateData;
}

interface AdmissionStudent {
	id?: number;
	nom: string;
	prenom: string;
	mobile: string;
	bacType: string;
	anneeBac: string;
	specialite: string;
	moyenneGenerale?: number;
	maths?: number;
	francais?: number;
	physique?: number;
	testRequired: boolean;
	testScores?: {
		maths?: number;
		logique?: number;
		francais?: number;
		cultureGenerale?: number;
	};
	validation?: 'pending' | 'accepted' | 'rejected';
	validationComment?: string;
	studentStatus?: 'inscrit' | 'en_cours' | 'abandonner';
	dateCreated: Date;
	salesPersonId: number;
	interviewDate?: string;
	licenceSpecialite?: string;
	university?: string;
	// Test management fields
	testStartTime?: string;
	testEndTime?: string;
	testStatus?: 'not_started' | 'in_progress' | 'completed' | 'absent';
	testDuration?: number; // in minutes
	// Interview management fields
	interviewStatus?: 'not_registered' | 'in_queue' | 'interviewing' | 'completed';
	interviewQueueNumber?: number;
	interviewCompletedTime?: string;
	// Helper properties for interview system
	studentId?: string; // Generated from nom + prenom
	name?: string; // Full name for display
}

interface DeleteModalState {
	show: boolean;
	student: Student | null;
}

interface InterviewEvaluation {
	studentId: number;
	professorId: number;
	situationEtudes: string;
	motivationDomaine: number;
	motivationDomaineComment: string;
	motivationIFAG: number;
	motivationIFAGComment: string;
	projetEtudes: number;
	projetEtudesComment: string;
	projetProfessionnel: number;
	projetProfessionnelComment: string;
	aisanceVerbale: number;
	aisanceVerbaleComment: string;
	interactionJury: number;
	interactionJuryComment: string;
	cultureGenerale: number;
	cultureGeneraleComment: string;
	decisionJury: 'admis' | 'non_admis' | 'indecis';
	commentaireGlobal: string;
	membreJury: string;
	dateEvaluation: Date;
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
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
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
	const [userRole, setUserRole] = useState<
		'receptionist' | 'professor' | 'superadmin' | 'sales' | 'administration' | 'test_manager' | null
	>(() => {
		return localStorage.getItem('userRole') as
			| 'receptionist'
			| 'professor'
			| 'superadmin'
			| 'sales'
			| 'administration'
			| 'test_manager'
			| null;
	});
	const [professorId, setProfessorId] = useState<number | null>(() => {
		const stored = localStorage.getItem('professorId');
		return stored ? parseInt(stored) : null;
	});
	const [salesId, setSalesId] = useState<number | null>(() => {
		const stored = localStorage.getItem('salesId');
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

	// Admission students state for sales users
	const [admissionStudents, setAdmissionStudents] = useState<AdmissionStudent[]>([]);

	// Drag and drop state (for dnd-kit)

	// Configure drag sensors
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	// Get current date data or initialize empty - memoized for performance
	const getCurrentDateData = useCallback((): DateData => {
		return (
			dateData[selectedDate] || {
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

	// Get students for selected date from admission students
	const getRegisteredStudents = useCallback((): Student[] => {
		return admissionStudents
			.filter((student) => {
				if (!student.interviewDate) return false;
				return new Date(student.interviewDate).toDateString() === new Date(selectedDate).toDateString();
			})
			.map((student) => ({
				studentId: `${student.nom?.toLowerCase()}.${student.prenom?.toLowerCase()}`,
				name: `${student.nom} ${student.prenom}`,
			}));
	}, [admissionStudents, selectedDate]);

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
	const [showInterviewForm, setShowInterviewForm] = useState(false);
	const [currentInterviewStudent, setCurrentInterviewStudent] = useState<AdmissionStudent | null>(null);
	const [completedEvaluations, setCompletedEvaluations] = useState<Set<string>>(new Set());

	// Notification state
	const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
	const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

	// Memoized available professors
	const availableProfessors = useMemo(
		() => currentData.professors.filter((p: Professor) => p.status === 'available'),
		[currentData.professors]
	);

	// Load data from Supabase - fixed with proper error handling
	const loadDateData = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			console.debug('Loading data for date:', selectedDate);

			// Load all data in parallel
			const [studentsResult, queueResult, completedResult, professorResult, evaluationsResult] =
				await Promise.all([
					supabase.from('students').select('*').eq('interview_date', selectedDate),
					supabase
						.from('interview_queue')
						.select('*')
						.eq('interview_date', selectedDate)
						.order('queue_number'),
					supabase
						.from('completed_interviews')
						.select('*')
						.eq('interview_date', selectedDate)
						.order('completed_time', { ascending: false }),
					supabase.from('professor_status').select('*').eq('date', selectedDate),
					supabase
						.from('interview_evaluations')
						.select('student_id, professor_id')
						.gte('created_at', `${selectedDate}T00:00:00`)
						.lt('created_at', `${selectedDate}T23:59:59`),
				]);

			// Check for errors
			if (studentsResult.error) throw studentsResult.error;
			if (queueResult.error) throw queueResult.error;
			if (completedResult.error) throw completedResult.error;
			if (professorResult.error) throw professorResult.error;
			if (evaluationsResult.error) throw evaluationsResult.error;

			// Data loaded successfully

			// Transform and update data
			const newDateData: DateData = {
				waitingQueue:
					queueResult.data?.map((q) => ({
						studentId: q.student_id,
						name: q.name,
						queueNumber: q.queue_number,
						arrivalTime: new Date(q.arrival_time),
						status: q.status as 'waiting' | 'in-progress' | 'completed',
						assignedRoom: q.assigned_room,
					})) || [],
				completedInterviews:
					completedResult.data?.map((c) => ({
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
					? Math.max(...queueResult.data.map((q) => q.queue_number)) + 1
					: 1,
				professors:
					professorResult.data?.map((ps) => ({
						id: ps.professor_id,
						name: ps.name,
						room: ps.room,
						floor: ps.floor,
						status: (ps.status === 'busy' ? 'busy' : 'available') as
							| 'available'
							| 'busy'
							| 'unavailable'
							| 'offline',
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
					})) || [], // Empty array if no professors found
			};

			setDateData((prev) => ({
				...prev,
				[selectedDate]: newDateData,
			}));

			// Load completed evaluations for the selected date - preserve existing local state
			if (evaluationsResult.data && evaluationsResult.data.length > 0) {
				const dbEvaluationKeys = new Set(
					evaluationsResult.data.map((evaluation) => `${evaluation.student_id}-${evaluation.professor_id}`)
				);
				setCompletedEvaluations((prev) => {
					// Merge database evaluations with any locally added ones
					const merged = new Set([...prev, ...dbEvaluationKeys]);
					// Merged completed evaluations
					return merged;
				});
			}
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
				console.debug('Initialized professor data for', selectedDate);
			}
		} catch (error) {
			console.error('Error initializing professor data:', error);
		}
	}, [selectedDate]);

	// Load admission students from database
	const loadAdmissionStudents = useCallback(async () => {
		try {
			setError(null);

			const { data, error } = await supabase
				.from('admission_students')
				.select('*')
				.order('date_created', { ascending: false });

			if (error) {
				// If table doesn't exist, just set empty array and log the error
				if (error.code === '42P01') {
					console.warn('admission_students table does not exist yet. Please create it in Supabase.');
					setAdmissionStudents([]);
					return;
				}
				throw error;
			}

			const admissionStudents: AdmissionStudent[] = data.map((student) => ({
				id: student.id,
				nom: student.nom,
				prenom: student.prenom,
				mobile: student.mobile,
				bacType: student.bac_type,
				anneeBac: student.annee_bac,
				specialite: student.specialite,
				moyenneGenerale: student.moyenne_generale,
				maths: student.maths,
				francais: student.francais,
				physique: student.physique,
				licenceSpecialite: student.licence_specialite,
				university: student.university,
				testRequired: student.test_required,
				testScores: student.test_scores,
				validation: student.validation,
				validationComment: student.validation_comment,
				studentStatus: student.student_status,
				interviewDate: student.interview_date,
				testStartTime: student.test_start_time,
				testEndTime: student.test_end_time,
				testStatus: student.test_status || 'not_started',
				testDuration: student.test_duration,
				interviewStatus: student.interview_status || 'not_registered',
				interviewQueueNumber: student.interview_queue_number,
				interviewCompletedTime: student.interview_completed_time,
				dateCreated: new Date(student.date_created),
				salesPersonId: student.sales_person_id,
				studentRegistryId: student.student_registry_id,
			}));

			setAdmissionStudents(admissionStudents);
			console.debug('Loaded admission students count:', admissionStudents.length);
		} catch (error) {
			console.error('Error loading admission students:', error);
			setError(
				`Failed to load admission students: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}, []);

	// Add admission student to registry for interview
	// Check connection and load data on component mount and date change
	useEffect(() => {
		let mounted = true;

		const initAndLoad = async () => {
			if (!mounted) return;

			try {
				setConnectionStatus('checking');
				const { error } = await supabase.from('students').select('count').limit(1);
				if (error) throw error;
				setConnectionStatus('connected');

				if (!mounted) return;
				await initializeProfessorData();
				if (!mounted) return;
				await loadDateData();
				if (!mounted) return;
				await loadAdmissionStudents();
				if (!mounted) return;
				// Initialize notifications for receptionist
				if (userRole === 'receptionist') {
					if ('Notification' in window) {
						const permission = await Notification.requestPermission();
						setNotificationPermission(permission);
					}
					try {
						const audioCtx = new (window.AudioContext ||
							(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
						setAudioContext(audioCtx);
					} catch (error) {
						console.warn('Audio context initialization failed:', error);
					}
				}
			} catch (error) {
				setConnectionStatus('disconnected');
				console.error('Connection or data loading failed:', error);
				setError(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
			}
		};

		initAndLoad();

		// 🔹 Add realtime subscription for professor status changes
		const professorChannel = supabase
			.channel('professor-status-changes')
			.on('postgres_changes', { event: '*', schema: 'public', table: 'professor_status' }, (payload) => {
				console.log('Professor status changed:', payload);
				loadDateData(); // refresh receptionist/professor views
			})
			.subscribe();

		// 🔹 Add realtime subscription for completed interviews (for notifications)
		const completedChannel = supabase
			.channel('completed-interviews')
			.on(
				'postgres_changes',
				{ event: 'INSERT', schema: 'public', table: 'completed_interviews' },
				async (payload) => {
					console.log('Interview completed real-time event received:', payload);
					console.log('Current user role:', userRole);
					console.log('Payload has new data:', !!payload.new);

					// Only trigger notification for receptionist role
					if (userRole === 'receptionist' && payload.new) {
						const professorName = (payload.new as { professor_name?: string }).professor_name;
						const studentName = (payload.new as { name?: string }).name;

						console.log('Extracted from payload - Professor:', professorName, 'Student:', studentName);

						if (professorName && studentName) {
							console.log('Triggering notification for professor:', professorName, 'student:', studentName);
							console.log('AudioContext available:', !!audioContext);
							// Inline notification logic
							try {
								// Play attention-grabbing notification sound
								if (audioContext) {
									console.log('AudioContext state:', audioContext.state);
									// Resume AudioContext if it's suspended
									if (audioContext.state === 'suspended') {
										await audioContext.resume();
										console.log('AudioContext resumed');
									}
									// Create a more prominent notification sound sequence
									const playTone = (
										frequency: number,
										startTime: number,
										duration: number,
										volume: number = 0.4
									) => {
										const oscillator = audioContext.createOscillator();
										const gainNode = audioContext.createGain();

										oscillator.type = 'square'; // Square wave for more attention-grabbing sound
										oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + startTime);
										oscillator.connect(gainNode);

										gainNode.gain.setValueAtTime(0, audioContext.currentTime + startTime);
										gainNode.gain.linearRampToValueAtTime(
											volume,
											audioContext.currentTime + startTime + 0.05
										);
										gainNode.gain.exponentialRampToValueAtTime(
											0.01,
											audioContext.currentTime + startTime + duration
										);
										gainNode.connect(audioContext.destination);

										oscillator.start(audioContext.currentTime + startTime);
										oscillator.stop(audioContext.currentTime + startTime + duration);
									};

									// Play a distinctive 3-tone notification sequence (like phone ringing)
									playTone(1000, 0, 0.2, 0.5); // High tone
									playTone(800, 0.3, 0.2, 0.5); // Medium tone
									playTone(1000, 0.6, 0.2, 0.5); // High tone again

									// Add a second burst after a pause for extra attention
									playTone(1200, 1.2, 0.15, 0.4); // Very high tone
									playTone(900, 1.4, 0.15, 0.4); // Medium-high tone
									playTone(1200, 1.6, 0.15, 0.4); // Very high tone again
									console.log('Notification sound sequence triggered');
								}

								// Show browser notification
								if (notificationPermission === 'granted') {
									new Notification('Entretien Terminé', {
										body: `${professorName} a terminé l'entretien avec ${studentName}. Le professeur est maintenant disponible.`,
										icon: '/ifag-logo.png',
										badge: '/ifag-logo.png',
										tag: 'interview-completed',
										requireInteraction: true,
									});
								}

								// Show in-app notification
								const notificationElement = document.createElement('div');
								notificationElement.className =
									'fixed top-4 right-4 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm';
								notificationElement.innerHTML = `
								<div class="flex items-center">
									<div class="flex-shrink-0">
										<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
										</svg>
									</div>
									<div class="ml-3">
										<p class="text-sm font-medium">Entretien Terminé</p>
										<p class="text-sm">${professorName} - ${studentName}</p>
									</div>
								</div>
							`;
								document.body.appendChild(notificationElement);
								setTimeout(() => {
									if (document.body.contains(notificationElement)) {
										document.body.removeChild(notificationElement);
									}
								}, 5000);
							} catch (error) {
								console.warn('Failed to show notification:', error);
							}
						} else {
							console.log('Missing professor or student name, skipping notification');
						}
					} else {
						console.log('Not a receptionist or no payload data, skipping notification');
					}

					loadDateData(); // refresh data for all users
				}
			)
			.subscribe();

		return () => {
			mounted = false;
			supabase.removeChannel(professorChannel); // clean up subscription
			supabase.removeChannel(completedChannel); // clean up subscription
		};
	}, [selectedDate, initializeProfessorData, loadDateData, loadAdmissionStudents, userRole]);

	// Update admission student
	const updateAdmissionStudent = useCallback(async (updatedStudent: AdmissionStudent) => {
		try {
			setError(null);

			// Update in database
			const { error } = await supabase
				.from('admission_students')
				.update({
					nom: updatedStudent.nom,
					prenom: updatedStudent.prenom,
					mobile: updatedStudent.mobile,
					bac_type: updatedStudent.bacType,
					annee_bac: updatedStudent.anneeBac,
					specialite: updatedStudent.specialite,
					moyenne_generale: updatedStudent.moyenneGenerale,
					maths: updatedStudent.maths,
					francais: updatedStudent.francais,
					physique: updatedStudent.physique,
					licence_specialite: updatedStudent.licenceSpecialite,
					university: updatedStudent.university,
					test_required: updatedStudent.testRequired,
					test_scores: updatedStudent.testScores,
					validation: updatedStudent.validation,
					validation_comment: updatedStudent.validationComment || '',
					student_status: updatedStudent.studentStatus || 'en_cours',
					interview_date: updatedStudent.interviewDate,
					test_start_time: updatedStudent.testStartTime,
					test_end_time: updatedStudent.testEndTime,
					test_status: updatedStudent.testStatus || 'not_started',
					test_duration: updatedStudent.testDuration,
					interview_status: updatedStudent.interviewStatus || 'not_registered',
					interview_queue_number: updatedStudent.interviewQueueNumber,
					interview_completed_time: updatedStudent.interviewCompletedTime,
				})
				.eq('id', updatedStudent.id);

			if (error) throw error;

			console.debug('Successfully updated admission student:', updatedStudent.nom, updatedStudent.prenom);

			// Update in local state
			setAdmissionStudents((prev) =>
				prev.map((student) => (student.id === updatedStudent.id ? updatedStudent : student))
			);
		} catch (error) {
			console.error('Error updating admission student:', error);
			setError(
				`Failed to update admission student: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}, []);

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

				// Update interview status in admission_students table
				const admissionStudent = admissionStudents.find((s) => `${s.nom} ${s.prenom}` === student.name);
				if (admissionStudent) {
					await updateAdmissionStudent({
						...admissionStudent,
						interviewStatus: 'in_queue',
						interviewQueueNumber: currentData.currentNumber,
					});
				}

				console.debug('Successfully added to queue:', student.name);

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
		[currentData, selectedDate, admissionStudents, updateAdmissionStudent]
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

				// Update interview status in admission_students table
				const admissionStudent = admissionStudents.find((s) => `${s.nom} ${s.prenom}` === student.name);
				if (admissionStudent) {
					await updateAdmissionStudent({
						...admissionStudent,
						interviewStatus: 'interviewing',
						interviewQueueNumber: undefined, // Clear queue number as they're no longer in queue
					});
				}

				console.debug('Successfully sent student to room');

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
		[currentData, selectedDate, admissionStudents, updateAdmissionStudent]
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

				// Update interview status in admission_students table
				const admissionStudent = admissionStudents.find(
					(s) => `${s.nom} ${s.prenom}` === professor.currentStudent?.name
				);
				if (admissionStudent) {
					await updateAdmissionStudent({
						...admissionStudent,
						interviewStatus: 'completed',
						interviewCompletedTime: new Date().toISOString(),
					});
				}

				console.debug('Successfully completed interview');

				// Trigger notification for receptionist (if this is the receptionist completing it)
				if (userRole === 'receptionist') {
					// Play sound notification
					if (audioContext) {
						try {
							const oscillator1 = audioContext.createOscillator();
							const oscillator2 = audioContext.createOscillator();
							const gainNode = audioContext.createGain();
							oscillator1.type = 'sine';
							oscillator1.frequency.setValueAtTime(800, audioContext.currentTime);
							oscillator1.connect(gainNode);
							oscillator2.type = 'sine';
							oscillator2.frequency.setValueAtTime(1000, audioContext.currentTime);
							oscillator2.connect(gainNode);
							gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
							gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
							gainNode.connect(audioContext.destination);
							oscillator1.start();
							oscillator2.start(audioContext.currentTime + 0.15);
							oscillator1.stop(audioContext.currentTime + 0.15);
							oscillator2.stop(audioContext.currentTime + 0.3);
						} catch (error) {
							console.warn('Failed to play notification sound:', error);
						}
					}
				}

				// Keep the evaluation completion status - don't clear it
				// Once an evaluation is completed, it should stay completed

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

				// Trigger data refresh to ensure real-time updates for all users
				setTimeout(() => {
					loadDateData();
				}, 500);
			} catch (error) {
				console.error('Error completing interview:', error);
				setError(`Failed to complete interview: ${error instanceof Error ? error.message : 'Unknown error'}`);
			}
		},
		[
			currentData,
			selectedDate,
			loadDateData,
			admissionStudents,
			updateAdmissionStudent,
			userRole,
			audioContext,
		]
	);

	// Revert student from interview back to queue
	const revertStudentToQueue = useCallback(
		async (professorId: number) => {
			try {
				setError(null);
				const professor = currentData.professors.find((p: Professor) => p.id === professorId);
				if (!professor || !professor.currentStudent) return;

				// Confirm action
				const confirmRevert = window.confirm(
					`Êtes-vous sûr de vouloir renvoyer ${professor.currentStudent.name} dans la file d'attente?\n\nCeci annulera l'entretien en cours.`
				);
				if (!confirmRevert) return;

				// Find the next queue number
				const maxQueueNumber = Math.max(0, ...currentData.waitingQueue.map((q) => q.queueNumber));
				const nextQueueNumber = maxQueueNumber + 1;

				const revertData = {
					student_id: professor.currentStudent.studentId,
					name: professor.currentStudent.name,
					queue_number: nextQueueNumber,
					arrival_time: new Date().toISOString(),
					status: 'waiting',
					assigned_room: null,
					interview_date: selectedDate,
				};

				// Insert back to queue and update professor status
				const [queueInsert, professorUpdate] = await Promise.all([
					supabase.from('interview_queue').insert(revertData),
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

				if (queueInsert.error) throw queueInsert.error;
				if (professorUpdate.error) throw professorUpdate.error;

				console.debug('Successfully reverted student to queue');

				// Clear any completed evaluation for this student
				const currentStudentAdmission = admissionStudents.find(
					(s) => s.nom && s.prenom && `${s.nom} ${s.prenom}` === professor.currentStudent?.name
				);
				if (currentStudentAdmission?.id) {
					const evaluationKey = `${currentStudentAdmission.id}-${professorId}`;
					setCompletedEvaluations((prev) => {
						const newSet = new Set(prev);
						newSet.delete(evaluationKey);
						return newSet;
					});
				}

				// Create queue entry for local state
				const queueEntry: QueueEntry = {
					studentId: professor.currentStudent.studentId,
					name: professor.currentStudent.name,
					queueNumber: nextQueueNumber,
					arrivalTime: new Date(),
					status: 'waiting',
					assignedRoom: null,
				};

				// Update local state
				setDateData((prev) => ({
					...prev,
					[selectedDate]: {
						...currentData,
						waitingQueue: [...currentData.waitingQueue, queueEntry],
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

				// Show success message
				alert(`${professor.currentStudent.name} a été renvoyé(e) dans la file d'attente.`);

				// Trigger data refresh to ensure real-time updates
				setTimeout(() => {
					loadDateData();
				}, 500);
			} catch (error) {
				console.error('Error reverting student to queue:', error);
				setError(`Failed to revert student: ${error instanceof Error ? error.message : 'Unknown error'}`);
			}
		},
		[currentData, selectedDate, loadDateData, admissionStudents]
	);

	// Generate unique student ID
	const generateStudentId = useCallback((program: string, name: string) => {
		const nameInitials = name
			.trim()
			.split(' ')
			.map((n) => n.charAt(0).toUpperCase())
			.join('')
			.slice(0, 2);
		const programPrefix =
			program && program !== 'No Program' ? program.replace(/\s+/g, '').toUpperCase().slice(0, 3) : 'STU';
		const randomSuffix = Math.floor(Math.random() * 100)
			.toString()
			.padStart(2, '0');

		return `${programPrefix}${nameInitials}${randomSuffix}`;
	}, []);

	// Add new student - with automatic ID generation
	const handleAddStudent = useCallback(
		async (studentData: StudentFormData) => {
			if (!studentData.name.trim()) {
				setError('Please enter student name');
				return;
			}

			try {
				setError(null);

				// Generate unique student ID automatically
				const generatedId = generateStudentId(studentData.program, studentData.name);

				// Ensure the generated ID is unique by checking against existing students
				const registeredStudents = getRegisteredStudents();
				let finalId = generatedId;
				let counter = 1;
				while (registeredStudents.some((s) => s.studentId === finalId)) {
					finalId = `${generatedId}${counter}`;
					counter++;
				}
				const dbStudentData = {
					student_id: finalId,
					name: studentData.name.trim(),
					interview_date: selectedDate,
				};

				const { error } = await supabase.from('students').insert(dbStudentData);

				if (error) throw error;

				console.debug('Successfully added new student:', studentData.name);

				// Note: Student is now managed through admission system, no local update needed

				// Student added successfully - no undo toast needed
			} catch (error) {
				console.error('Error adding new student:', error);
				setError(`Failed to add student: ${error instanceof Error ? error.message : 'Unknown error'}`);
			}
		},
		[selectedDate, generateStudentId, getRegisteredStudents]
	);

	// Add admission student to main registry for interview
	const addAdmissionToRegistry = useCallback(
		async (student: { studentId: string; name: string }, interviewDate: string) => {
			try {
				setError(null);

				// Add to students table for the interview date
				const { error } = await supabase.from('students').insert({
					student_id: student.studentId,
					name: student.name,
					interview_date: interviewDate,
				});

				if (error) throw error;

				console.debug('Successfully added admission student to registry:', student.name);

				// Student now managed through admission system - no local state update needed
			} catch (error) {
				console.error('Error adding admission student to registry:', error);
				setError(
					`Failed to add student to registry: ${error instanceof Error ? error.message : 'Unknown error'}`
				);
			}
		},
		[]
	);

	// Save admission student - new function for sales users
	const saveAdmissionStudent = useCallback(
		async (admissionData: AdmissionStudent) => {
			console.debug('saveAdmissionStudent called with:', admissionData.nom, admissionData.prenom);

			// Check if student already exists to prevent duplicates
			const existingStudent = admissionStudents.find(
				(s) =>
					s.nom === admissionData.nom &&
					s.prenom === admissionData.prenom &&
					s.mobile === admissionData.mobile
			);

			if (existingStudent) {
				console.warn('Student already exists, preventing duplicate creation');
				setError('Student with this name and mobile already exists');
				return;
			}

			try {
				setError(null);
				console.debug('Saving admission student data for:', admissionData.nom, 'with sales ID:', salesId);

				// Insert into admission_students table
				const { data, error } = await supabase
					.from('admission_students')
					.insert({
						nom: admissionData.nom,
						prenom: admissionData.prenom,
						mobile: admissionData.mobile,
						bac_type: admissionData.bacType,
						annee_bac: admissionData.anneeBac,
						specialite: admissionData.specialite,
						moyenne_generale: admissionData.moyenneGenerale,
						maths: admissionData.maths,
						francais: admissionData.francais,
						physique: admissionData.physique,
						licence_specialite: admissionData.licenceSpecialite,
						university: admissionData.university,
						test_required: admissionData.testRequired,
						test_scores: admissionData.testScores,
						validation: admissionData.validation || 'pending',
						interview_date: admissionData.interviewDate,
						date_created: new Date().toISOString(),
						sales_person_id: salesId,
					})
					.select()
					.single();

				if (error) throw error;

				console.debug('Successfully saved admission student:', data?.nom || admissionData.nom);

				const newStudent: AdmissionStudent = {
					id: data.id,
					nom: data.nom,
					prenom: data.prenom,
					mobile: data.mobile,
					bacType: data.bac_type,
					anneeBac: data.annee_bac,
					specialite: data.specialite,
					moyenneGenerale: data.moyenne_generale,
					maths: data.maths,
					francais: data.francais,
					physique: data.physique,
					licenceSpecialite: data.licence_specialite,
					university: data.university,
					testRequired: data.test_required,
					testScores: data.test_scores,
					validation: data.validation,
					validationComment: data.validation_comment || '',
					studentStatus: data.student_status || 'en_cours',
					interviewDate: data.interview_date,
					dateCreated: new Date(data.date_created),
					salesPersonId: data.sales_person_id,
				};

				// Update local state
				// Adding student to local state
				setAdmissionStudents((prev) => {
					return [...prev, newStudent];
				});

				// If interview date is selected, add to main registry and link them
				if (admissionData.interviewDate) {
					const registryStudent = {
						studentId: `${admissionData.nom?.toLowerCase()}.${admissionData.prenom?.toLowerCase()}`,
						name: `${admissionData.nom} ${admissionData.prenom}`,
					};
					await addAdmissionToRegistry(registryStudent, admissionData.interviewDate);

					// Update the admission record with the registry link
					await supabase
						.from('admission_students')
						.update({ student_registry_id: registryStudent.studentId })
						.eq('id', newStudent.id);
				}
			} catch (error) {
				console.error('Error saving admission student:', error);
				console.debug('Student data being saved:', admissionData.nom, admissionData.prenom);

				// Enhanced error handling with specific error codes
				if (error && typeof error === 'object' && 'code' in error) {
					const errorCode = (error as { code?: string }).code;
					const errorMessage = (error as { message?: string }).message || 'Unknown database error';

					console.error('Database error code:', errorCode);
					console.error('Database error message:', errorMessage);

					switch (errorCode) {
						case '42P01':
							setError('Database table not found. Please run create_admission_students_table.sql');
							break;
						case '42703':
							setError('Database column missing. Please run add_missing_columns.sql');
							break;
						case 'PGRST204':
							setError(
								'Column not found in database. Please run add_missing_columns.sql in Supabase SQL editor'
							);
							break;
						case '42501':
							setError('Permission denied. Please run fix_admission_students_rls.sql to fix authentication');
							break;
						case '23505':
							setError('Student with this information already exists in the database');
							break;
						default:
							setError(`Database error (${errorCode}): ${errorMessage}`);
					}
				} else {
					setError(
						`Failed to save admission student: ${error instanceof Error ? error.message : 'Unknown error'}`
					);
				}
			}
		},
		[salesId, addAdmissionToRegistry, admissionStudents]
	);

	// Delete admission student
	const deleteAdmissionStudent = useCallback(async (studentId: number) => {
		try {
			setError(null);

			// Delete from database
			const { error } = await supabase.from('admission_students').delete().eq('id', studentId);

			if (error) throw error;

			console.debug('Successfully deleted admission student with ID:', studentId);

			// Remove from local state
			setAdmissionStudents((prev) => prev.filter((student) => student.id !== studentId));
		} catch (error) {
			console.error('Error deleting admission student:', error);
			setError(
				`Failed to delete admission student: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}, []);

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

			console.debug('Successfully removed student:', lastAddedStudent.name);

			// Update local state - remove the student
			setDateData((prev) => ({
				...prev,
				[selectedDate]: {
					...currentData,
					// Students now managed through admission system - no need to filter locally
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

			console.debug('Successfully removed from queue:', lastQueueEntry.name);

			// Update local state - remove from queue
			setDateData((prev) => ({
				...prev,
				[selectedDate]: {
					...currentData,
					waitingQueue: currentData.waitingQueue.filter((q) => q.studentId !== lastQueueEntry.studentId),
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
	const handleLogin = useCallback(
		async (
			role: 'receptionist' | 'professor' | 'superadmin' | 'sales' | 'administration' | 'test_manager',
			profId?: number,
			salesId?: number
		) => {
			setIsLoggedIn(true);
			setUserRole(role);

			// Persist to localStorage
			localStorage.setItem('isLoggedIn', 'true');
			localStorage.setItem('userRole', role);

			if (role === 'professor' && profId) {
				setProfessorId(profId);
				localStorage.setItem('professorId', profId.toString());
				localStorage.removeItem('salesId');
				setCurrentView('students'); // Professor can view dashboard

				// Professor login - status management removed, all professors stay available
			} else if (role === 'sales' && salesId) {
				setSalesId(salesId);
				localStorage.setItem('salesId', salesId.toString());
				localStorage.removeItem('professorId');
				setCurrentView('sales'); // Sales goes directly to admissions
				console.debug('Sales user logged in with ID:', salesId);
			} else if (role === 'administration') {
				localStorage.removeItem('professorId');
				localStorage.removeItem('salesId');
				setCurrentView('administration'); // Administration goes to administration view
				console.debug('Administration user logged in');
			} else if (role === 'test_manager') {
				localStorage.removeItem('professorId');
				localStorage.removeItem('salesId');
				setCurrentView('students'); // Test manager starts with dashboard view
				console.debug('Test manager logged in');
			} else {
				localStorage.removeItem('professorId');
				localStorage.removeItem('salesId');
				setCurrentView('students');
			}
		},
		[selectedDate, loadDateData]
	);

	// Handle logout
	const handleLogout = useCallback(async () => {
		// Professor logout - status management removed, all professors stay available

		setIsLoggedIn(false);
		setUserRole(null);
		setProfessorId(null);
		setSalesId(null);
		setCurrentView('students');

		// Clear localStorage
		localStorage.removeItem('isLoggedIn');
		localStorage.removeItem('userRole');
		localStorage.removeItem('professorId');
		localStorage.removeItem('salesId');
	}, [userRole, professorId, selectedDate]);

	// Remove student from queue
	const removeFromQueue = useCallback(
		async (queueEntry: QueueEntry) => {
			try {
				setError(null);

				// Delete from database
				const { error } = await supabase
					.from('interview_queue')
					.delete()
					.eq('student_id', queueEntry.studentId)
					.eq('interview_date', selectedDate);

				if (error) throw error;

				console.debug('Successfully removed from queue:', queueEntry.name);

				// Update local state - remove from queue
				setDateData((prev) => ({
					...prev,
					[selectedDate]: {
						...currentData,
						waitingQueue: currentData.waitingQueue.filter((q) => q.studentId !== queueEntry.studentId),
					},
				}));
			} catch (error) {
				console.error('Error removing from queue:', error);
				setError(`Failed to remove from queue: ${error instanceof Error ? error.message : 'Unknown error'}`);
			}
		},
		[currentData, selectedDate]
	);

	// Reorder queue items via drag and drop
	const reorderQueue = useCallback(
		async (dragIndex: number, dropIndex: number) => {
			if (dragIndex === dropIndex) return;

			try {
				setError(null);

				// Create a copy of the current queue
				const newQueue = [...currentData.waitingQueue];

				// Remove the dragged item and insert it at the new position
				const [draggedItem] = newQueue.splice(dragIndex, 1);
				newQueue.splice(dropIndex, 0, draggedItem);

				// Update queue numbers to match new positions
				const updatedQueue = newQueue.map((item, index) => ({
					...item,
					queueNumber: index + 1,
				}));

				// Update local state immediately for responsive UI
				setDateData((prev) => ({
					...prev,
					[selectedDate]: {
						...currentData,
						waitingQueue: updatedQueue,
					},
				}));

				// Update database with new queue order
				const updatePromises = updatedQueue.map((item) =>
					supabase
						.from('interview_queue')
						.update({ queue_number: item.queueNumber })
						.eq('student_id', item.studentId)
						.eq('interview_date', selectedDate)
				);

				await Promise.all(updatePromises);
				console.debug('Queue reordered successfully');
			} catch (error) {
				console.error('Error reordering queue:', error);
				setError(`Failed to reorder queue: ${error instanceof Error ? error.message : 'Unknown error'}`);
				// Reload data to revert changes on error
				loadDateData();
			}
		},
		[currentData, selectedDate, loadDateData]
	);

	// Drag and drop handlers using dnd-kit
	const handleDragStart = useCallback((event: DragStartEvent) => {
		console.debug('Drag start:', event.active.id);
	}, []);

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event;
			console.debug('Drag end:', active?.id, '->', over?.id);

			if (over && active.id !== over.id) {
				const oldIndex = currentData.waitingQueue.findIndex(
					(item) => `queue-${item.studentId}-${item.queueNumber}` === active.id
				);
				const newIndex = currentData.waitingQueue.findIndex(
					(item) => `queue-${item.studentId}-${item.queueNumber}` === over.id
				);

				if (oldIndex !== -1 && newIndex !== -1) {
					reorderQueue(oldIndex, newIndex);
				}
			}
		},
		[currentData.waitingQueue, reorderQueue]
	);

	// Sortable Queue Item Component
	const SortableQueueItem = ({
		student,
		index,
		availableProfessors,
		isReadOnly,
	}: {
		student: QueueEntry;
		index: number;
		availableProfessors: Professor[];
		isReadOnly: boolean;
	}) => {
		const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
			id: `queue-${student.studentId}-${student.queueNumber}`,
		});

		const style = {
			transform: CSS.Transform.toString(transform),
			transition,
			opacity: isDragging ? 0.8 : 1,
		};

		return (
			<div
				ref={setNodeRef}
				style={style}
				className={`relative border rounded-lg p-4 transition-all duration-200 ${
					isDragging ? 'shadow-lg z-50' : 'hover:shadow-md'
				} bg-white`}>
				{/* Drag Handle */}
				{!isReadOnly && (
					<div
						{...attributes}
						{...listeners}
						className='absolute left-2 top-4 text-gray-400 cursor-grab active:cursor-grabbing hover:text-gray-600'>
						<GripVertical className='h-4 w-4' />
					</div>
				)}

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
										disabled={isLoading}
										className='bg-green-600 hover:bg-green-700 text-white transition-colors duration-200'>
										Send to {professor.room}
									</Button>
								))}
							</div>
						</div>
					) : (
						<div className='space-y-2'>
							<p className='text-sm font-medium text-amber-700'>Waiting for Available Professor</p>
							<p className='text-xs text-muted-foreground'>
								Student will be called when a professor becomes available
							</p>
						</div>
					)}

					{!isReadOnly && (
						<div className='mt-3 pt-3 border-t flex justify-end'>
							<Button
								onClick={() => removeFromQueue(student)}
								size='sm'
								variant='outline'
								disabled={isLoading}
								className='border-red-300 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-200'>
								<Trash2 className='h-4 w-4 mr-1' />
								Remove from Queue
							</Button>
						</div>
					)}
				</div>
			</div>
		);
	};

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

				console.debug('Successfully deleted student:', student.name);

				// Update local state
				setDateData((prev) => ({
					...prev,
					[selectedDate]: {
						...currentData,
						// Students now managed through admission system - no need to filter locally
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

	// Edit student - update student information
	const editStudent = useCallback(
		async (oldStudent: Student, newStudent: Student) => {
			try {
				setError(null);

				// Update in database
				const { error } = await supabase
					.from('students')
					.update({
						name: newStudent.name,
						student_id: newStudent.studentId,
					})
					.eq('student_id', oldStudent.studentId)
					.eq('interview_date', selectedDate);

				if (error) throw error;

				// Update in interview_queue if student is in queue
				const { error: queueError } = await supabase
					.from('interview_queue')
					.update({
						name: newStudent.name,
						student_id: newStudent.studentId,
					})
					.eq('student_id', oldStudent.studentId)
					.eq('interview_date', selectedDate);

				if (queueError) console.warn('Queue update error:', queueError);

				// Update in completed_interviews if student has completed interviews
				const { error: completedError } = await supabase
					.from('completed_interviews')
					.update({
						name: newStudent.name,
						student_id: newStudent.studentId,
					})
					.eq('student_id', oldStudent.studentId)
					.eq('interview_date', selectedDate);

				if (completedError) console.warn('Completed interviews update error:', completedError);

				console.debug('Successfully updated student:', oldStudent.name, 'to', newStudent.name);

				// Update local state
				setDateData((prev) => ({
					...prev,
					[selectedDate]: {
						...currentData,
						// Students now managed through admission system - no need to map locally
						waitingQueue: currentData.waitingQueue.map((q: QueueEntry) =>
							q.studentId === oldStudent.studentId
								? { ...q, name: newStudent.name, studentId: newStudent.studentId }
								: q
						),
						completedInterviews: currentData.completedInterviews.map((c: CompletedInterview) =>
							c.studentId === oldStudent.studentId
								? { ...c, name: newStudent.name, studentId: newStudent.studentId }
								: c
						),
					},
				}));
			} catch (error) {
				console.error('Error updating student:', error);
				setError(`Failed to update student: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
				case 'offline':
					return 'border-gray-300 bg-gray-100';
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
					case 'offline':
						return 'outline';
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

	// Handle interview evaluation
	const handleStartInterview = useCallback((student: AdmissionStudent) => {
		setCurrentInterviewStudent(student);
		setShowInterviewForm(true);
	}, []);

	const handleSaveInterviewEvaluation = useCallback(async (evaluation: InterviewEvaluation) => {
		try {
			setError(null);

			// Save evaluation to Supabase
			const { error } = await supabase.from('interview_evaluations').insert({
				student_id: evaluation.studentId,
				professor_id: evaluation.professorId,
				situation_etudes: evaluation.situationEtudes,
				motivation_domaine: evaluation.motivationDomaine,
				motivation_domaine_comment: evaluation.motivationDomaineComment,
				motivation_ifag: evaluation.motivationIFAG,
				motivation_ifag_comment: evaluation.motivationIFAGComment,
				projet_etudes: evaluation.projetEtudes,
				projet_etudes_comment: evaluation.projetEtudesComment,
				projet_professionnel: evaluation.projetProfessionnel,
				projet_professionnel_comment: evaluation.projetProfessionnelComment,
				aisance_verbale: evaluation.aisanceVerbale,
				aisance_verbale_comment: evaluation.aisanceVerbaleComment,
				interaction_jury: evaluation.interactionJury,
				interaction_jury_comment: evaluation.interactionJuryComment,
				culture_generale: evaluation.cultureGenerale,
				culture_generale_comment: evaluation.cultureGeneraleComment,
				decision_jury: evaluation.decisionJury,
				commentaire_global: evaluation.commentaireGlobal,
				membre_jury: evaluation.membreJury,
				date_evaluation: evaluation.dateEvaluation.toISOString(),
				created_at: new Date().toISOString(),
			});

			if (error) throw error;

			console.debug('Interview evaluation saved successfully');

			// Mark this student's evaluation as completed immediately
			const evaluationKey = `${evaluation.studentId}-${evaluation.professorId}`;
			setCompletedEvaluations((prev) => {
				const newSet = new Set(prev);
				newSet.add(evaluationKey);
				console.debug('Added evaluation key:', evaluationKey);
				return newSet;
			});

			// Close the form
			setShowInterviewForm(false);
			setCurrentInterviewStudent(null);

			// Show success message
			alert("Évaluation sauvegardée avec succès! Vous pouvez maintenant terminer l'entretien.");

			// Trigger data refresh to ensure everything is in sync - without overwriting local state
			setTimeout(() => {
				loadDateData();
			}, 500);
		} catch (error) {
			console.error('Error saving interview evaluation:', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			setError(`Failed to save evaluation: ${errorMessage}`);
			alert(`Erreur lors de la sauvegarde de l'évaluation: ${errorMessage}. Veuillez réessayer.`);
		}
	}, []);

	const StudentsView = () => {
		const readOnlyRoles: Array<'professor' | 'sales' | 'test_manager'> = [
			'professor',
			'sales',
			'test_manager',
		];
		const isReadOnly = userRole
			? readOnlyRoles.includes(userRole as 'professor' | 'sales' | 'test_manager')
			: false;

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
									<p className='text-2xl font-bold text-blue-600'>{getRegisteredStudents().length}</p>
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
									<p className='text-2xl font-bold text-green-600'>
										{currentData.completedInterviews.length}
									</p>
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
								students={getRegisteredStudents()}
								waitingQueue={currentData.waitingQueue}
								completedInterviews={currentData.completedInterviews}
								professors={currentData.professors}
								onAddToQueue={isReadOnly ? () => {} : addStudentToQueue}
								onDeleteStudent={
									isReadOnly || (userRole !== 'superadmin' && userRole !== 'administration')
										? () => {}
										: (student) => setDeleteModal({ show: true, student })
								}
								onEditStudent={isReadOnly ? undefined : editStudent}
								isLoading={isLoading}
								readOnly={isReadOnly}
								userRole={userRole ?? 'guest'}
							/>
							{userRole === 'superadmin' && (
								<StudentForm onAddStudent={handleAddStudent} disabled={isLoading} />
							)}
						</div>
					</div>
					{/* Queue Management */}
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
								{currentData.waitingQueue.length === 0 ? (
									<div className='text-center py-8'>
										<Clock className='h-12 w-12 text-muted-foreground mx-auto mb-3' />
										<p className='text-muted-foreground'>Queue is Empty</p>
										<p className='text-sm text-muted-foreground mt-1'>
											Add students from the registry to get started
										</p>
									</div>
								) : (
									<DndContext
										sensors={sensors}
										collisionDetection={closestCenter}
										onDragStart={handleDragStart}
										onDragEnd={handleDragEnd}>
										<SortableContext
											items={currentData.waitingQueue.map(
												(item) => `queue-${item.studentId}-${item.queueNumber}`
											)}
											strategy={verticalListSortingStrategy}>
											<div className='space-y-3'>
												{currentData.waitingQueue.map((student: QueueEntry, index: number) => (
													<SortableQueueItem
														key={`queue-${student.studentId}-${student.queueNumber}`}
														student={student}
														index={index}
														availableProfessors={availableProfessors}
														isReadOnly={isReadOnly}
													/>
												))}
											</div>
										</SortableContext>
									</DndContext>
								)}
							</CardContent>
						</Card>
					</div>
					{/* Room Status */} {/* Room Status */}
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
									{currentData.professors.map((professor: Professor) => {
										// Show actual professor status from database
										const displayStatus: Professor['status'] = professor.status;

										// Calculate daily interview stats for this professor
										const today = new Date().toDateString();
										const todayInterviews = currentData.completedInterviews.filter(
											(interview) =>
												interview.professorName === professor.name &&
												interview.completedTime.toDateString() === today
										);
										const totalCompleted = todayInterviews.length;
										const totalDuration = todayInterviews.reduce(
											(sum, interview) => sum + interview.interviewDuration,
											0
										);
										const avgDuration = totalCompleted > 0 ? Math.round(totalDuration / totalCompleted) : 0;

										return (
											<div
												key={professor.id}
												className={`border rounded-lg p-4 transition-all duration-200 ${getStatusColor(
													displayStatus
												)}`}>
												<div className='flex justify-between items-start mb-2'>
													<div>
														<p className='font-medium'>{professor.name}</p>
														<p className='text-sm text-muted-foreground'>{professor.room}</p>
														{professor.id === professorId && (
															<p className='text-xs text-green-600 font-medium'>● Currently Logged In</p>
														)}
													</div>
													<Badge variant={getStatusVariant(displayStatus)}>
														{displayStatus === 'offline' ? 'offline' : displayStatus}
													</Badge>
												</div>
												{professor.currentStudent && (
													<div className='space-y-2'>
														<p className='text-sm mb-1'>
															Interviewing: #{professor.currentStudent.queueNumber} -{' '}
															{professor.currentStudent.name}
														</p>
														{professor.interviewStartTime && (
															<p className='text-xs text-muted-foreground'>
																Started: {professor.interviewStartTime.toLocaleTimeString()}
															</p>
														)}
														{(userRole === 'superadmin' ||
															userRole === 'receptionist' ||
															userRole === 'administration') && (
															<Button
																onClick={() => revertStudentToQueue(professor.id)}
																variant='outline'
																size='sm'
																className='text-xs h-7 px-2 border-orange-300 text-orange-700 hover:bg-orange-50'>
																<RefreshCw className='h-3 w-3 mr-1' />
																Revert
															</Button>
														)}
													</div>
												)}

												{/* Daily Interview Stats */}
												<div className='mt-3 pt-2 border-t border-gray-200'>
													<div className='flex justify-between text-xs text-muted-foreground'>
														<span>Today: {totalCompleted} interviews</span>
														{totalCompleted > 0 && <span>Avg: {avgDuration}min</span>}
													</div>
													{totalCompleted > 0 && (
														<div className='text-xs text-muted-foreground mt-1'>
															Total time: {Math.round(totalDuration / 60)}h {totalDuration % 60}min
														</div>
													)}
												</div>

												{displayStatus === 'offline' && !professor.currentStudent && (
													<p className='text-xs text-muted-foreground'>Professor not logged in</p>
												)}
											</div>
										);
									})}
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
						<CardTitle className='flex items-center justify-between'>
							<span>{professor?.name}</span>
							{isReadOnly && (
								<div className='flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full'>
									<Eye className='h-4 w-4' />
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
												<div className='space-y-3'>
													{(() => {
														// Check if evaluation has been completed for this student
														const currentStudentAdmission = admissionStudents.find(
															(s) =>
																s.nom && s.prenom && `${s.nom} ${s.prenom}` === professor.currentStudent?.name
														);
														const evaluationKey = currentStudentAdmission?.id
															? `${currentStudentAdmission.id}-${professorId}`
															: null;
														const hasCompletedEvaluation = evaluationKey
															? completedEvaluations.has(evaluationKey)
															: false;
														// Debug: Check evaluation status
														console.debug(
															`Prof ${professorId} - Student: ${professor.currentStudent?.name}, AdmissionID: ${currentStudentAdmission?.id}, EvalKey: ${evaluationKey}, HasCompleted: ${hasCompletedEvaluation}`
														);

														if (!hasCompletedEvaluation) {
															// Show evaluation button if evaluation not completed
															return (
																<div className='space-y-3'>
																	<Button
																		onClick={async () => {
																			console.debug('Looking for student:', professor.currentStudent?.name);

																			// If no admission students loaded, try to reload them
																			if (admissionStudents.length === 0) {
																				console.debug('No admission students loaded, reloading...');
																				try {
																					await loadAdmissionStudents();
																				} catch (error) {
																					console.error('Failed to reload admission students:', error);
																					alert('Failed to load student data. Please try again.');
																					return;
																				}
																			}

																			// Find the admission student that matches the current student
																			// Try multiple matching strategies
																			let admissionStudent = admissionStudents.find(
																				(s) =>
																					s.nom &&
																					s.prenom &&
																					`${s.nom} ${s.prenom}` === professor.currentStudent?.name
																			);

																			// If exact match fails, try case-insensitive match
																			if (!admissionStudent) {
																				admissionStudent = admissionStudents.find(
																					(s) =>
																						s.nom &&
																						s.prenom &&
																						`${s.nom} ${s.prenom}`.toLowerCase() ===
																							professor.currentStudent?.name?.toLowerCase()
																				);
																			}

																			// If still no match, try matching by studentId (last resort)
																			if (!admissionStudent && professor.currentStudent?.studentId) {
																				admissionStudent = admissionStudents.find(
																					(s) =>
																						s.nom &&
																						s.prenom &&
																						`${s.nom?.toLowerCase()}.${s.prenom?.toLowerCase()}` ===
																							professor.currentStudent?.studentId
																				);
																			}

																			// If still no match, try partial name matching
																			if (!admissionStudent && professor.currentStudent?.name) {
																				const currentName = professor.currentStudent.name.toLowerCase();
																				admissionStudent = admissionStudents.find(
																					(s) =>
																						s.nom &&
																						s.prenom &&
																						currentName.includes(s.nom.toLowerCase()) &&
																						currentName.includes(s.prenom.toLowerCase())
																				);
																			}

																			if (admissionStudent) {
																				console.debug(
																					'Found matching student:',
																					admissionStudent.nom,
																					admissionStudent.prenom
																				);
																				handleStartInterview(admissionStudent);
																			} else {
																				console.error('No matching student found');
																				console.debug('Current student details:', professor.currentStudent);
																				alert(
																					`Student data not found in admission system.\n\nLooking for: "${
																						professor.currentStudent?.name
																					}" or "${
																						professor.currentStudent?.studentId
																					}"\n\nAvailable students: ${admissionStudents
																						.map((s) => `${s.nom} ${s.prenom}`)
																						.join(', ')}`
																				);
																			}
																		}}
																		className='w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200'>
																		<GraduationCap className='h-4 w-4 mr-2' />
																		Evaluate Student
																	</Button>
																	{userRole &&
																		['superadmin', 'receptionist', 'administration'].includes(userRole) && (
																			<Button
																				onClick={() => revertStudentToQueue(professorId)}
																				variant='outline'
																				className='w-full border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400'>
																				<RefreshCw className='h-4 w-4 mr-2' />
																				Revert to Queue
																			</Button>
																		)}
																</div>
															);
														} else {
															// Show completion message and complete interview button
															return (
																<div className='space-y-3'>
																	<div className='p-4 bg-green-50 border border-green-200 rounded-lg'>
																		<div className='flex items-center'>
																			<CheckCircle className='h-5 w-5 text-green-600 mr-2' />
																			<span className='text-green-800 font-medium'>Évaluation terminée</span>
																		</div>
																		<p className='text-green-700 text-sm mt-1'>
																			L'évaluation de cet étudiant est maintenant terminée.
																		</p>
																	</div>
																	<Button
																		onClick={() => completeInterview(professorId)}
																		className='w-full bg-green-600 hover:bg-green-700 text-white transition-colors duration-200'>
																		<CheckCircle className='h-4 w-4 mr-2' />
																		Complete Interview
																	</Button>
																	{userRole &&
																		['superadmin', 'receptionist', 'administration'].includes(userRole) && (
																			<Button
																				onClick={() => revertStudentToQueue(professorId)}
																				variant='outline'
																				className='w-full border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400'>
																				<RefreshCw className='h-4 w-4 mr-2' />
																				Revert to Queue
																			</Button>
																		)}
																</div>
															);
														}
													})()}
												</div>
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
								.map((prof: Professor) => {
									// Show actual professor status from database
									const displayStatus: Professor['status'] = prof.status;

									// Calculate daily interview stats for this professor
									const today = new Date().toDateString();
									const todayInterviews = currentData.completedInterviews.filter(
										(interview) =>
											interview.professorName === prof.name &&
											interview.completedTime.toDateString() === today
									);
									const totalCompleted = todayInterviews.length;
									const totalDuration = todayInterviews.reduce(
										(sum, interview) => sum + interview.interviewDuration,
										0
									);
									const avgDuration = totalCompleted > 0 ? Math.round(totalDuration / totalCompleted) : 0;

									return (
										<div
											key={prof.id}
											className={`border rounded-lg p-4 transition-all duration-200 ${getStatusColor(
												displayStatus
											)}`}>
											<div className='flex justify-between items-start mb-2'>
												<div>
													<p className='font-medium'>{prof.name}</p>
													<p className='text-sm text-muted-foreground'>{prof.room}</p>
												</div>
												<Badge variant={getStatusVariant(displayStatus)}>
													{displayStatus === 'offline' ? 'offline' : displayStatus}
												</Badge>
											</div>
											{prof.currentStudent && (
												<div className='space-y-2'>
													<p className='text-sm mb-1'>
														Interviewing: #{prof.currentStudent.queueNumber} - {prof.currentStudent.name}
													</p>
													{prof.interviewStartTime && (
														<p className='text-xs text-muted-foreground'>
															Started: {prof.interviewStartTime.toLocaleTimeString()}
														</p>
													)}
													{(userRole === 'superadmin' ||
														userRole === 'receptionist' ||
														userRole === 'administration') && (
														<Button
															onClick={() => revertStudentToQueue(prof.id)}
															variant='outline'
															size='sm'
															className='text-xs h-7 px-2 border-orange-300 text-orange-700 hover:bg-orange-50'>
															<RefreshCw className='h-3 w-3 mr-1' />
															Revert
														</Button>
													)}
												</div>
											)}

											{/* Daily Interview Stats */}
											<div className='mt-3 pt-2 border-t border-gray-200'>
												<div className='flex justify-between text-xs text-muted-foreground'>
													<span>Today: {totalCompleted} interviews</span>
													{totalCompleted > 0 && <span>Avg: {avgDuration}min</span>}
												</div>
												{totalCompleted > 0 && (
													<div className='text-xs text-muted-foreground mt-1'>
														Total time: {Math.round(totalDuration / 60)}h {totalDuration % 60}min
													</div>
												)}
											</div>

											{displayStatus === 'offline' && !prof.currentStudent && (
												<p className='text-xs text-muted-foreground'>Professor not logged in</p>
											)}
										</div>
									);
								})}
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
									{userRole === 'professor' &&
										` - Professor (${
											currentData.professors.find((p) => p.id === professorId)?.name || 'View Only'
										})`}
									{userRole === 'sales' && ` - Sales (ID: ${salesId})`}
									{userRole === 'administration' && ' - Administration'}
								</p>
							</div>
						</div>

						{/* Controls */}
						<div className='flex flex-col sm:flex-row items-start sm:items-center gap-4'>
							{/* Hide date picker when superadmin or administration is on admission part */}
							{!(userRole === 'superadmin' && currentView === 'sales') && userRole !== 'administration' && (
								<div className='flex items-center gap-3'>
									<CalendarComponent value={selectedDate} onChange={setSelectedDate} className='w-64' />
									<Button
										variant='outline'
										size='sm'
										onClick={() => loadDateData()}
										disabled={isLoading}
										className='hover:bg-gray-50 transition-colors duration-200'>
										<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
									</Button>
									{userRole === 'receptionist' && (
										<div className='relative'>
											<Button
												variant='outline'
												size='sm'
												onClick={async () => {
													if (notificationPermission === 'default') {
														if ('Notification' in window) {
															const permission = await Notification.requestPermission();
															setNotificationPermission(permission);
														}
													} else if (notificationPermission === 'granted') {
														// Test notification sound
														if (audioContext) {
															const oscillator1 = audioContext.createOscillator();
															const oscillator2 = audioContext.createOscillator();
															const gainNode = audioContext.createGain();
															oscillator1.type = 'sine';
															oscillator1.frequency.setValueAtTime(800, audioContext.currentTime);
															oscillator1.connect(gainNode);
															oscillator2.type = 'sine';
															oscillator2.frequency.setValueAtTime(1000, audioContext.currentTime);
															oscillator2.connect(gainNode);
															gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
															gainNode.gain.exponentialRampToValueAtTime(
																0.01,
																audioContext.currentTime + 0.3
															);
															gainNode.connect(audioContext.destination);
															oscillator1.start();
															oscillator2.start(audioContext.currentTime + 0.15);
															oscillator1.stop(audioContext.currentTime + 0.15);
															oscillator2.stop(audioContext.currentTime + 0.3);
														}
													} else {
														alert(
															'Notifications sont bloquées. Veuillez activer les notifications dans les paramètres du navigateur.'
														);
													}
												}}
												className={`hover:bg-gray-50 transition-colors duration-200 ${
													notificationPermission === 'granted'
														? 'text-green-600 border-green-300'
														: notificationPermission === 'denied'
														? 'text-red-600 border-red-300'
														: ''
												}`}>
												<Bell
													className={`h-4 w-4 ${notificationPermission === 'granted' ? 'fill-current' : ''}`}
												/>
											</Button>
											<div className='absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap'>
												{notificationPermission === 'granted'
													? 'Test son'
													: notificationPermission === 'denied'
													? 'Bloqué'
													: 'Activer'}
											</div>
										</div>
									)}
								</div>
							)}

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
								{userRole === 'administration' ? (
									<Button
										onClick={() => setCurrentView('administration')}
										variant={currentView === 'administration' ? 'default' : 'outline'}
										size='sm'
										className={
											currentView === 'administration'
												? 'bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200'
												: 'border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200'
										}>
										<Building className='h-4 w-4 mr-2' />
										Administration
									</Button>
								) : userRole === 'test_manager' ? (
									<>
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
										<Button
											onClick={() => setCurrentView('test-management')}
											variant={currentView === 'test-management' ? 'default' : 'outline'}
											size='sm'
											className={
												currentView === 'test-management'
													? 'bg-orange-600 hover:bg-orange-700 text-white transition-colors duration-200'
													: 'border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 transition-all duration-200'
											}>
											<Timer className='h-4 w-4 mr-2' />
											Test Management
										</Button>
									</>
								) : (
									<>
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
										{userRole === 'superadmin' &&
											currentData.professors.map((professor: Professor) => (
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
												My Room ({currentData.professors.find((p) => p.id === professorId)?.room})
											</Button>
										)}
										{userRole === 'sales' && (
											<Button
												onClick={() => setCurrentView('sales')}
												variant={currentView === 'sales' ? 'default' : 'outline'}
												size='sm'
												className={
													currentView === 'sales'
														? 'bg-green-600 hover:bg-green-700 text-white transition-colors duration-200'
														: 'border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400 transition-all duration-200'
												}>
												<Users className='h-4 w-4 mr-2' />
												Admissions
											</Button>
										)}
										{userRole === 'superadmin' && (
											<Button
												onClick={() => setCurrentView('sales')}
												variant={currentView === 'sales' ? 'default' : 'outline'}
												size='sm'
												className={
													currentView === 'sales'
														? 'bg-purple-600 hover:bg-purple-700 text-white transition-colors duration-200'
														: 'border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 transition-all duration-200'
												}>
												<Users className='h-4 w-4 mr-2' />
												All Admissions
											</Button>
										)}
										{userRole &&
											['sales', 'superadmin', 'receptionist', 'test_manager'].includes(userRole) && (
												<Button
													onClick={() => setCurrentView('test-management')}
													variant={currentView === 'test-management' ? 'default' : 'outline'}
													size='sm'
													className={
														currentView === 'test-management'
															? 'bg-orange-600 hover:bg-orange-700 text-white transition-colors duration-200'
															: 'border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 transition-all duration-200'
													}>
													<Timer className='h-4 w-4 mr-2' />
													Test Management
												</Button>
											)}
									</>
								)}
								<Button onClick={handleLogout} variant='outline' size='sm' className='ml-4'>
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
						{currentView === 'sales' && (
							<StudentAdmissionForm
								userRole={userRole as 'sales' | 'superadmin'}
								salesPersonId={salesId ?? undefined}
								students={admissionStudents}
								onSaveStudent={saveAdmissionStudent}
								onUpdateStudent={updateAdmissionStudent}
								onDeleteStudent={deleteAdmissionStudent}
								onAddToRegistry={addAdmissionToRegistry}
							/>
						)}
						{currentView === 'administration' && <AdministrationView students={admissionStudents} />}
						{currentView === 'test-management' && (
							<TestManagement
								students={admissionStudents}
								onUpdateStudent={updateAdmissionStudent}
								selectedDate={selectedDate}
								interviewData={{
									waitingQueue: currentData.waitingQueue,
									completedInterviews: currentData.completedInterviews,
									professors: currentData.professors,
								}}
								userRole={userRole ?? undefined}
							/>
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

			{/* Undo Toast Notifications */}
			{showUndoToast && lastAddedStudent && (
				<div className='fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50'>
					<span>
						Added <strong>{lastAddedStudent.name}</strong> to registry
					</span>
					<Button
						onClick={undoAddStudent}
						variant='ghost'
						size='sm'
						className='text-white hover:bg-gray-700 px-2'>
						Undo
					</Button>
					<Button
						onClick={() => setShowUndoToast(false)}
						variant='ghost'
						size='sm'
						className='text-white hover:bg-gray-700 px-1'>
						<X className='h-4 w-4' />
					</Button>
				</div>
			)}

			{/* Queue Undo Toast Notification */}
			{showQueueUndoToast && lastQueueEntry && (
				<div className='fixed bottom-4 right-4 bg-blue-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50'>
					<span>
						Added <strong>{lastQueueEntry.name}</strong> to interview queue
					</span>
					<Button
						onClick={undoQueueEntry}
						variant='ghost'
						size='sm'
						className='text-white hover:bg-blue-700 px-2'>
						Undo
					</Button>
					<Button
						onClick={() => setShowQueueUndoToast(false)}
						variant='ghost'
						size='sm'
						className='text-white hover:bg-blue-700 px-1'>
						<X className='h-4 w-4' />
					</Button>
				</div>
			)}

			{/* Professor Interview Evaluation Form */}
			{showInterviewForm && currentInterviewStudent && professorId && (
				<ProfessorInterviewForm
					student={currentInterviewStudent}
					professorId={professorId}
					onSave={handleSaveInterviewEvaluation}
					onClose={() => {
						setShowInterviewForm(false);
						setCurrentInterviewStudent(null);
					}}
					isVisible={showInterviewForm}
				/>
			)}
		</div>
	);
};

export default InterviewQueueSystem;
