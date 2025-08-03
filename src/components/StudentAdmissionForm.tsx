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
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { CalendarComponent } from './Calendar';

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
	dateCreated: Date;
	salesPersonId: number;
	interviewDate?: string;
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
}: {
	children: React.ReactNode;
	onClick?: () => void;
	variant?: 'default' | 'outline' | 'destructive';
	size?: 'default' | 'sm';
	disabled?: boolean;
	className?: string;
	type?: 'button' | 'submit';
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

const Badge = ({
	children,
	variant = 'default',
}: {
	children: React.ReactNode;
	variant?: 'default' | 'destructive' | 'outline' | 'warning' | 'secondary';
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
			className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
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
	const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
	const [filterSpecialite, setFilterSpecialite] = useState('');

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
		interviewDate: '',
	});

	const [showDropdowns, setShowDropdowns] = useState({
		bacType: false,
		anneeBac: false,
		specialite: false,
		validation: false,
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
			return formData.moyenneGenerale ? formData.moyenneGenerale < 12 : false;
		} else if (formData.specialite === 'LINFO') {
			if (formData.maths !== undefined && formData.physique !== undefined) {
				const average = (formData.maths + formData.physique) / 2;
				return average < 12;
			}
		}
		return false;
	}, [formData.specialite, formData.moyenneGenerale, formData.maths, formData.francais, formData.physique]);

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
			filtered = filtered.filter(
				(s) => s.dateCreated.toDateString() === new Date(selectedDate).toDateString()
			);
		}

		return filtered;
	}, [students, userRole, salesPersonId, filterSpecialite, selectedDate]);

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

	const handleDelete = (student: Student) => {
		if (student.id && onDeleteStudent) {
			if (confirm(`Are you sure you want to delete ${student.nom} ${student.prenom}?`)) {
				onDeleteStudent(student.id);
			}
		}
	};

	const handleDropdownSelect = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		setShowDropdowns((prev) => ({ ...prev, [field]: false }));
	};

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex justify-between items-center'>
				<div>
					<h2 className='text-2xl font-bold'>Student Admission Management</h2>
					<p className='text-muted-foreground'>Manage student applications and admissions</p>
				</div>
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
			</div>

			{/* Filters */}
			<Card>
				<CardHeader>
					<CardTitle className='text-lg'>Filters</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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
												onClick={() => setShowDropdowns((prev) => ({ ...prev, anneeBac: !prev.anneeBac }))}
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
												<span className={formData.specialite ? 'text-foreground' : 'text-muted-foreground'}>
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
												<span className={formData.validation ? 'text-foreground' : 'text-muted-foreground'}>
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

									{/* Validation Comment - Visible to all, editable by SuperAdmin only */}
									{(userRole === 'superadmin' || userRole === 'sales') && (
										<div>
											<label className='block text-sm font-medium mb-2'>Comment</label>
											<textarea
												value={formData.validationComment || ''}
												onChange={
													userRole === 'superadmin'
														? (e) => setFormData((prev) => ({ ...prev, validationComment: e.target.value }))
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
						<div className='overflow-x-auto'>
							<table className='w-full border-collapse'>
								<thead>
									<tr className='border-b'>
										<th className='text-left p-3'>Name</th>
										<th className='text-left p-3'>Mobile</th>
										<th className='text-left p-3'>Bac</th>
										<th className='text-left p-3'>Specialité</th>
										<th className='text-left p-3'>Scores</th>
										<th className='text-left p-3'>Test</th>
										<th className='text-left p-3'>Test Results</th>
										<th className='text-left p-3'>Status</th>
										{(userRole === 'superadmin' || userRole === 'sales') && (
											<th className='text-left p-3'>Comment</th>
										)}
										<th className='text-left p-3'>Interview Date</th>
										<th className='text-left p-3'>Created</th>
										<th className='text-left p-3'>Actions</th>
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

													{/* Delete Button - Only for SuperAdmin */}
													{userRole === 'superadmin' ? (
														<Button
															onClick={() => handleDelete(student)}
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
		</div>
	);
};
