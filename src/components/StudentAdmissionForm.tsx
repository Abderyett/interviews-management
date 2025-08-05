import React, { useState, useMemo } from 'react';
import {
	Plus,
	Save,
	AlertTriangle,
	Check,
	ChevronDown,
	Calendar,
	Edit2,
	Trash2,
	FileText,
	BarChart3,
	Users,
	Eye,
	Star,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { CalendarComponent } from './Calendar';
import { AdmissionDashboard } from './AdmissionDashboard';
import { supabase } from '../lib/supabase';

interface Student {
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
}

interface InterviewEvaluation {
	id: number;
	student_id: number;
	professor_id: number;
	situation_etudes: string;
	motivation_domaine: number;
	motivation_domaine_comment: string;
	motivation_ifag: number;
	motivation_ifag_comment: string;
	projet_etudes: number;
	projet_etudes_comment: string;
	projet_professionnel: number;
	projet_professionnel_comment: string;
	aisance_verbale: number;
	aisance_verbale_comment: string;
	interaction_jury: number;
	interaction_jury_comment: string;
	culture_generale: number;
	culture_generale_comment: string;
	decision_jury: 'admis' | 'non_admis' | 'indecis';
	commentaire_global: string;
	membre_jury: string;
	date_evaluation: string;
	created_at: string;
}

interface StudentAdmissionFormProps {
	userRole: 'sales' | 'superadmin';
	salesPersonId?: number;
	students?: Student[];
	onSaveStudent: (student: Student) => void;
	onUpdateStudent?: (student: Student) => void;
	onDeleteStudent?: (studentId: number) => void;
	onAddToRegistry?: (student: { studentId: string; name: string }, interviewDate: string) => void;
}

const Button = ({
	children,
	onClick,
	variant = 'default',
	size = 'default',
	disabled = false,
	className = '',
	type = 'button',
	title,
}: {
	children: React.ReactNode;
	onClick?: () => void;
	variant?: 'default' | 'outline' | 'destructive';
	size?: 'default' | 'sm';
	disabled?: boolean;
	className?: string;
	type?: 'button' | 'submit';
	title?: string;
}) => {
	const baseClasses =
		'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

	const variants = {
		default: 'bg-indigo-600 text-white hover:bg-indigo-700',
		outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
		destructive: 'bg-red-600 text-white hover:bg-red-700',
	};

	const sizes = {
		default: 'h-10 px-4 py-2',
		sm: 'h-8 px-3 text-sm',
	};

	return (
		<button
			type={type}
			className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
			onClick={onClick}
			disabled={disabled}
			title={title}>
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

const Badge = ({
	children,
	variant = 'default',
	className = '',
}: {
	children: React.ReactNode;
	variant?: 'default' | 'destructive' | 'outline' | 'warning' | 'secondary';
	className?: string;
}) => {
	const variants = {
		default: 'bg-blue-100 text-blue-800',
		destructive: 'bg-red-100 text-red-800',
		outline: 'border border-gray-300 text-gray-700',
		warning: 'bg-yellow-100 text-yellow-800',
		secondary: 'bg-purple-100 text-purple-800',
	};

	return (
		<span
			className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
			{children}
		</span>
	);
};

const BAC_TYPES = [
	{ value: 'bac_science', label: 'Bac Science' },
	{ value: 'bac_fr', label: 'Bac Français' },
	{ value: 'bac_maths', label: 'Bac Maths' },
	{ value: 'bac_maths_tech', label: 'Bac Maths Tech' },
	{ value: 'bac_lettre', label: 'Bac Lettre' },
	{ value: 'bac_langue', label: 'Bac Langue' },
	{ value: 'bac_gestion', label: 'Bac Gestion' },
];

const ANNEE_BAC = [
	{ value: '2022', label: '2022' },
	{ value: '2023', label: '2023' },
	{ value: '2024', label: '2024' },
	{ value: '2025', label: '2025' },
];

const SPECIALITES = [
	{ value: 'LAC', label: 'LAC' },
	{ value: 'LINFO', label: 'LINFO' },
	{ value: 'LFC', label: 'LFC' },
	{ value: 'MASTER_MM', label: 'MASTER MM' },
	{ value: 'MASTER_TD', label: 'Master TD' },
];

const VALIDATION_STATUS = [
	{ value: 'pending', label: 'Pending' },
	{ value: 'accepted', label: 'Accepted' },
	{ value: 'rejected', label: 'Rejected' },
];

const STUDENT_STATUS = [
	{ value: 'inscrit', label: 'Inscrit' },
	{ value: 'en_cours', label: 'En Cours' },
	{ value: 'abandonner', label: 'Abandonner' },
];

// Sales person ID to name mapping (matches Login component)
const SALES_PERSONS: { [key: number]: string } = {
	1: 'Samir Hadjout',
	2: 'Samy Bouaddou',
	3: 'Imen Mouzaoui',
	4: 'Wassim Benkhannouf',
	5: 'Gassbi Wassil',
	6: 'Adem Bentayeb',
	7: 'Lyna Guita',
};

// Helper function to get sales person name
const getSalesPersonName = (id: number): string => {
	return SALES_PERSONS[id] || `Sales ID: ${id}`;
};

// Helper functions for student status
const getStudentStatusLabel = (status?: string): string => {
	const statusObj = STUDENT_STATUS.find((s) => s.value === status);
	return statusObj ? statusObj.label : 'N/A';
};

const getStudentStatusVariant = (status?: string): 'default' | 'secondary' | 'destructive' => {
	switch (status) {
		case 'inscrit':
			return 'default'; // Green
		case 'en_cours':
			return 'secondary'; // Yellow
		case 'abandonner':
			return 'destructive'; // Red
		default:
			return 'secondary';
	}
};

export const StudentAdmissionForm: React.FC<StudentAdmissionFormProps> = ({
	userRole,
	salesPersonId,
	students = [],
	onSaveStudent,
	onUpdateStudent,
	onDeleteStudent,
}) => {
	const [showForm, setShowForm] = useState(false);
	const [editingStudent, setEditingStudent] = useState<Student | null>(null);
	const [modalMode, setModalMode] = useState<'add' | 'edit' | 'test'>('add');
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
	const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
	const [filterSpecialite, setFilterSpecialite] = useState('');
	const [filterSalesPerson, setFilterSalesPerson] = useState('');
	const [filterTestRequired, setFilterTestRequired] = useState('');
	const [showDashboard, setShowDashboard] = useState(false);
	const [selectedEvaluation, setSelectedEvaluation] = useState<InterviewEvaluation | null>(null);
	const [showEvaluationModal, setShowEvaluationModal] = useState(false);
	const [loadingEvaluation, setLoadingEvaluation] = useState(false);

	const [formData, setFormData] = useState<Partial<Student>>({
		nom: '',
		prenom: '',
		mobile: '',
		bacType: '',
		anneeBac: '',
		specialite: '',
		moyenneGenerale: undefined,
		maths: undefined,
		francais: undefined,
		physique: undefined,
		licenceSpecialite: '',
		university: '',
		testRequired: false,
		testScores: {},
		validation: 'pending',
		validationComment: '',
		studentStatus: 'en_cours',
		interviewDate: '',
	});

	const [showDropdowns, setShowDropdowns] = useState({
		bacType: false,
		anneeBac: false,
		specialite: false,
		validation: false,
		salesPerson: false,
		studentStatus: false,
		testRequired: false,
	});

	// Calculate if test is required and average
	const testRequired = useMemo(() => {
		if (!formData.specialite) return false;

		if (formData.specialite === 'LAC') {
			if (formData.maths !== undefined && formData.francais !== undefined) {
				const average = (formData.maths + formData.francais) / 2;
				return average < 12;
			}
		} else if (formData.specialite === 'LFC') {
			return false;
		} else if (formData.specialite === 'LINFO') {
			if (formData.maths !== undefined && formData.physique !== undefined) {
				const average = (formData.maths + formData.physique) / 2;
				return average < 12;
			}
		}
		return false;
	}, [formData.specialite, formData.maths, formData.francais, formData.physique]);

	// Helper functions for validation status display
	const getValidationLabel = (validation?: string) => {
		return VALIDATION_STATUS.find((status) => status.value === validation)?.label || validation || 'N/A';
	};

	const getValidationVariant = (validation?: string): 'default' | 'destructive' | 'outline' => {
		switch (validation) {
			case 'accepted':
				return 'default';
			case 'rejected':
				return 'destructive';
			case 'pending':
			default:
				return 'outline';
		}
	};

	// Get specialized fields based on specialite
	const getSpecializedFields = () => {
		if (formData.specialite === 'LAC') {
			return ['moyenneGenerale', 'maths', 'francais'];
		} else if (formData.specialite === 'LFC') {
			return ['moyenneGenerale', 'maths', 'francais'];
		} else if (formData.specialite === 'LINFO') {
			return ['moyenneGenerale', 'maths', 'physique'];
		}
		return [];
	};

	// Get master fields for MASTER programs
	const getMasterFields = () => {
		if (formData.specialite === 'MASTER_MM' || formData.specialite === 'MASTER_TD') {
			return ['licenceSpecialite', 'university'];
		}
		return [];
	};

	// Get test fields based on specialite
	const getTestFields = () => {
		if (formData.specialite === 'LAC') {
			return ['maths', 'logique', 'francais', 'cultureGenerale'];
		} else if (formData.specialite === 'LINFO') {
			return ['maths', 'logique'];
		}
		return [];
	};

	// Get unique sales persons for filter dropdown
	const uniqueSalesPersons = useMemo(() => {
		const salesIds = [...new Set(students.map((s) => s.salesPersonId))].sort((a, b) => a - b);
		return salesIds.map((id) => ({ value: id.toString(), label: getSalesPersonName(id) }));
	}, [students]);

	// Get sales persons data for dashboard
	const salesPersonsData = useMemo(() => {
		const salesIds = [...new Set(students.map((s) => s.salesPersonId))].sort((a, b) => a - b);
		return salesIds.map((id) => ({ id, name: getSalesPersonName(id) }));
	}, [students]);

	// Filter students based on selected criteria
	const filteredStudents = useMemo(() => {
		let filtered = students;

		if (userRole === 'sales' && salesPersonId) {
			filtered = filtered.filter((s) => s.salesPersonId === salesPersonId);
		}

		if (filterSpecialite) {
			filtered = filtered.filter((s) => s.specialite === filterSpecialite);
		}

		if (selectedDate) {
			filtered = filtered.filter((s) => {
				if (!s.interviewDate) return false;
				return new Date(s.interviewDate).toDateString() === new Date(selectedDate).toDateString();
			});
		}

		if (filterSalesPerson) {
			filtered = filtered.filter((s) => s.salesPersonId.toString() === filterSalesPerson);
		}

		if (filterTestRequired) {
			if (filterTestRequired === 'required') {
				filtered = filtered.filter((s) => s.testRequired === true);
			} else if (filterTestRequired === 'not_required') {
				filtered = filtered.filter((s) => s.testRequired === false);
			}
		}

		return filtered;
	}, [
		students,
		userRole,
		salesPersonId,
		filterSpecialite,
		selectedDate,
		filterSalesPerson,
		filterTestRequired,
	]);

	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Prevent double submission
		if (isSubmitting) {
			console.log('Form submission already in progress, ignoring duplicate submit');
			return;
		}

		try {
			setIsSubmitting(true);

			if (modalMode === 'edit' && editingStudent && onUpdateStudent) {
				const updatedStudent: Student = {
					...editingStudent,
					...(formData as Student),
					testRequired,
				};
				await onUpdateStudent(updatedStudent);
			} else if (modalMode === 'test' && editingStudent && onUpdateStudent) {
				const updatedStudent: Student = {
					...editingStudent,
					testScores: formData.testScores,
				};
				await onUpdateStudent(updatedStudent);
			} else {
				const newStudent: Student = {
					nom: formData.nom || '',
					prenom: formData.prenom || '',
					mobile: formData.mobile || '',
					bacType: formData.bacType || '',
					anneeBac: formData.anneeBac || '',
					specialite: formData.specialite || '',
					moyenneGenerale: formData.moyenneGenerale,
					maths: formData.maths,
					francais: formData.francais,
					physique: formData.physique,
					licenceSpecialite: formData.licenceSpecialite,
					university: formData.university,
					testRequired,
					testScores: formData.testScores,
					validation: formData.validation || 'pending',
					validationComment: formData.validationComment || '',
					studentStatus: formData.studentStatus || 'en_cours',
					dateCreated: new Date(),
					salesPersonId: salesPersonId || 0,
					interviewDate: formData.interviewDate,
				};

				console.log('Form submitting student data:', newStudent);
				await onSaveStudent(newStudent);
			}

			resetForm();
		} catch (error) {
			console.error('Error submitting form:', error);
			// Keep the form open if there's an error
		} finally {
			setIsSubmitting(false);
		}
	};

	const resetForm = () => {
		setFormData({
			nom: '',
			prenom: '',
			mobile: '',
			bacType: '',
			anneeBac: '',
			specialite: '',
			moyenneGenerale: undefined,
			maths: undefined,
			francais: undefined,
			physique: undefined,
			licenceSpecialite: '',
			university: '',
			testRequired: false,
			testScores: {},
			validation: 'pending',
			validationComment: '',
			interviewDate: '',
		});
		setShowForm(false);
		setEditingStudent(null);
		setModalMode('add');
	};

	const handleEdit = (student: Student) => {
		setEditingStudent(student);
		setFormData({
			...student,
		});
		setModalMode('edit');
		setShowForm(true);
	};

	const handleAddTestResults = (student: Student) => {
		setEditingStudent(student);
		setFormData({
			testScores: student.testScores || {},
		});
		setModalMode('test');
		setShowForm(true);
	};

	const handleDropdownSelect = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		setShowDropdowns((prev) => ({ ...prev, [field]: false }));
	};

	const handleDeleteClick = (student: Student) => {
		setStudentToDelete(student);
		setShowDeleteModal(true);
	};

	const handleConfirmDelete = () => {
		if (studentToDelete?.id && onDeleteStudent) {
			onDeleteStudent(studentToDelete.id);
			setShowDeleteModal(false);
			setStudentToDelete(null);
		}
	};

	const handleCancelDelete = () => {
		setShowDeleteModal(false);
		setStudentToDelete(null);
	};

	const handleViewEvaluation = async (student: Student) => {
		if (!student.id) {
			alert('ID etudiant manquant');
			return;
		}

		setLoadingEvaluation(true);
		try {
			const { data, error } = await supabase
				.from('interview_evaluations')
				.select('*')
				.eq('student_id', student.id)
				.single();

			if (error) {
				if (error.code === 'PGRST116') {
					alert('Aucune evaluation d\'entretien trouvee pour cet etudiant');
				} else {
					console.error('Error fetching evaluation:', error);
					alert('Erreur lors du chargement de l\'evaluation');
				}
				return;
			}

			setSelectedEvaluation(data);
			setShowEvaluationModal(true);
		} catch (error) {
			console.error('Error:', error);
			alert('Erreur lors du chargement de l\'evaluation');
		} finally {
			setLoadingEvaluation(false);
		}
	};

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex justify-between items-center'>
				{/* <div>
					<h2 className='text-2xl font-bold'>Student Admission Management</h2>
					<p className='text-muted-foreground'>Manage student applications and admissions</p>
				</div> */}
				<div className='flex gap-3'>
					{(userRole === 'sales' || userRole === 'superadmin') && (
						<Button
							onClick={() => {
								setModalMode('add');
								setShowForm(true);
							}}
							className='bg-green-600 hover:bg-green-700'>
							<Plus className='h-4 w-4 mr-2' />
							Add Student
						</Button>
					)}
					{userRole === 'superadmin' && (
						<Button
							onClick={() => setShowDashboard(!showDashboard)}
							variant='outline'
							className='border-purple-200 text-purple-600 hover:bg-purple-50'>
							{showDashboard ? (
								<>
									<Users className='h-4 w-4 mr-2' />
									Show Table
								</>
							) : (
								<>
									<BarChart3 className='h-4 w-4 mr-2' />
									Show Dashboard
								</>
							)}
						</Button>
					)}
				</div>
			</div>

			{/* Dashboard or Table View */}
			{showDashboard && userRole === 'superadmin' ? (
				<AdmissionDashboard
					students={students}
					salesPersons={salesPersonsData}
					selectedDate={selectedDate}
					onDateChange={setSelectedDate}
				/>
			) : (
				<>
					{/* Filters */}
					<Card>
						<CardHeader>
							<CardTitle className='text-lg'>Filters</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
								{/* Date Filter */}
								<div>
									<label className='block text-sm font-medium mb-2'>Date</label>
									<CalendarComponent value={selectedDate} onChange={setSelectedDate} className='w-full' />
								</div>

								{/* Specialite Filter */}
								<div>
									<label className='block text-sm font-medium mb-2'>Specialité</label>
									<div className='relative'>
										<button
											type='button'
											onClick={() => setShowDropdowns((prev) => ({ ...prev, specialite: !prev.specialite }))}
											className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center justify-between'>
											<span className={filterSpecialite ? 'text-foreground' : 'text-muted-foreground'}>
												{filterSpecialite || 'All Specialités'}
											</span>
											<ChevronDown className='h-4 w-4' />
										</button>

										{showDropdowns.specialite && (
											<div className='absolute z-50 top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg'>
												<button
													type='button'
													onClick={() => {
														setFilterSpecialite('');
														setShowDropdowns((prev) => ({ ...prev, specialite: false }));
													}}
													className='w-full px-3 py-2 text-left hover:bg-gray-100 text-sm'>
													All Specialités
												</button>
												{SPECIALITES.map((spec) => (
													<button
														key={spec.value}
														type='button'
														onClick={() => {
															setFilterSpecialite(spec.value);
															setShowDropdowns((prev) => ({ ...prev, specialite: false }));
														}}
														className='w-full px-3 py-2 text-left hover:bg-gray-100 text-sm'>
														{spec.label}
													</button>
												))}
											</div>
										)}
									</div>
								</div>

								{/* Sales Person Filter - Only show for superadmin */}
								{userRole === 'superadmin' && (
									<div>
										<label className='block text-sm font-medium mb-2'>Sales Person</label>
										<div className='relative'>
											<button
												type='button'
												onClick={() =>
													setShowDropdowns((prev) => ({ ...prev, salesPerson: !prev.salesPerson }))
												}
												className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center justify-between'>
												<span className={filterSalesPerson ? 'text-foreground' : 'text-muted-foreground'}>
													{filterSalesPerson
														? getSalesPersonName(parseInt(filterSalesPerson))
														: 'All Sales Persons'}
												</span>
												<ChevronDown className='h-4 w-4' />
											</button>

											{showDropdowns.salesPerson && (
												<div className='absolute z-50 top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg'>
													<button
														type='button'
														onClick={() => {
															setFilterSalesPerson('');
															setShowDropdowns((prev) => ({ ...prev, salesPerson: false }));
														}}
														className='w-full px-3 py-2 text-left hover:bg-gray-100 text-sm'>
														All Sales Persons
													</button>
													{uniqueSalesPersons.map((sales) => (
														<button
															key={sales.value}
															type='button'
															onClick={() => {
																setFilterSalesPerson(sales.value);
																setShowDropdowns((prev) => ({ ...prev, salesPerson: false }));
															}}
															className='w-full px-3 py-2 text-left hover:bg-gray-100 text-sm'>
															{sales.label}
														</button>
													))}
												</div>
											)}
										</div>
									</div>
								)}

								{/* Test Requirement Filter */}
								<div>
									<label className='block text-sm font-medium mb-2'>Test Requirement</label>
									<div className='relative'>
										<button
											type='button'
											onClick={() =>
												setShowDropdowns((prev) => ({ ...prev, testRequired: !prev.testRequired }))
											}
											className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center justify-between'>
											<span className={filterTestRequired ? 'text-foreground' : 'text-muted-foreground'}>
												{filterTestRequired === 'required'
													? 'Test Required'
													: filterTestRequired === 'not_required'
													? 'No Test Required'
													: 'All Students'}
											</span>
											<ChevronDown className='h-4 w-4' />
										</button>

										{showDropdowns.testRequired && (
											<div className='absolute z-50 top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg'>
												<button
													type='button'
													onClick={() => {
														setFilterTestRequired('');
														setShowDropdowns((prev) => ({ ...prev, testRequired: false }));
													}}
													className='w-full px-3 py-2 text-left hover:bg-gray-100 text-sm'>
													All Students
												</button>
												<button
													type='button'
													onClick={() => {
														setFilterTestRequired('required');
														setShowDropdowns((prev) => ({ ...prev, testRequired: false }));
													}}
													className='w-full px-3 py-2 text-left hover:bg-gray-100 text-sm'>
													Test Required
												</button>
												<button
													type='button'
													onClick={() => {
														setFilterTestRequired('not_required');
														setShowDropdowns((prev) => ({ ...prev, testRequired: false }));
													}}
													className='w-full px-3 py-2 text-left hover:bg-gray-100 text-sm'>
													No Test Required
												</button>
											</div>
										)}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Student Form Modal */}
					<Dialog
						open={showForm}
						onOpenChange={(open) => {
							if (!open) resetForm();
							setShowForm(open);
						}}>
						<DialogContent className='max-w-2xl max-h-[95vh] overflow-y-auto'>
							<DialogHeader>
								<DialogTitle>
									{modalMode === 'add'
										? 'Add New Student'
										: modalMode === 'edit'
										? 'Edit Student'
										: 'Add Test Results'}
								</DialogTitle>
							</DialogHeader>
							<div className='space-y-4'>
								<form onSubmit={handleSubmit} className='space-y-4'>
									{modalMode !== 'test' && (
										<>
											{/* Basic Info */}
											<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
												<div>
													<label className='block text-sm font-medium mb-2'>Nom *</label>
													<input
														type='text'
														value={formData.nom}
														onChange={(e) => setFormData((prev) => ({ ...prev, nom: e.target.value }))}
														className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
														required
													/>
												</div>
												<div>
													<label className='block text-sm font-medium mb-2'>Prénom *</label>
													<input
														type='text'
														value={formData.prenom}
														onChange={(e) => setFormData((prev) => ({ ...prev, prenom: e.target.value }))}
														className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
														required
													/>
												</div>
											</div>

											<div>
												<label className='block text-sm font-medium mb-2'>Mobile *</label>
												<input
													type='tel'
													value={formData.mobile}
													onChange={(e) => setFormData((prev) => ({ ...prev, mobile: e.target.value }))}
													className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
													required
												/>
											</div>

											<div>
												<label className='block text-sm font-medium mb-2'>Interview Date</label>
												<CalendarComponent
													value={formData.interviewDate || ''}
													onChange={(date) => setFormData((prev) => ({ ...prev, interviewDate: date }))}
													className='w-full'
												/>
												<p className='text-xs text-gray-500 mt-1'>
													Select a date to automatically add student to interview registry
												</p>
											</div>

											{/* Dropdowns */}
											<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
												{/* Bac Type */}
												<div className='relative'>
													<label className='block text-sm font-medium mb-2'>Type Bac *</label>
													<button
														type='button'
														onClick={() => setShowDropdowns((prev) => ({ ...prev, bacType: !prev.bacType }))}
														className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center justify-between'>
														<span className={formData.bacType ? 'text-foreground' : 'text-muted-foreground'}>
															{formData.bacType
																? BAC_TYPES.find((b) => b.value === formData.bacType)?.label
																: 'Select Bac Type'}
														</span>
														<ChevronDown className='h-4 w-4' />
													</button>

													{showDropdowns.bacType && (
														<div className='absolute z-50 top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto'>
															{BAC_TYPES.map((bac) => (
																<button
																	key={bac.value}
																	type='button'
																	onClick={() => handleDropdownSelect('bacType', bac.value)}
																	className='w-full px-3 py-2 text-left hover:bg-gray-100 text-sm'>
																	{bac.label}
																</button>
															))}
														</div>
													)}
												</div>

												{/* Année Bac */}
												<div className='relative'>
													<label className='block text-sm font-medium mb-2'>Année Bac *</label>
													<button
														type='button'
														onClick={() =>
															setShowDropdowns((prev) => ({ ...prev, anneeBac: !prev.anneeBac }))
														}
														className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center justify-between'>
														<span className={formData.anneeBac ? 'text-foreground' : 'text-muted-foreground'}>
															{formData.anneeBac || 'Select Year'}
														</span>
														<ChevronDown className='h-4 w-4' />
													</button>

													{showDropdowns.anneeBac && (
														<div className='absolute z-50 top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto'>
															{ANNEE_BAC.map((annee) => (
																<button
																	key={annee.value}
																	type='button'
																	onClick={() => handleDropdownSelect('anneeBac', annee.value)}
																	className='w-full px-3 py-2 text-left hover:bg-gray-100 text-sm'>
																	{annee.label}
																</button>
															))}
														</div>
													)}
												</div>

												{/* Specialité */}
												<div className='relative'>
													<label className='block text-sm font-medium mb-2'>Spécialité *</label>
													<button
														type='button'
														onClick={() =>
															setShowDropdowns((prev) => ({ ...prev, specialite: !prev.specialite }))
														}
														className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center justify-between'>
														<span
															className={formData.specialite ? 'text-foreground' : 'text-muted-foreground'}>
															{formData.specialite
																? SPECIALITES.find((s) => s.value === formData.specialite)?.label
																: 'Select Specialité'}
														</span>
														<ChevronDown className='h-4 w-4' />
													</button>

													{showDropdowns.specialite && (
														<div className='absolute z-50 top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto'>
															{SPECIALITES.map((spec) => (
																<button
																	key={spec.value}
																	type='button'
																	onClick={() => handleDropdownSelect('specialite', spec.value)}
																	className='w-full px-3 py-2 text-left hover:bg-gray-100 text-sm'>
																	{spec.label}
																</button>
															))}
														</div>
													)}
												</div>
											</div>

											{/* Academic Scores - For LAC, LFC, and LINFO */}
											{(formData.specialite === 'LAC' ||
												formData.specialite === 'LFC' ||
												formData.specialite === 'LINFO') && (
												<div>
													<h4 className='font-medium mb-3'>Academic Scores</h4>
													<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
														{getSpecializedFields().map((field) => (
															<div key={field}>
																<label className='block text-sm font-medium mb-2'>
																	{field === 'moyenneGenerale'
																		? 'Moyenne Générale'
																		: field === 'maths'
																		? 'Maths'
																		: field === 'francais'
																		? 'Français'
																		: field === 'physique'
																		? 'Physique'
																		: field}{' '}
																	*
																</label>
																<input
																	type='number'
																	step='0.01'
																	min='0'
																	max='20'
																	value={(formData[field as keyof Student] as number) || ''}
																	onChange={(e) =>
																		setFormData((prev) => ({
																			...prev,
																			[field]: parseFloat(e.target.value),
																		}))
																	}
																	className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
																	required
																/>
															</div>
														))}
													</div>
												</div>
											)}

											{/* Master Program Fields - Only for MASTER MM and MASTER TD */}
											{(formData.specialite === 'MASTER_MM' || formData.specialite === 'MASTER_TD') && (
												<div>
													<h4 className='font-medium mb-3'>Licence Information</h4>
													<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
														{getMasterFields().map((field) => (
															<div key={field}>
																<label className='block text-sm font-medium mb-2'>
																	{field === 'licenceSpecialite'
																		? 'Licence Spécialité'
																		: field === 'university'
																		? 'University'
																		: field}{' '}
																	*
																</label>
																<input
																	type='text'
																	value={(formData[field as keyof Student] as string) || ''}
																	onChange={(e) =>
																		setFormData((prev) => ({
																			...prev,
																			[field]: e.target.value,
																		}))
																	}
																	className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
																	required
																	placeholder={
																		field === 'licenceSpecialite'
																			? 'e.g., Informatique, Mathématiques'
																			: 'e.g., Université de Tunis'
																	}
																/>
															</div>
														))}
													</div>
												</div>
											)}

											{/* Test Required Badge */}
											{testRequired && (
												<div className='flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
													<AlertTriangle className='h-5 w-5 text-yellow-600' />
													<Badge variant='warning'>Test Required</Badge>
													<span className='text-sm text-yellow-700'>
														Average below 12 - entrance test required
													</span>
												</div>
											)}

											{/* Test Scores */}
											{testRequired && (
												<div>
													<h4 className='font-medium mb-3'>Test Scores</h4>
													<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
														{getTestFields().map((field) => (
															<div key={field}>
																<label className='block text-sm font-medium mb-2'>
																	Note{' '}
																	{field === 'maths'
																		? 'Maths'
																		: field === 'logique'
																		? 'Logique'
																		: field === 'francais'
																		? 'Français'
																		: field === 'cultureGenerale'
																		? 'Culture Générale'
																		: field}
																</label>
																<input
																	type='number'
																	step='0.01'
																	min='0'
																	max='20'
																	value={
																		formData.testScores?.[field as keyof typeof formData.testScores] || ''
																	}
																	onChange={(e) =>
																		setFormData((prev) => ({
																			...prev,
																			testScores: {
																				...prev.testScores,
																				[field]: parseFloat(e.target.value),
																			},
																		}))
																	}
																	className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
																/>
															</div>
														))}
													</div>
												</div>
											)}

											{/* Validation - Only for SuperAdmin */}
											{userRole === 'superadmin' && (
												<div className='relative'>
													<label className='block text-sm font-medium mb-2'>Validation</label>
													<button
														type='button'
														onClick={() =>
															setShowDropdowns((prev) => ({ ...prev, validation: !prev.validation }))
														}
														className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center justify-between'>
														<span
															className={formData.validation ? 'text-foreground' : 'text-muted-foreground'}>
															{formData.validation
																? VALIDATION_STATUS.find((status) => status.value === formData.validation)
																		?.label || 'Select Status'
																: 'Select Status'}
														</span>
														<ChevronDown className='h-4 w-4' />
													</button>

													{showDropdowns.validation && (
														<div className='absolute z-50 top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto'>
															{VALIDATION_STATUS.map((status) => (
																<button
																	key={status.value}
																	type='button'
																	onClick={() => handleDropdownSelect('validation', status.value)}
																	className='w-full px-3 py-2 text-left hover:bg-gray-100 text-sm'>
																	{status.label}
																</button>
															))}
														</div>
													)}
												</div>
											)}

											{/* Student Status - Visible to all, editable by SuperAdmin only */}
											{(userRole === 'superadmin' || userRole === 'sales') && (
												<div className='relative'>
													<label className='block text-sm font-medium mb-2'>Student Status</label>
													<button
														type='button'
														onClick={() =>
															setShowDropdowns((prev) => ({ ...prev, studentStatus: !prev.studentStatus }))
														}
														className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center justify-between'
														disabled={userRole !== 'superadmin'}>
														<span
															className={
																formData.studentStatus ? 'text-foreground' : 'text-muted-foreground'
															}>
															{formData.studentStatus
																? STUDENT_STATUS.find((status) => status.value === formData.studentStatus)
																		?.label || 'Select Status'
																: 'Select Status'}
														</span>
														{userRole === 'superadmin' && <ChevronDown className='h-4 w-4' />}
													</button>

													{showDropdowns.studentStatus && userRole === 'superadmin' && (
														<div className='absolute z-50 top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto'>
															{STUDENT_STATUS.map((status) => (
																<button
																	key={status.value}
																	type='button'
																	onClick={() => handleDropdownSelect('studentStatus', status.value)}
																	className='w-full px-3 py-2 text-left hover:bg-gray-100 text-sm'>
																	{status.label}
																</button>
															))}
														</div>
													)}
												</div>
											)}

											{/* Validation Comment - Visible to all, editable by SuperAdmin only */}
											{(userRole === 'superadmin' || userRole === 'sales') && (
												<div>
													<label className='block text-sm font-medium mb-2'>Comment</label>
													<textarea
														value={formData.validationComment || ''}
														onChange={
															userRole === 'superadmin'
																? (e) =>
																		setFormData((prev) => ({ ...prev, validationComment: e.target.value }))
																: undefined
														}
														placeholder={
															userRole === 'superadmin' ? 'Add validation comments...' : 'No comments yet'
														}
														className={`w-full px-3 py-2 border border-gray-300 rounded-lg resize-none ${
															userRole === 'superadmin'
																? 'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
																: 'bg-gray-50 cursor-not-allowed'
														}`}
														rows={3}
														readOnly={userRole !== 'superadmin'}
													/>
													<p className='text-xs text-gray-500 mt-1'>
														{userRole === 'superadmin'
															? "Comments will be attached to this student's record"
															: 'Only superadmin can modify comments'}
													</p>
												</div>
											)}
										</>
									)}

									{/* Test Scores Section - Only for test mode */}
									{modalMode === 'test' && editingStudent && (
										<div>
											<h4 className='font-medium mb-3'>
												Add Test Results for {editingStudent.nom} {editingStudent.prenom}
											</h4>
											<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
												{editingStudent.specialite === 'LAC' &&
													['maths', 'logique', 'francais', 'cultureGenerale'].map((field) => (
														<div key={field}>
															<label className='block text-sm font-medium mb-2'>
																Note{' '}
																{field === 'maths'
																	? 'Maths'
																	: field === 'logique'
																	? 'Logique'
																	: field === 'francais'
																	? 'Français'
																	: field === 'cultureGenerale'
																	? 'Culture Générale'
																	: field}
															</label>
															<input
																type='number'
																step='0.01'
																min='0'
																max='20'
																value={formData.testScores?.[field as keyof typeof formData.testScores] || ''}
																onChange={(e) =>
																	setFormData((prev) => ({
																		...prev,
																		testScores: {
																			...prev.testScores,
																			[field]: parseFloat(e.target.value),
																		},
																	}))
																}
																className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
															/>
														</div>
													))}
												{editingStudent.specialite === 'LINFO' &&
													['maths', 'logique'].map((field) => (
														<div key={field}>
															<label className='block text-sm font-medium mb-2'>
																Note {field === 'maths' ? 'Maths' : 'Logique'}
															</label>
															<input
																type='number'
																step='0.01'
																min='0'
																max='20'
																value={formData.testScores?.[field as keyof typeof formData.testScores] || ''}
																onChange={(e) =>
																	setFormData((prev) => ({
																		...prev,
																		testScores: {
																			...prev.testScores,
																			[field]: parseFloat(e.target.value),
																		},
																	}))
																}
																className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
															/>
														</div>
													))}
											</div>
										</div>
									)}

									{/* Form Actions */}
									<div className='flex gap-3 pt-4'>
										<Button type='button' variant='outline' onClick={resetForm} className='flex-1'>
											Cancel
										</Button>
										<Button type='submit' className='flex-1'>
											<Save className='h-4 w-4 mr-2' />
											{modalMode === 'add'
												? 'Save Student'
												: modalMode === 'edit'
												? 'Update Student'
												: 'Save Test Results'}
										</Button>
									</div>
								</form>
							</div>
						</DialogContent>
					</Dialog>

					{/* Students Table */}
					<Card>
						<CardHeader>
							<CardTitle>Students ({filteredStudents.length})</CardTitle>
						</CardHeader>
						<CardContent>
							{filteredStudents.length === 0 ? (
								<div className='text-center py-8 text-muted-foreground'>
									No students found for the selected criteria.
								</div>
							) : (
								<div className='overflow-x-auto overflow-y-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100'>
									<table className='w-full border-collapse min-w-max'>
										<thead>
											<tr className='border-b'>
												<th className='text-left p-3 min-w-[150px]'>Name</th>
												<th className='text-left p-3 min-w-[120px]'>Mobile</th>
												<th className='text-left p-3 min-w-[100px]'>Bac</th>
												<th className='text-left p-3 min-w-[100px]'>Specialité</th>
												<th className='text-left p-3 min-w-[120px]'>Scores</th>
												<th className='text-left p-3 min-w-[80px]'>Test</th>
												<th className='text-left p-3 min-w-[120px]'>Test Results</th>
												<th className='text-left p-3 min-w-[100px]'>Status</th>
												<th className='text-left p-3 min-w-[120px]'>Student Status</th>
												{(userRole === 'superadmin' || userRole === 'sales') && (
													<th className='text-left p-3 min-w-[150px]'>Comment</th>
												)}
												<th className='text-left p-3 min-w-[120px]'>Interview Date</th>
												<th className='text-left p-3 min-w-[100px]'>Created</th>
												<th className='text-left p-3 min-w-[120px]'>Sales Person</th>
												<th className='text-left p-3 min-w-[100px]'>Actions</th>
											</tr>
										</thead>
										<tbody>
											{filteredStudents.map((student, index) => (
												<tr key={index} className='border-b hover:bg-gray-50'>
													<td className='p-3'>
														<div>
															<div className='font-medium'>
																{student.nom} {student.prenom}
															</div>
														</div>
													</td>
													<td className='p-3'>{student.mobile}</td>
													<td className='p-3'>
														<div className='text-sm'>
															<div>{BAC_TYPES.find((b) => b.value === student.bacType)?.label}</div>
															<div className='text-muted-foreground'>{student.anneeBac}</div>
														</div>
													</td>
													<td className='p-3'>
														<Badge>{student.specialite}</Badge>
													</td>
													<td className='p-3'>
														<div className='text-sm'>
															{student.specialite === 'LAC' && (
																<>
																	{student.moyenneGenerale && <div>Moy: {student.moyenneGenerale}</div>}
																	{student.maths && <div>Math: {student.maths}</div>}
																	{student.francais && <div>Fr: {student.francais}</div>}
																</>
															)}
															{(student.specialite === 'MASTER_MM' || student.specialite === 'MASTER_TD') && (
																<>
																	{student.licenceSpecialite && <div>Spec: {student.licenceSpecialite}</div>}
																	{student.university && <div>Univ: {student.university}</div>}
																</>
															)}
															{student.specialite === 'LINFO' && (
																<>
																	{student.moyenneGenerale && <div>Moy: {student.moyenneGenerale}</div>}
																	{student.maths && <div>Math: {student.maths}</div>}
																	{student.physique && <div>Phy: {student.physique}</div>}
																</>
															)}
															{student.specialite === 'LFC' && (
																<>
																	{student.moyenneGenerale && <div>Moy: {student.moyenneGenerale}</div>}
																	{student.maths && <div>Math: {student.maths}</div>}
																	{student.francais && <div>Fr: {student.francais}</div>}
																</>
															)}
														</div>
													</td>
													<td className='p-3'>
														{student.testRequired ? (
															<Badge variant='warning'>
																<AlertTriangle className='h-3 w-3 mr-1' />
																Required
															</Badge>
														) : (
															<Badge>
																<Check className='h-3 w-3 mr-1' />
																Not Required
															</Badge>
														)}
													</td>
													<td className='p-3'>
														<div className='text-sm'>
															{student.testScores && Object.keys(student.testScores).length > 0 ? (
																<div className='space-y-1'>
																	{Object.entries(student.testScores).map(
																		([key, value]) =>
																			value !== undefined &&
																			value !== null && (
																				<div key={key} className='flex justify-between'>
																					<span className='text-gray-600 capitalize'>
																						{key === 'maths'
																							? 'Math'
																							: key === 'logique'
																							? 'Logic'
																							: key === 'francais'
																							? 'Fr'
																							: key === 'cultureGenerale'
																							? 'Culture'
																							: key}
																						:
																					</span>
																					<span className='font-medium'>{value}</span>
																				</div>
																			)
																	)}
																</div>
															) : (
																<span className='text-gray-400'>No results</span>
															)}
														</div>
													</td>
													<td className='p-3'>
														<Badge variant={getValidationVariant(student.validation)}>
															{getValidationLabel(student.validation)}
														</Badge>
													</td>
													<td className='p-3'>
														<Badge variant={getStudentStatusVariant(student.studentStatus)}>
															{getStudentStatusLabel(student.studentStatus)}
														</Badge>
													</td>
													{(userRole === 'superadmin' || userRole === 'sales') && (
														<td className='p-3 text-sm text-muted-foreground max-w-48'>
															{student.validationComment ? (
																<div className='truncate' title={student.validationComment}>
																	{student.validationComment}
																</div>
															) : (
																<span className='text-gray-400 italic'>No comment</span>
															)}
														</td>
													)}
													<td className='p-3 text-sm text-muted-foreground'>
														{student.interviewDate ? (
															<div className='flex items-center gap-1'>
																<Calendar className='h-3 w-3' />
																{new Date(student.interviewDate).toLocaleDateString()}
															</div>
														) : (
															<span className='text-gray-400'>Not scheduled</span>
														)}
													</td>
													<td className='p-3 text-sm text-muted-foreground'>
														{student.dateCreated.toLocaleDateString()}
													</td>
													<td className='p-3 text-sm text-muted-foreground'>
														{getSalesPersonName(student.salesPersonId)}
													</td>
													<td className='p-3'>
														<div className='flex gap-2'>
															{/* Edit Button */}
															{(userRole === 'sales' && student.salesPersonId === salesPersonId) ||
															userRole === 'superadmin' ? (
																<Button
																	onClick={() => handleEdit(student)}
																	size='sm'
																	variant='outline'
																	className='p-2'>
																	<Edit2 className='h-3 w-3' />
																</Button>
															) : null}

															{/* Test Results Button - Only show if test required and no results yet */}
															{student.testRequired &&
																(!student.testScores || Object.keys(student.testScores).length === 0) && (
																	<Button
																		onClick={() => handleAddTestResults(student)}
																		size='sm'
																		variant='outline'
																		className='p-2 bg-yellow-50 hover:bg-yellow-100'>
																		<FileText className='h-3 w-3' />
																	</Button>
																)}

															{/* Interview Feedback Button - Only for SuperAdmin */}
															{userRole === 'superadmin' && (
																<Button
																	onClick={() => handleViewEvaluation(student)}
																	size='sm'
																	variant='outline'
																	disabled={loadingEvaluation}
																	className='p-2 bg-blue-50 hover:bg-blue-100'
																	title='Voir evaluation entretien'>
																	<Eye className='h-3 w-3' />
																</Button>
															)}

															{/* Delete Button - Only for SuperAdmin */}
															{userRole === 'superadmin' ? (
																<Button
																	onClick={() => handleDeleteClick(student)}
																	size='sm'
																	variant='outline'
																	className='p-2 text-red-600 hover:text-red-700 hover:bg-red-50'>
																	<Trash2 className='h-3 w-3' />
																</Button>
															) : null}
														</div>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</CardContent>
					</Card>
				</>
			)}

			{/* Delete Confirmation Modal */}
			<Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
				<DialogContent className='max-w-md'>
					<DialogHeader>
						<DialogTitle className='flex items-center gap-2 text-red-600'>
							<AlertTriangle className='h-5 w-5' />
							Confirm Deletion
						</DialogTitle>
					</DialogHeader>
					<div className='py-4'>
						<p className='text-gray-700 mb-4'>Are you sure you want to delete this student?</p>
						{studentToDelete && (
							<div className='bg-gray-50 p-3 rounded-lg'>
								<p className='font-medium'>
									{studentToDelete.nom} {studentToDelete.prenom}
								</p>
								<p className='text-sm text-gray-600'>
									{studentToDelete.specialite} • {studentToDelete.mobile}
								</p>
							</div>
						)}
						<p className='text-sm text-red-600 mt-3'>This action cannot be undone.</p>
					</div>
					<div className='flex gap-3 justify-end'>
						<Button type='button' variant='outline' onClick={handleCancelDelete}>
							Cancel
						</Button>
						<Button
							type='button'
							variant='destructive'
							onClick={handleConfirmDelete}
							className='bg-red-600 hover:bg-red-700'>
							<Trash2 className='h-4 w-4 mr-2' />
							Delete Student
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Interview Evaluation Modal */}
			<Dialog open={showEvaluationModal} onOpenChange={setShowEvaluationModal}>
				<DialogContent className='max-w-6xl max-h-[90vh] overflow-y-auto'>
					<DialogHeader>
						<DialogTitle className='flex items-center gap-2 text-blue-600'>
							<Eye className='h-5 w-5' />
							Évaluation d'Entretien
						</DialogTitle>
					</DialogHeader>
					
					{selectedEvaluation && (
						<div className='space-y-6 p-6'>
							{/* Student and Evaluation Info */}
							<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
								<Card>
									<CardHeader>
										<CardTitle className='text-lg'>Informations Évaluation</CardTitle>
									</CardHeader>
									<CardContent>
										<div className='space-y-2'>
											<p><strong>Évaluateur:</strong> {selectedEvaluation.membre_jury}</p>
											<p><strong>Date:</strong> {new Date(selectedEvaluation.date_evaluation).toLocaleDateString('fr-FR')}</p>
											<p><strong>Décision:</strong> 
												<Badge className={`ml-2 ${
													selectedEvaluation.decision_jury === 'admis' ? 'bg-green-100 text-green-800' :
													selectedEvaluation.decision_jury === 'non_admis' ? 'bg-red-100 text-red-800' :
													'bg-yellow-100 text-yellow-800'
												}`}>
													{selectedEvaluation.decision_jury === 'admis' ? 'Admis' :
													 selectedEvaluation.decision_jury === 'non_admis' ? 'Non Admis' : 'Indécis'}
												</Badge>
											</p>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle className='text-lg'>Scores d'Évaluation</CardTitle>
									</CardHeader>
									<CardContent>
										<div className='space-y-2'>
											{[
												{ label: 'Motivation Domaine', score: selectedEvaluation.motivation_domaine },
												{ label: 'Motivation IFAG', score: selectedEvaluation.motivation_ifag },
												{ label: 'Projet Études', score: selectedEvaluation.projet_etudes },
												{ label: 'Projet Professionnel', score: selectedEvaluation.projet_professionnel },
												{ label: 'Aisance Verbale', score: selectedEvaluation.aisance_verbale },
												{ label: 'Interaction Jury', score: selectedEvaluation.interaction_jury },
												{ label: 'Culture Générale', score: selectedEvaluation.culture_generale }
											].map(item => (
												<div key={item.label} className='flex items-center justify-between'>
													<span className='text-sm'>{item.label}:</span>
													<div className='flex items-center gap-1'>
														{[1, 2, 3, 4, 5].map(star => (
															<Star
																key={star}
																className={`h-3 w-3 ${
																	star <= item.score 
																		? 'text-yellow-500 fill-current' 
																		: 'text-gray-300'
																}`}
															/>
														))}
														<span className='ml-1 text-sm font-medium'>{item.score}/5</span>
													</div>
												</div>
											))}
										</div>
									</CardContent>
								</Card>
							</div>

							{/* Situation des Études */}
							<Card>
								<CardHeader>
									<CardTitle className='text-lg'>Situation des Études</CardTitle>
								</CardHeader>
								<CardContent>
									<p className='text-sm bg-gray-50 p-3 rounded'>{selectedEvaluation.situation_etudes}</p>
								</CardContent>
							</Card>

							{/* Detailed Comments */}
							<Card>
								<CardHeader>
									<CardTitle className='text-lg'>Commentaires Détaillés</CardTitle>
								</CardHeader>
								<CardContent>
									<div className='space-y-4'>
										{[
											{ label: 'Motivation Domaine', comment: selectedEvaluation.motivation_domaine_comment },
											{ label: 'Motivation IFAG', comment: selectedEvaluation.motivation_ifag_comment },
											{ label: 'Projet Études', comment: selectedEvaluation.projet_etudes_comment },
											{ label: 'Projet Professionnel', comment: selectedEvaluation.projet_professionnel_comment },
											{ label: 'Aisance Verbale', comment: selectedEvaluation.aisance_verbale_comment },
											{ label: 'Interaction Jury', comment: selectedEvaluation.interaction_jury_comment },
											{ label: 'Culture Générale', comment: selectedEvaluation.culture_generale_comment }
										].map(item => item.comment && (
											<div key={item.label}>
												<h4 className='font-medium mb-2'>{item.label}:</h4>
												<p className='text-sm bg-gray-50 p-3 rounded'>{item.comment}</p>
											</div>
										))}
									</div>
								</CardContent>
							</Card>

							{/* Global Comment */}
							<Card>
								<CardHeader>
									<CardTitle className='text-lg'>Commentaire Global</CardTitle>
								</CardHeader>
								<CardContent>
									<p className='text-sm bg-blue-50 p-3 rounded border-l-4 border-blue-400'>
										{selectedEvaluation.commentaire_global}
									</p>
								</CardContent>
							</Card>

							<div className='flex justify-end'>
								<Button 
									onClick={() => setShowEvaluationModal(false)}
									variant='outline'>
									Fermer
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
};
