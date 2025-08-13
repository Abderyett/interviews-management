import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Clock, Play, RotateCcw, Timer, User, CheckCircle, AlertCircle, Users, Eye, UserCheck, Search, UserMinus, UserX, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

// AdmissionStudent interface - this should match the one in InterviewManagement.tsx
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
	licenceSpecialite?: string;
	university?: string;
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
	// Test-related fields
	testStartTime?: string;
	testEndTime?: string;
	testStatus?: 'not_started' | 'in_progress' | 'completed' | 'absent';
	testDuration?: number;
	// Presence tracking
	presenceStatus?: 'not_checked' | 'present' | 'absent' | 'late';
	presenceCheckedAt?: string;
	presenceCheckedBy?: string;
	// Interview status fields
	interviewStatus?: 'not_registered' | 'in_queue' | 'interviewing' | 'completed';
	interviewQueueNumber?: number;
	interviewCompletedTime?: string;
	// Helper properties for interview system
	studentId?: string;
	name?: string;
	studentRegistryId?: string;
}

interface QueueEntry {
	studentId: string;
	name: string;
	queueNumber: number;
	arrivalTime: Date;
	status: 'waiting' | 'in-progress' | 'completed';
	assignedRoom: string | null;
}

interface TestCompletedInterview {
	studentId: string;
	name: string;
	queueNumber: number;
	arrivalTime: Date;
	status: 'waiting' | 'in-progress' | 'completed';
	assignedRoom: string | null;
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

interface InterviewData {
	waitingQueue: QueueEntry[];
	completedInterviews: TestCompletedInterview[];
	professors: Professor[];
}

interface TestManagementProps {
	students: AdmissionStudent[];
	onUpdateStudent: (student: AdmissionStudent) => Promise<void>;
	selectedDate: string;
	interviewData: InterviewData;
	userRole?: string;
	onDateChange?: (date: string) => void;
}

const TestManagement: React.FC<TestManagementProps> = ({
	students,
	onUpdateStudent,
	selectedDate,
	interviewData: _interviewData, // Acknowledge parameter but don't use it
	userRole,
	onDateChange
}) => {
	const [currentTime, setCurrentTime] = useState(new Date());
	const [searchTerm, setSearchTerm] = useState('');
	const [localSelectedDate, setLocalSelectedDate] = useState(selectedDate);

	// Update current time every second
	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentTime(new Date());
		}, 1000);
		return () => clearInterval(interval);
	}, []);

	// Handle date change
	const handleDateChange = useCallback((newDate: string) => {
		setLocalSelectedDate(newDate);
		if (onDateChange) {
			onDateChange(newDate);
		}
	}, [onDateChange]);

	// Update local date when prop changes
	useEffect(() => {
		setLocalSelectedDate(selectedDate);
	}, [selectedDate]);

	// Date navigation helpers
	const goToPreviousDay = useCallback(() => {
		const currentDate = new Date(localSelectedDate);
		currentDate.setDate(currentDate.getDate() - 1);
		handleDateChange(currentDate.toISOString().split('T')[0]);
	}, [localSelectedDate, handleDateChange]);

	const goToNextDay = useCallback(() => {
		const currentDate = new Date(localSelectedDate);
		currentDate.setDate(currentDate.getDate() + 1);
		handleDateChange(currentDate.toISOString().split('T')[0]);
	}, [localSelectedDate, handleDateChange]);

	const goToToday = useCallback(() => {
		const today = new Date().toISOString().split('T')[0];
		handleDateChange(today);
	}, [handleDateChange]);

	// Add keyboard shortcuts for search and date navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Search shortcut (Ctrl/Cmd + F)
			if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
				e.preventDefault();
				const searchInput = document.querySelector('#test-search-input') as HTMLInputElement;
				if (searchInput) {
					searchInput.focus();
					searchInput.select();
				}
				return;
			}
			
			// Date navigation shortcuts (only if no input is focused)
			const activeElement = document.activeElement;
			const isInputFocused = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';
			
			if (!isInputFocused) {
				// Left arrow or 'h' for previous day
				if (e.key === 'ArrowLeft' || e.key === 'h') {
					e.preventDefault();
					goToPreviousDay();
				}
				// Right arrow or 'l' for next day
				else if (e.key === 'ArrowRight' || e.key === 'l') {
					e.preventDefault();
					goToNextDay();
				}
				// 't' for today
				else if (e.key === 't') {
					e.preventDefault();
					goToToday();
				}
			}
			
			// Escape to clear search (works always)
			if (e.key === 'Escape' && searchTerm) {
				setSearchTerm('');
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [searchTerm, goToPreviousDay, goToNextDay, goToToday]);

	// Filter students who need tests for selected date and match search term
	const testStudents = useMemo(() => {
		const baseFilteredStudents = students.filter(student => 
			student.testRequired && 
			student.interviewDate === localSelectedDate
		);

		if (!searchTerm.trim()) {
			return baseFilteredStudents;
		}

		const searchLower = searchTerm.toLowerCase().trim();
		return baseFilteredStudents.filter(student => 
			student.nom.toLowerCase().includes(searchLower) ||
			student.prenom.toLowerCase().includes(searchLower) ||
			`${student.nom} ${student.prenom}`.toLowerCase().includes(searchLower) ||
			student.mobile.includes(searchTerm.trim()) ||
			student.specialite.toLowerCase().includes(searchLower) ||
			student.bacType.toLowerCase().includes(searchLower)
		);
	}, [students, localSelectedDate, searchTerm]);

	// Determine interview status for a student (using stored database status)
	const getInterviewStatus = useCallback((student: AdmissionStudent) => {
		// Use the stored interview status from the database
		const status = student.interviewStatus || 'not_registered';
		
		switch (status) {
			case 'interviewing':
				return { status: 'interviewing', icon: Eye, color: 'bg-purple-100 text-purple-800' };
			case 'completed':
				return { status: 'completed', icon: UserCheck, color: 'bg-green-100 text-green-800' };
			case 'in_queue':
				return { status: 'in_queue', icon: Users, color: 'bg-blue-100 text-blue-800' };
			default:
				return { status: 'not_registered', icon: User, color: 'bg-gray-100 text-gray-800' };
		}
	}, []);

	// Calculate remaining time for a student
	const calculateRemainingTime = useCallback((student: AdmissionStudent) => {
		if (!student.testStartTime || student.testStatus !== 'in_progress') {
			return null;
		}

		const startTime = new Date(student.testStartTime);
		const testDurationMs = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
		const endTime = new Date(startTime.getTime() + testDurationMs);
		const remainingMs = endTime.getTime() - currentTime.getTime();

		if (remainingMs <= 0) {
			return { hours: 0, minutes: 0, seconds: 0, expired: true };
		}

		const hours = Math.floor(remainingMs / (1000 * 60 * 60));
		const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
		const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

		return { hours, minutes, seconds, expired: false };
	}, [currentTime]);

	// Start test for a student
	const startTest = useCallback(async (student: AdmissionStudent) => {
		if (!student.id) return;
		const now = new Date().toISOString();
		const updatedStudent = {
			...student,
			testStartTime: now,
			testStatus: 'in_progress' as const
		};
		await onUpdateStudent(updatedStudent);
	}, [onUpdateStudent]);

	// Complete test for a student
	const completeTest = useCallback(async (student: AdmissionStudent) => {
		if (!student.id || !student.testStartTime) return;
		const now = new Date().toISOString();
		const startTime = new Date(student.testStartTime);
		const duration = Math.floor((new Date().getTime() - startTime.getTime()) / (1000 * 60)); // in minutes
		
		const updatedStudent = {
			...student,
			testEndTime: now,
			testStatus: 'completed' as const,
			testDuration: duration
		};
		await onUpdateStudent(updatedStudent);
	}, [onUpdateStudent]);

	// Mark student as absent
	const markAbsent = useCallback(async (student: AdmissionStudent) => {
		if (!student.id) return;
		const updatedStudent = {
			...student,
			testStatus: 'absent' as const
		};
		await onUpdateStudent(updatedStudent);
	}, [onUpdateStudent]);

	// Adjust start time
	const adjustStartTime = useCallback(async (student: AdmissionStudent, newStartTime: string) => {
		if (!student.id) return;
		const updatedStudent = {
			...student,
			testStartTime: newStartTime,
			testStatus: 'in_progress' as const
		};
		await onUpdateStudent(updatedStudent);
	}, [onUpdateStudent]);

	// Reset test
	const resetTest = useCallback(async (student: AdmissionStudent) => {
		if (!student.id) return;
		const updatedStudent = {
			...student,
			testStartTime: undefined,
			testEndTime: undefined,
			testStatus: 'not_started' as const,
			testDuration: undefined
		};
		await onUpdateStudent(updatedStudent);
	}, [onUpdateStudent]);

	// Mark student as present
	const markPresent = useCallback(async (student: AdmissionStudent) => {
		if (!student.id) return;
		const now = new Date().toISOString();
		const updatedStudent = {
			...student,
			presenceStatus: 'present' as const,
			presenceCheckedAt: now,
			presenceCheckedBy: userRole || 'test_manager'
		};
		await onUpdateStudent(updatedStudent);
	}, [onUpdateStudent, userRole]);

	// Mark student as absent
	const markAbsentPresence = useCallback(async (student: AdmissionStudent) => {
		if (!student.id) return;
		const now = new Date().toISOString();
		const updatedStudent = {
			...student,
			presenceStatus: 'absent' as const,
			presenceCheckedAt: now,
			presenceCheckedBy: userRole || 'test_manager',
			// Also update test status to absent if not started yet
			testStatus: student.testStatus === 'not_started' ? 'absent' as const : student.testStatus
		};
		await onUpdateStudent(updatedStudent);
	}, [onUpdateStudent, userRole]);

	// Mark student as late but present
	const markLate = useCallback(async (student: AdmissionStudent) => {
		if (!student.id) return;
		const now = new Date().toISOString();
		const updatedStudent = {
			...student,
			presenceStatus: 'late' as const,
			presenceCheckedAt: now,
			presenceCheckedBy: userRole || 'test_manager'
		};
		await onUpdateStudent(updatedStudent);
	}, [onUpdateStudent, userRole]);

	// Reset presence status
	const resetPresence = useCallback(async (student: AdmissionStudent) => {
		if (!student.id) return;
		const updatedStudent = {
			...student,
			presenceStatus: 'not_checked' as const,
			presenceCheckedAt: undefined,
			presenceCheckedBy: undefined
		};
		await onUpdateStudent(updatedStudent);
	}, [onUpdateStudent]);

	// Date navigation helpers
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('fr-FR', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	};

	const formatDateInput = (dateString: string) => {
		const date = new Date(dateString);
		return date.toISOString().split('T')[0];
	};

	const formatTime = (date: Date) => {
		return date.toLocaleTimeString('fr-FR', { 
			hour: '2-digit', 
			minute: '2-digit',
			second: '2-digit'
		});
	};

	const getStatusColor = (status: AdmissionStudent['testStatus']) => {
		switch (status) {
			case 'not_started': return 'bg-gray-100 text-gray-800';
			case 'in_progress': return 'bg-blue-100 text-blue-800';
			case 'completed': return 'bg-green-100 text-green-800';
			case 'absent': return 'bg-red-100 text-red-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	};

	const getStatusIcon = (status: AdmissionStudent['testStatus']) => {
		switch (status) {
			case 'not_started': return <Timer className="h-4 w-4" />;
			case 'in_progress': return <Play className="h-4 w-4" />;
			case 'completed': return <CheckCircle className="h-4 w-4" />;
			case 'absent': return <AlertCircle className="h-4 w-4" />;
			default: return <Timer className="h-4 w-4" />;
		}
	};

	// Get presence status color and icon
	const getPresenceStatus = (status: AdmissionStudent['presenceStatus']) => {
		switch (status) {
			case 'present':
				return { 
					color: 'bg-green-100 text-green-800',
					icon: UserCheck,
					label: 'Present'
				};
			case 'absent':
				return { 
					color: 'bg-red-100 text-red-800',
					icon: UserX,
					label: 'Absent'
				};
			case 'late':
				return { 
					color: 'bg-yellow-100 text-yellow-800',
					icon: UserMinus,
					label: 'Late'
				};
			default:
				return { 
					color: 'bg-gray-100 text-gray-800',
					icon: User,
					label: 'Not Checked'
				};
		}
	};

	// Statistics
	const stats = useMemo(() => {
		const total = testStudents.length;
		const notStarted = testStudents.filter(s => s.testStatus === 'not_started').length;
		const inProgress = testStudents.filter(s => s.testStatus === 'in_progress').length;
		const completed = testStudents.filter(s => s.testStatus === 'completed').length;
		const absent = testStudents.filter(s => s.testStatus === 'absent').length;

		// Interview status statistics
		const interviewingCount = testStudents.filter(s => getInterviewStatus(s).status === 'interviewing').length;
		const interviewCompletedCount = testStudents.filter(s => getInterviewStatus(s).status === 'completed').length;
		const inQueueCount = testStudents.filter(s => getInterviewStatus(s).status === 'in_queue').length;
		const notRegisteredCount = testStudents.filter(s => getInterviewStatus(s).status === 'not_registered').length;

		// Presence statistics
		const presentCount = testStudents.filter(s => s.presenceStatus === 'present').length;
		const absentPresenceCount = testStudents.filter(s => s.presenceStatus === 'absent').length;
		const lateCount = testStudents.filter(s => s.presenceStatus === 'late').length;
		const notCheckedCount = testStudents.filter(s => !s.presenceStatus || s.presenceStatus === 'not_checked').length;

		return { 
			total, 
			notStarted, 
			inProgress, 
			completed, 
			absent,
			interviewingCount,
			interviewCompletedCount,
			inQueueCount,
			notRegisteredCount,
			presentCount,
			absentPresenceCount,
			lateCount,
			notCheckedCount
		};
	}, [testStudents, getInterviewStatus]);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Timer className="h-6 w-6 text-blue-600" />
						<h2 className="text-2xl font-semibold">Test Management</h2>
					</div>
					<div className="text-right">
						<div className="text-sm text-gray-500">Current Time</div>
						<div className="text-lg font-mono font-semibold">
							{formatTime(currentTime)}
						</div>
					</div>
				</div>

				{/* Date Picker Section */}
				<div className="bg-white rounded-lg border p-4">
					<div className="flex flex-col md:flex-row items-center gap-4">
						<div className="flex items-center gap-2">
							<Calendar className="h-5 w-5 text-blue-600" />
							<span className="text-sm font-medium text-gray-700">Select Date:</span>
						</div>
						
						<div className="flex items-center gap-2">
							{/* Previous Day Button */}
							<button
								onClick={goToPreviousDay}
								className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
								title="Previous Day"
							>
								<ChevronLeft className="h-4 w-4" />
							</button>

							{/* Date Input */}
							<input
								type="date"
								value={formatDateInput(localSelectedDate)}
								onChange={(e) => handleDateChange(e.target.value)}
								className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>

							{/* Next Day Button */}
							<button
								onClick={goToNextDay}
								className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
								title="Next Day"
							>
								<ChevronRight className="h-4 w-4" />
							</button>

							{/* Today Button */}
							<button
								onClick={goToToday}
								className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
							>
								Today
							</button>
						</div>

						{/* Selected Date Display */}
						<div className="flex-1 text-center md:text-left">
							<div className="text-lg font-semibold text-gray-900">
								{formatDate(localSelectedDate)}
							</div>
							<div className="text-sm text-gray-500">
								{testStudents.length} student{testStudents.length === 1 ? '' : 's'} scheduled for testing
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Search Section */}
			<div className="bg-white rounded-lg border p-4">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
					<input
						id="test-search-input"
						type="text"
						placeholder="Search students by name, mobile, speciality, or bac type... (Ctrl+F to focus)"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
					{searchTerm && (
						<button
							onClick={() => setSearchTerm('')}
							className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
							title="Clear search"
						>
							×
						</button>
					)}
				</div>
				<div className="mt-2 flex items-center justify-between">
					{searchTerm && (
						<div className="text-sm text-gray-600">
							{testStudents.length === 0 
								? "No students found matching your search criteria" 
								: `Showing ${testStudents.length} student${testStudents.length === 1 ? '' : 's'} matching "${searchTerm}"`
							}
						</div>
					)}
					<div className="text-xs text-gray-400">
						{searchTerm ? 'Press Escape to clear' : 'Ctrl+F: search • ←/→: navigate dates • T: today'}
					</div>
				</div>
			</div>

			{/* Statistics Cards */}
			<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
				<div className="bg-white rounded-lg border p-4">
					<div className="flex items-center gap-2">
						<Users className="h-5 w-5 text-gray-600" />
						<span className="text-sm font-medium text-gray-600">Total</span>
					</div>
					<div className="text-2xl font-bold text-gray-900">{stats.total}</div>
				</div>
				
				<div className="bg-white rounded-lg border p-4">
					<div className="flex items-center gap-2">
						<Timer className="h-5 w-5 text-gray-600" />
						<span className="text-sm font-medium text-gray-600">Not Started</span>
					</div>
					<div className="text-2xl font-bold text-gray-900">{stats.notStarted}</div>
				</div>

				<div className="bg-white rounded-lg border p-4">
					<div className="flex items-center gap-2">
						<Play className="h-5 w-5 text-blue-600" />
						<span className="text-sm font-medium text-blue-600">In Progress</span>
					</div>
					<div className="text-2xl font-bold text-blue-900">{stats.inProgress}</div>
				</div>

				<div className="bg-white rounded-lg border p-4">
					<div className="flex items-center gap-2">
						<CheckCircle className="h-5 w-5 text-green-600" />
						<span className="text-sm font-medium text-green-600">Completed</span>
					</div>
					<div className="text-2xl font-bold text-green-900">{stats.completed}</div>
				</div>

				<div className="bg-white rounded-lg border p-4">
					<div className="flex items-center gap-2">
						<AlertCircle className="h-5 w-5 text-red-600" />
						<span className="text-sm font-medium text-red-600">Absent</span>
					</div>
					<div className="text-2xl font-bold text-red-900">{stats.absent}</div>
				</div>
			</div>

			{/* Interview Status Statistics */}
			<div className="space-y-2">
				<h3 className="text-sm font-medium text-gray-700">Interview Status</h3>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div className="bg-white rounded-lg border p-4">
						<div className="flex items-center gap-2">
							<Eye className="h-5 w-5 text-purple-600" />
							<span className="text-sm font-medium text-purple-600">Interviewing</span>
						</div>
						<div className="text-2xl font-bold text-purple-900">{stats.interviewingCount}</div>
					</div>
					
					<div className="bg-white rounded-lg border p-4">
						<div className="flex items-center gap-2">
							<UserCheck className="h-5 w-5 text-green-600" />
							<span className="text-sm font-medium text-green-600">Interview Done</span>
						</div>
						<div className="text-2xl font-bold text-green-900">{stats.interviewCompletedCount}</div>
					</div>

					<div className="bg-white rounded-lg border p-4">
						<div className="flex items-center gap-2">
							<Users className="h-5 w-5 text-blue-600" />
							<span className="text-sm font-medium text-blue-600">In Queue</span>
						</div>
						<div className="text-2xl font-bold text-blue-900">{stats.inQueueCount}</div>
					</div>

					<div className="bg-white rounded-lg border p-4">
						<div className="flex items-center gap-2">
							<User className="h-5 w-5 text-gray-600" />
							<span className="text-sm font-medium text-gray-600">Not Registered</span>
						</div>
						<div className="text-2xl font-bold text-gray-900">{stats.notRegisteredCount}</div>
					</div>
				</div>
			</div>

			{/* Presence Status Statistics */}
			<div className="space-y-2">
				<h3 className="text-sm font-medium text-gray-700">Presence Status</h3>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div className="bg-white rounded-lg border p-4">
						<div className="flex items-center gap-2">
							<UserCheck className="h-5 w-5 text-green-600" />
							<span className="text-sm font-medium text-green-600">Present</span>
						</div>
						<div className="text-2xl font-bold text-green-900">{stats.presentCount}</div>
					</div>

					<div className="bg-white rounded-lg border p-4">
						<div className="flex items-center gap-2">
							<UserX className="h-5 w-5 text-red-600" />
							<span className="text-sm font-medium text-red-600">Absent</span>
						</div>
						<div className="text-2xl font-bold text-red-900">{stats.absentPresenceCount}</div>
					</div>

					<div className="bg-white rounded-lg border p-4">
						<div className="flex items-center gap-2">
							<UserMinus className="h-5 w-5 text-yellow-600" />
							<span className="text-sm font-medium text-yellow-600">Late</span>
						</div>
						<div className="text-2xl font-bold text-yellow-900">{stats.lateCount}</div>
					</div>

					<div className="bg-white rounded-lg border p-4">
						<div className="flex items-center gap-2">
							<User className="h-5 w-5 text-gray-600" />
							<span className="text-sm font-medium text-gray-600">Not Checked</span>
						</div>
						<div className="text-2xl font-bold text-gray-900">{stats.notCheckedCount}</div>
					</div>
				</div>
			</div>

			{/* Students List */}
			<div className="bg-white rounded-lg border">
				<div className="p-4 border-b">
					<h3 className="font-medium">Students Taking Test - {formatDate(localSelectedDate)}</h3>
					<p className="text-sm text-gray-500">Test Duration: 2 hours</p>
				</div>

				{testStudents.length === 0 ? (
					<div className="p-8 text-center text-gray-500">
						<Timer className="h-12 w-12 mx-auto mb-4 text-gray-400" />
						{searchTerm ? (
							<div>
								<p>No students found matching "{searchTerm}"</p>
								<button
									onClick={() => setSearchTerm('')}
									className="mt-2 text-blue-600 hover:text-blue-800 underline text-sm"
								>
									Clear search to see all test students
								</button>
							</div>
						) : (
							<p>No students require testing today</p>
						)}
					</div>
				) : (
					<div className="divide-y">
						{testStudents.map((student) => {
							const remainingTime = calculateRemainingTime(student);
							const isExpired = remainingTime?.expired || false;

							return (
								<div key={student.id || `${student.nom}-${student.prenom}`} className="p-4">
									<div className="flex items-center justify-between">
										{/* Student Info */}
										<div className="flex items-center gap-4">
											<div className="flex items-center gap-2">
												<User className="h-5 w-5 text-gray-400" />
												<div>
													<div className="font-medium">
														{student.nom} {student.prenom}
													</div>
													<div className="text-sm text-gray-500">
														{student.specialite} • {student.mobile}
													</div>
												</div>
											</div>

											{/* Status Badges */}
											<div className="flex gap-2 flex-wrap">
												{/* Presence Status Badge */}
												{(() => {
													const presenceStatus = getPresenceStatus(student.presenceStatus);
													const PresenceIcon = presenceStatus.icon;
													return (
														<span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${presenceStatus.color}`}>
															<PresenceIcon className="h-3 w-3" />
															{presenceStatus.label.toUpperCase()}
														</span>
													);
												})()}

												{/* Test Status Badge */}
												<span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(student.testStatus)}`}>
													{getStatusIcon(student.testStatus)}
													{(student.testStatus || 'not_started').replace('_', ' ').toUpperCase()}
												</span>
												
												{/* Interview Status Badge */}
												{(() => {
													const interviewStatus = getInterviewStatus(student);
													const StatusIcon = interviewStatus.icon;
													return (
														<span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${interviewStatus.color}`}>
															<StatusIcon className="h-3 w-3" />
															{interviewStatus.status === 'interviewing' && 'INTERVIEWING'}
															{interviewStatus.status === 'completed' && 'INTERVIEW DONE'}
															{interviewStatus.status === 'in_queue' && 'IN QUEUE'}
															{interviewStatus.status === 'not_registered' && 'NOT REGISTERED'}
														</span>
													);
												})()}
											</div>
										</div>

										{/* Timer and Controls */}
										<div className="flex items-center gap-4">
											{/* Timer Display */}
											{student.testStatus === 'in_progress' && remainingTime && (
												<div className={`text-center ${isExpired ? 'text-red-600' : 'text-blue-600'}`}>
													<div className="text-xs font-medium">
														{isExpired ? 'EXPIRED' : 'REMAINING'}
													</div>
													<div className="font-mono text-lg font-bold">
														{String(remainingTime.hours).padStart(2, '0')}:
														{String(remainingTime.minutes).padStart(2, '0')}:
														{String(remainingTime.seconds).padStart(2, '0')}
													</div>
												</div>
											)}

											{/* Start Time Display */}
											{student.testStartTime && (
												<div className="text-center">
													<div className="text-xs text-gray-500">Started</div>
													<div className="text-sm font-medium">
														{formatTime(new Date(student.testStartTime))}
													</div>
												</div>
											)}

											{/* Action Buttons */}
											<div className="flex flex-col gap-2">
												{userRole === 'test_manager' && (
													// Presence Controls - Always visible for test manager
													<div className="flex gap-1">
														<div className="text-xs text-gray-500 mb-1 w-full">Presence:</div>
														{student.presenceStatus === 'not_checked' || !student.presenceStatus ? (
															<>
																<button
																	onClick={() => markPresent(student)}
																	className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
																	title="Mark as Present"
																>
																	<UserCheck className="h-3 w-3" />
																	Present
																</button>
																<button
																	onClick={() => markLate(student)}
																	className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
																	title="Mark as Late"
																>
																	<UserMinus className="h-3 w-3" />
																	Late
																</button>
																<button
																	onClick={() => markAbsentPresence(student)}
																	className="inline-flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
																	title="Mark as Absent"
																>
																	<UserX className="h-3 w-3" />
																	Absent
																</button>
															</>
														) : (
															<>
																<button
																	onClick={() => resetPresence(student)}
																	className="inline-flex items-center gap-1 px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
																	title="Reset Presence Status"
																>
																	<RotateCcw className="h-3 w-3" />
																	Reset
																</button>
																{student.presenceCheckedAt && (
																	<div className="text-xs text-gray-500">
																		Checked: {formatTime(new Date(student.presenceCheckedAt))}
																	</div>
																)}
															</>
														)}
													</div>
												)}

												<div className="flex gap-2">
													{userRole === 'test_manager' ? (
														// Test Manager - Test Management Controls
														<>
														{student.testStatus === 'not_started' && (
															<>
																<button
																	onClick={() => startTest(student)}
																	className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
																>
																	<Play className="h-4 w-4" />
																	Start Test
																</button>
																<button
																	onClick={() => markAbsent(student)}
																	className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
																>
																	<AlertCircle className="h-4 w-4" />
																	Mark Absent
																</button>
															</>
														)}

														{student.testStatus === 'in_progress' && (
															<>
																<button
																	onClick={() => completeTest(student)}
																	className={`inline-flex items-center gap-1 px-3 py-1 text-white text-sm rounded-md ${
																		isExpired ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
																	}`}
																>
																	<CheckCircle className="h-4 w-4" />
																	{isExpired ? 'Complete (Expired)' : 'Complete Test'}
																</button>
																<input
																	type="time"
																	value={student.testStartTime ? new Date(student.testStartTime).toTimeString().slice(0, 5) : ''}
																	onChange={(e) => {
																		if (e.target.value) {
																			const today = new Date();
																			const [hours, minutes] = e.target.value.split(':');
																			const newStartTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(hours), parseInt(minutes));
																			adjustStartTime(student, newStartTime.toISOString());
																		}
																	}}
																	className="px-2 py-1 border rounded text-sm"
																	title="Adjust start time"
																/>
															</>
														)}

														{(student.testStatus === 'completed' || student.testStatus === 'absent') && (
															<button
																onClick={() => resetTest(student)}
																className="inline-flex items-center gap-1 px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
															>
																<RotateCcw className="h-4 w-4" />
																Reset
															</button>
														)}
													</>
												) : (
													// Other Users - View Only
													<div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-md">
														View Only - Contact Test Manager to make changes
													</div>
												)}
												</div>
											</div>
										</div>
									</div>

									{/* Duration Display for Completed Tests */}
									{student.testStatus === 'completed' && student.testDuration && (
										<div className="mt-2 text-sm text-gray-600">
											<Clock className="h-4 w-4 inline mr-1" />
											Test Duration: {Math.floor(student.testDuration / 60)}h {student.testDuration % 60}m
											{student.testEndTime && (
												<span className="ml-4">
													Completed at: {formatTime(new Date(student.testEndTime))}
												</span>
											)}
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
};

export default TestManagement;