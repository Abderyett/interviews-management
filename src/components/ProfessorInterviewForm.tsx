import React, { useState, useEffect, useCallback } from 'react';
import {
	User,
	GraduationCap,
	Phone,
	Calendar,
	Star,
	ChevronLeft,
	ChevronRight,
	Save,
	X,
	ChevronDown,
	Cloud,
	CloudOff,
} from 'lucide-react';

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

interface ProfessorInterviewFormProps {
	student: Student;
	professorId: number;
	onSave: (evaluation: InterviewEvaluation) => void;
	onClose: () => void;
	isVisible: boolean;
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
	variant?: 'default' | 'outline' | 'ghost' | 'destructive';
	size?: 'default' | 'sm' | 'lg';
	disabled?: boolean;
	className?: string;
	type?: 'button' | 'submit';
}) => {
	const baseClasses =
		'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

	const variants = {
		default: 'bg-indigo-600 text-white hover:bg-indigo-700',
		outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
		ghost: 'hover:bg-accent hover:text-accent-foreground',
		destructive: 'bg-red-600 text-white hover:bg-red-700',
	};

	const sizes = {
		default: 'h-10 px-4 py-2',
		sm: 'h-8 px-3 text-sm',
		lg: 'h-12 px-6 text-base',
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

const JURY_MEMBERS = ['Siham Mansouri', 'Hana Benmerad', 'Imad Eddine Bedaida', 'Lydia Touati'];

const DECISION_OPTIONS = [
	{ value: 'admis', label: 'Admis(e)', color: 'text-green-600 bg-green-50' },
	{ value: 'non_admis', label: 'Non admis(e)', color: 'text-red-600 bg-red-50' },
	{ value: 'indecis', label: 'Indecis(e)', color: 'text-yellow-600 bg-yellow-50' },
];

const RatingInput = ({
	label,
	value,
	onChange,
	comment,
	onCommentChange,
}: {
	label: string;
	value: number;
	onChange: (value: number) => void;
	comment: string;
	onCommentChange: (comment: string) => void;
}) => {
	return (
		<div className='space-y-4'>
			<div>
				<label className='block text-lg font-medium text-gray-900 mb-4'>{label}</label>
				<div className='flex items-center space-x-2'>
					{[1, 2, 3, 4, 5].map((rating) => (
						<button
							key={rating}
							type='button'
							onClick={() => onChange(rating)}
							className={`p-2 rounded-full transition-colors ${
								value >= rating ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'
							}`}>
							<Star className={`h-8 w-8 ${value >= rating ? 'fill-current' : ''}`} />
						</button>
					))}
					<span className='ml-4 text-sm text-gray-600'>{value}/5</span>
				</div>
			</div>
			<div>
				<label className='block text-sm font-medium text-gray-700 mb-2'>Commentaire</label>
				<textarea
					value={comment}
					onChange={(e) => onCommentChange(e.target.value)}
					className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none'
					rows={3}
					placeholder='Ajoutez vos commentaires...'
				/>
			</div>
		</div>
	);
};

export const ProfessorInterviewForm: React.FC<ProfessorInterviewFormProps> = ({
	student,
	professorId,
	onSave,
	onClose,
	isVisible,
}) => {
	const [currentStep, setCurrentStep] = useState(0);
	const [showDropdown, setShowDropdown] = useState({ jury: false, decision: false });

	const [formData, setFormData] = useState<Partial<InterviewEvaluation>>({
		studentId: student.id || 0,
		professorId,
		situationEtudes: '',
		motivationDomaine: 0,
		motivationDomaineComment: '',
		motivationIFAG: 0,
		motivationIFAGComment: '',
		projetEtudes: 0,
		projetEtudesComment: '',
		projetProfessionnel: 0,
		projetProfessionnelComment: '',
		aisanceVerbale: 0,
		aisanceVerbaleComment: '',
		interactionJury: 0,
		interactionJuryComment: '',
		cultureGenerale: 0,
		cultureGeneraleComment: '',
		decisionJury: 'indecis',
		commentaireGlobal: '',
		membreJury: '',
		dateEvaluation: new Date(),
	});

	// Auto-save state
	const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
	const [lastSaved, setLastSaved] = useState<Date | null>(null);

	// Generate unique localStorage key for this evaluation
	const storageKey = `professor_evaluation_${professorId}_${student.id}`;

	// Load saved data from localStorage on component mount
	useEffect(() => {
		const savedData = localStorage.getItem(storageKey);
		if (savedData) {
			try {
				const parsedData = JSON.parse(savedData);
				setFormData((prev) => ({
					...prev,
					...parsedData,
					// Keep student and professor IDs from props
					studentId: student.id || 0,
					professorId,
					dateEvaluation: parsedData.dateEvaluation ? new Date(parsedData.dateEvaluation) : new Date(),
				}));
				setLastSaved(new Date(parsedData._lastSaved));
				console.debug('Restored evaluation data from localStorage');
			} catch (error) {
				console.warn('Failed to restore evaluation data:', error);
				localStorage.removeItem(storageKey);
			}
		}
	}, [storageKey, student.id, professorId]);

	// Debounced save to localStorage
	const debouncedSave = useCallback((data: Partial<InterviewEvaluation>) => {
		const saveTimer = setTimeout(() => {
			try {
				setAutoSaveStatus('saving');
				const dataToSave = {
					...data,
					_lastSaved: new Date().toISOString(),
				};
				localStorage.setItem(storageKey, JSON.stringify(dataToSave));
				setAutoSaveStatus('saved');
				setLastSaved(new Date());
				console.debug('Auto-saved evaluation data');
			} catch (error) {
				console.error('Failed to auto-save evaluation data:', error);
				setAutoSaveStatus('error');
			}
		}, 1000); // 1 second debounce

		return () => clearTimeout(saveTimer);
	}, [storageKey]);

	// Auto-save whenever form data changes
	useEffect(() => {
		const cleanup = debouncedSave(formData);
		return cleanup;
	}, [formData, debouncedSave]);

	// Clear localStorage data after successful submission
	const clearStoredData = useCallback(() => {
		localStorage.removeItem(storageKey);
		setLastSaved(null);
		setAutoSaveStatus('saved');
		console.debug('Cleared stored evaluation data');
	}, [storageKey]);

	// Note: We keep localStorage data even if form is closed without submission
	// This allows professors to recover their work if they accidentally close the form
	// Data is only cleared on successful submission via handleSave

	const steps = [
		{
			title: 'Informations Etudiant',
			component: (
				<div className='space-y-6'>
					<div className='text-center mb-8'>
						<div className='w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4'>
							<User className='h-8 w-8 text-indigo-600' />
						</div>
						<h2 className='text-2xl font-bold text-gray-900'>
							{student.nom} {student.prenom}
						</h2>
						<p className='text-gray-600'>Informations du candidat</p>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						<div className='space-y-4'>
							<div className='flex items-center p-4 bg-gray-50 rounded-lg'>
								<Phone className='h-5 w-5 text-gray-400 mr-3' />
								<div>
									<p className='text-sm text-gray-600'>Mobile</p>
									<p className='font-medium'>{student.mobile}</p>
								</div>
							</div>

							<div className='flex items-center p-4 bg-gray-50 rounded-lg'>
								<GraduationCap className='h-5 w-5 text-gray-400 mr-3' />
								<div>
									<p className='text-sm text-gray-600'>Baccalaureat</p>
									<p className='font-medium'>
										{student.bacType} - {student.anneeBac}
									</p>
								</div>
							</div>

							<div className='flex items-center p-4 bg-gray-50 rounded-lg'>
								<Calendar className='h-5 w-5 text-gray-400 mr-3' />
								<div>
									<p className='text-sm text-gray-600'>Specialite</p>
									<p className='font-medium'>{student.specialite}</p>
								</div>
							</div>
						</div>

						<div className='space-y-4'>
							{student.moyenneGenerale && (
								<div className='p-4 bg-blue-50 rounded-lg'>
									<p className='text-sm text-blue-600 mb-2'>Notes Academiques</p>
									<div className='space-y-1'>
										<p>Moyenne Generale: {student.moyenneGenerale}</p>
										{student.maths && <p>Mathematiques: {student.maths}</p>}
										{student.francais && <p>Francais: {student.francais}</p>}
										{student.physique && <p>Physique: {student.physique}</p>}
									</div>
								</div>
							)}

							{student.testRequired && (
								<div className='p-4 bg-yellow-50 rounded-lg'>
									<p className='text-sm text-yellow-600 mb-2'>Necessite de passer un test</p>
									<div className='space-y-1'>
										<p className='text-yellow-700 font-medium'>Oui - Test requis</p>
										{student.testScores && Object.keys(student.testScores).length > 0 && (
											<div className='mt-2'>
												<p className='text-sm text-yellow-600 mb-1'>Scores obtenus:</p>
												{Object.entries(student.testScores).map(([key, value]) => (
													<p key={key} className='text-sm'>
														{key.charAt(0).toUpperCase() + key.slice(1)}: {value}
													</p>
												))}
											</div>
										)}
									</div>
								</div>
							)}

							{(student.licenceSpecialite || student.university) && (
								<div className='p-4 bg-green-50 rounded-lg'>
									<p className='text-sm text-green-600 mb-2'>Formation Anterieure</p>
									{student.licenceSpecialite && <p>Specialite: {student.licenceSpecialite}</p>}
									{student.university && <p>Universite: {student.university}</p>}
								</div>
							)}
						</div>
					</div>
				</div>
			),
		},
		{
			title: 'Situation des Etudes',
			component: (
				<div className='space-y-6'>
					<div className='text-center mb-8'>
						<h2 className='text-2xl font-bold text-gray-900'>Situation des études à l'université</h2>
						<p className='text-gray-600'>
							Situation des études à l'université année validée? abandon? résultats des années passées? Qu'a
							fait l'étudiant(e) après l'abandon/le blocage de l'année?
						</p>
					</div>

					<div>
						<textarea
							value={formData.situationEtudes || ''}
							onChange={(e) => setFormData((prev) => ({ ...prev, situationEtudes: e.target.value }))}
							className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-lg'
							rows={8}
							placeholder="Decrivez la situation académique de l'étudiant(e)..."
						/>
					</div>
				</div>
			),
		},
		{
			title: 'Motivation - Domaine',
			component: (
				<div className='space-y-6'>
					<div className='text-center mb-8'>
						<h2 className='text-2xl font-bold text-gray-900'>
							Motivation à mener des études dans le domaine
						</h2>
					</div>

					<RatingInput
						label=''
						value={formData.motivationDomaine || 0}
						onChange={(value) => setFormData((prev) => ({ ...prev, motivationDomaine: value }))}
						comment={formData.motivationDomaineComment || ''}
						onCommentChange={(comment) =>
							setFormData((prev) => ({ ...prev, motivationDomaineComment: comment }))
						}
					/>
				</div>
			),
		},
		{
			title: 'Motivation - IFAG',
			component: (
				<div className='space-y-6'>
					<div className='text-center mb-8'>
						<h2 className='text-2xl font-bold text-gray-900'>Motivation a rejoindre l'IFAG</h2>
						<p className='text-gray-600'>
							Motivation à rejoindre l'IFAG, y compris la connaissance de l'école et du programme
						</p>
					</div>

					<RatingInput
						label=''
						value={formData.motivationIFAG || 0}
						onChange={(value) => setFormData((prev) => ({ ...prev, motivationIFAG: value }))}
						comment={formData.motivationIFAGComment || ''}
						onCommentChange={(comment) =>
							setFormData((prev) => ({ ...prev, motivationIFAGComment: comment }))
						}
					/>
				</div>
			),
		},
		{
			title: 'Projet d Etudes',
			component: (
				<div className='space-y-6'>
					<div className='text-center mb-8'>
						<h2 className='text-2xl font-bold text-gray-900'>Projet d'études</h2>
						<p className='text-gray-600'>Maturité, cohérence avec le programme</p>
					</div>

					<RatingInput
						label=''
						value={formData.projetEtudes || 0}
						onChange={(value) => setFormData((prev) => ({ ...prev, projetEtudes: value }))}
						comment={formData.projetEtudesComment || ''}
						onCommentChange={(comment) => setFormData((prev) => ({ ...prev, projetEtudesComment: comment }))}
					/>
				</div>
			),
		},
		{
			title: 'Projet Professionnel',
			component: (
				<div className='space-y-6'>
					<div className='text-center mb-8'>
						<h2 className='text-2xl font-bold text-gray-900'>Projet Professionnel</h2>
						<p className='text-gray-600'>
							(Maturité, cohérence avec le programme) / Spécialité pour les candidats IT
						</p>
					</div>

					<RatingInput
						label=''
						value={formData.projetProfessionnel || 0}
						onChange={(value) => setFormData((prev) => ({ ...prev, projetProfessionnel: value }))}
						comment={formData.projetProfessionnelComment || ''}
						onCommentChange={(comment) =>
							setFormData((prev) => ({ ...prev, projetProfessionnelComment: comment }))
						}
					/>
				</div>
			),
		},
		{
			title: 'Aisance Verbale',
			component: (
				<div className='space-y-6'>
					<div className='text-center mb-8'>
						<h2 className='text-2xl font-bold text-gray-900'>Aisance Verbale</h2>
						<p className='text-gray-600'> (expression orale, capacité de synthèse, vocabulaire)</p>
					</div>

					<RatingInput
						label=''
						value={formData.aisanceVerbale || 0}
						onChange={(value) => setFormData((prev) => ({ ...prev, aisanceVerbale: value }))}
						comment={formData.aisanceVerbaleComment || ''}
						onCommentChange={(comment) =>
							setFormData((prev) => ({ ...prev, aisanceVerbaleComment: comment }))
						}
					/>
				</div>
			),
		},
		{
			title: 'Interaction avec le Jury',
			component: (
				<div className='space-y-6'>
					<div className='text-center mb-8'>
						<h2 className='text-2xl font-bold text-gray-900'>Interaction avec le Jury</h2>
						<p className='text-gray-600'>Posture, maturité du profil, capacité d'écoute...</p>
					</div>

					<RatingInput
						label=''
						value={formData.interactionJury || 0}
						onChange={(value) => setFormData((prev) => ({ ...prev, interactionJury: value }))}
						comment={formData.interactionJuryComment || ''}
						onCommentChange={(comment) =>
							setFormData((prev) => ({ ...prev, interactionJuryComment: comment }))
						}
					/>
				</div>
			),
		},
		{
			title: 'Culture Générale',
			component: (
				<div className='space-y-6'>
					<div className='text-center mb-8'>
						<h2 className='text-2xl font-bold text-gray-900'>Culture générale et centres d'intérêts</h2>
						<p className='text-gray-600'>Sport, musique, lecture...</p>
					</div>

					<RatingInput
						label=''
						value={formData.cultureGenerale || 0}
						onChange={(value) => setFormData((prev) => ({ ...prev, cultureGenerale: value }))}
						comment={formData.cultureGeneraleComment || ''}
						onCommentChange={(comment) =>
							setFormData((prev) => ({ ...prev, cultureGeneraleComment: comment }))
						}
					/>
				</div>
			),
		},
		{
			title: 'Decision Finale',
			component: (
				<div className='space-y-6'>
					<div className='text-center mb-8'>
						<h2 className='text-2xl font-bold text-gray-900'>Decision du Jury</h2>
						<p className='text-sm text-gray-600 mt-2'>
							Tous les champs sont optionnels. Vous pouvez sauvegarder une évaluation partielle.
						</p>
					</div>

					<div className='space-y-6'>
						{/* Decision Dropdown */}
						<div>
							<label className='block text-lg font-medium text-gray-900 mb-4'>Decision jury (optionnel)</label>
							<div className='relative'>
								<button
									type='button'
									onClick={() => setShowDropdown((prev) => ({ ...prev, decision: !prev.decision }))}
									className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center justify-between text-left'>
									<span className={formData.decisionJury ? 'text-foreground' : 'text-muted-foreground'}>
										{formData.decisionJury
											? DECISION_OPTIONS.find((d) => d.value === formData.decisionJury)?.label
											: 'Selectionner une decision'}
									</span>
									<ChevronDown className='h-4 w-4' />
								</button>

								{showDropdown.decision && (
									<div className='absolute z-50 top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg'>
										{DECISION_OPTIONS.map((option) => (
											<button
												key={option.value}
												type='button'
												onClick={() => {
													setFormData((prev) => ({ ...prev, decisionJury: option.value as 'admis' | 'non_admis' | 'indecis' }));
													setShowDropdown((prev) => ({ ...prev, decision: false }));
												}}
												className={`w-full px-4 py-3 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg ${option.color}`}>
												{option.label}
											</button>
										))}
									</div>
								)}
							</div>
						</div>

						{/* Jury Member Dropdown */}
						<div>
							<label className='block text-lg font-medium text-gray-900 mb-4'>Membre du jury (optionnel)</label>
							<div className='relative'>
								<button
									type='button'
									onClick={() => setShowDropdown((prev) => ({ ...prev, jury: !prev.jury }))}
									className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center justify-between text-left'>
									<span className={formData.membreJury ? 'text-foreground' : 'text-muted-foreground'}>
										{formData.membreJury || 'Selectionner un membre du jury'}
									</span>
									<ChevronDown className='h-4 w-4' />
								</button>

								{showDropdown.jury && (
									<div className='absolute z-50 top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg'>
										{JURY_MEMBERS.map((member) => (
											<button
												key={member}
												type='button'
												onClick={() => {
													setFormData((prev) => ({ ...prev, membreJury: member }));
													setShowDropdown((prev) => ({ ...prev, jury: false }));
												}}
												className='w-full px-4 py-3 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg'>
												{member}
											</button>
										))}
									</div>
								)}
							</div>
						</div>

						{/* Global Comment */}
						<div>
							<label className='block text-lg font-medium text-gray-900 mb-4'>
								Commentaire global (optionnel)
							</label>
							<p className='text-sm text-gray-500 mb-2'>
								Appréciation globale de l'entrevue, justification de la décision
							</p>
							<textarea
								value={formData.commentaireGlobal || ''}
								onChange={(e) => setFormData((prev) => ({ ...prev, commentaireGlobal: e.target.value }))}
								className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none'
								rows={6}
								placeholder='Ajoutez vos commentaires finaux et la justification de votre decision...'
							/>
						</div>
					</div>
				</div>
			),
		},
	];

	const handleSave = () => {
		// Validate student ID exists and is valid
		if (!student.id || student.id === 0) {
			alert('Erreur: ID etudiant manquant. Impossible de sauvegarder l\'evaluation.');
			console.error('Student ID missing:', student);
			return;
		}

		// Optional validation: Show warning if critical fields are missing, but allow submission
		const missingCriticalFields = [];
		if (!formData.membreJury) missingCriticalFields.push('Membre du jury');
		if (!formData.decisionJury || formData.decisionJury === 'indecis') missingCriticalFields.push('Décision finale');
		
		if (missingCriticalFields.length > 0) {
			const proceed = window.confirm(
				`Attention: Les champs suivants ne sont pas remplis: ${missingCriticalFields.join(', ')}.\n\nVoulez-vous continuer la sauvegarde ?`
			);
			if (!proceed) {
				return;
			}
		}

		// Ensure studentId is properly set
		const evaluationData = {
			...formData,
			studentId: student.id
		} as InterviewEvaluation;

		console.debug('Saving evaluation for student ID:', student.id, 'Student name:', student.nom, student.prenom);
		
		// Clear localStorage data before submitting
		clearStoredData();
		
		onSave(evaluationData);
	};

	const nextStep = () => {
		if (currentStep < steps.length - 1) {
			setCurrentStep(currentStep + 1);
		}
	};

	const prevStep = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	if (!isVisible) return null;

	// Show warning if student ID is missing
	if (!student.id || student.id === 0) {
		return (
			<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
				<div className='bg-white rounded-xl max-w-md w-full p-6'>
					<div className='text-center'>
						<div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
							<X className='h-8 w-8 text-red-600' />
						</div>
						<h2 className='text-xl font-bold text-gray-900 mb-2'>Erreur</h2>
						<p className='text-gray-600 mb-4'>
							Impossible d'ouvrir le formulaire d'evaluation: ID etudiant manquant.
							L'etudiant doit etre correctement lie au systeme d'admission.
						</p>
						<div className='text-sm text-gray-500 mb-4'>
							Etudiant: {student.nom} {student.prenom}
						</div>
						<Button onClick={onClose} variant='outline'>
							Fermer
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
			<div className='bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
				{/* Header */}
				<div className='px-6 py-4 border-b flex items-center justify-between'>
					<div className='flex items-center space-x-4'>
						<h1 className='text-xl font-bold text-gray-900'>Evaluation d'entretien</h1>
						<div className='flex items-center space-x-4'>
							<div className='flex items-center space-x-2'>
								<div className='text-sm text-gray-500'>
									{currentStep + 1} / {steps.length}
								</div>
								<div className='w-32 bg-gray-200 rounded-full h-2'>
									<div
										className='bg-indigo-600 h-2 rounded-full transition-all duration-300'
										style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}></div>
								</div>
							</div>
							
							{/* Auto-save indicator */}
							<div className='flex items-center space-x-2'>
								{autoSaveStatus === 'saving' && (
									<>
										<CloudOff className='h-4 w-4 text-yellow-500 animate-pulse' />
										<span className='text-xs text-yellow-600'>Sauvegarde...</span>
									</>
								)}
								{autoSaveStatus === 'saved' && lastSaved && (
									<>
										<Cloud className='h-4 w-4 text-green-500' />
										<span className='text-xs text-green-600'>
											Sauvé {lastSaved.toLocaleTimeString()}
										</span>
									</>
								)}
								{autoSaveStatus === 'error' && (
									<>
										<CloudOff className='h-4 w-4 text-red-500' />
										<span className='text-xs text-red-600'>Erreur sauvegarde</span>
									</>
								)}
							</div>
						</div>
					</div>
					<div className='flex items-center space-x-2'>
						{lastSaved && (
							<button
								onClick={() => {
									if (window.confirm('Êtes-vous sûr de vouloir supprimer le brouillon sauvegardé et recommencer ?')) {
										clearStoredData();
										// Reset form to initial state
										setFormData({
											studentId: student.id || 0,
											professorId,
											situationEtudes: '',
											motivationDomaine: 0,
											motivationDomaineComment: '',
											motivationIFAG: 0,
											motivationIFAGComment: '',
											projetEtudes: 0,
											projetEtudesComment: '',
											projetProfessionnel: 0,
											projetProfessionnelComment: '',
											aisanceVerbale: 0,
											aisanceVerbaleComment: '',
											interactionJury: 0,
											interactionJuryComment: '',
											cultureGenerale: 0,
											cultureGeneraleComment: '',
											decisionJury: 'indecis',
											commentaireGlobal: '',
											membreJury: '',
											dateEvaluation: new Date(),
										});
										setCurrentStep(0);
									}
								}}
								className='text-xs text-orange-600 hover:text-orange-700 px-2 py-1 border border-orange-300 rounded transition-colors'
								title='Supprimer le brouillon et recommencer'>
								Nouveau brouillon
							</button>
						)}
						<button onClick={onClose} className='text-gray-400 hover:text-gray-600 transition-colors'>
							<X className='h-6 w-6' />
						</button>
					</div>
				</div>

				{/* Data restoration notification */}
				{lastSaved && (
					<div className='px-6 py-3 bg-blue-50 border-b border-blue-200'>
						<div className='flex items-center space-x-2'>
							<Cloud className='h-4 w-4 text-blue-600' />
							<span className='text-sm text-blue-800'>
								Données d'évaluation restaurées depuis la dernière sauvegarde ({lastSaved.toLocaleString()})
							</span>
						</div>
					</div>
				)}

				{/* Content */}
				<div className='flex-1 overflow-y-auto px-6 py-8'>
					<div className='max-w-2xl mx-auto'>{steps[currentStep].component}</div>
				</div>

				{/* Footer */}
				<div className='px-6 py-4 border-t flex items-center justify-between'>
					<Button
						onClick={prevStep}
						disabled={currentStep === 0}
						variant='outline'
						className='flex items-center space-x-2'>
						<ChevronLeft className='h-4 w-4' />
						<span>Précedent</span>
					</Button>

					<div className='flex items-center space-x-2'>
						{currentStep === steps.length - 1 ? (
							<Button onClick={handleSave} className='flex items-center space-x-2'>
								<Save className='h-4 w-4' />
								<span>Sauvegarder l'évaluation</span>
							</Button>
						) : (
							<Button onClick={nextStep} className='flex items-center space-x-2'>
								<span>Suivant</span>
								<ChevronRight className='h-4 w-4' />
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};
