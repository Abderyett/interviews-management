import React, { useState, useEffect } from 'react';
import {
	Eye,
	Star,
	FileText,
	Download,
	Search,
	Filter,
	ChevronDown,
	CheckCircle,
	XCircle,
	Clock,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

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
	// Student info from join
	student_nom?: string;
	student_prenom?: string;
	student_mobile?: string;
	student_specialite?: string;
	student_test_required?: boolean;
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
	const baseClasses =
		'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

	const variants = {
		default: 'bg-indigo-600 text-white hover:bg-indigo-700',
		outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
		ghost: 'hover:bg-accent hover:text-accent-foreground',
	};

	const sizes = {
		default: 'h-10 px-4 py-2',
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
	variant?: 'default' | 'destructive' | 'outline' | 'warning';
}) => {
	const variants = {
		default: 'bg-green-100 text-green-800',
		destructive: 'bg-red-100 text-red-800',
		outline: 'border border-gray-300 text-gray-700',
		warning: 'bg-yellow-100 text-yellow-800',
	};

	return (
		<span
			className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
			{children}
		</span>
	);
};

export const InterviewEvaluationsView: React.FC = () => {
	const [evaluations, setEvaluations] = useState<InterviewEvaluation[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedEvaluation, setSelectedEvaluation] = useState<InterviewEvaluation | null>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [filterDecision, setFilterDecision] = useState('');
	const [showFilters, setShowFilters] = useState(false);

	useEffect(() => {
		loadEvaluations();
	}, []);

	const loadEvaluations = async () => {
		try {
			setLoading(true);
			
			// Join with admission_students to get student details
			const { data, error } = await supabase
				.from('interview_evaluations')
				.select(`
					*,
					admission_students!interview_evaluations_student_id_fkey (
						nom,
						prenom,
						mobile,
						specialite,
						test_required
					)
				`)
				.order('created_at', { ascending: false });

			if (error) throw error;

			// Flatten the data structure
			const formattedEvaluations = data.map(evaluation => ({
				...evaluation,
				student_nom: evaluation.admission_students?.nom,
				student_prenom: evaluation.admission_students?.prenom,
				student_mobile: evaluation.admission_students?.mobile,
				student_specialite: evaluation.admission_students?.specialite,
				student_test_required: evaluation.admission_students?.test_required,
			}));

			setEvaluations(formattedEvaluations);
		} catch (error) {
			console.error('Error loading evaluations:', error);
		} finally {
			setLoading(false);
		}
	};

	const filteredEvaluations = evaluations.filter(evaluation => {
		const matchesSearch = 
			(evaluation.student_nom?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
			(evaluation.student_prenom?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
			(evaluation.membre_jury?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
		
		const matchesDecision = !filterDecision || evaluation.decision_jury === filterDecision;
		
		return matchesSearch && matchesDecision;
	});

	const getDecisionBadge = (decision: string) => {
		switch (decision) {
			case 'admis':
				return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Admis</Badge>;
			case 'non_admis':
				return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Non Admis</Badge>;
			case 'indecis':
				return <Badge variant="warning"><Clock className="h-3 w-3 mr-1" />Indecis</Badge>;
			default:
				return <Badge variant="outline">{decision}</Badge>;
		}
	};

	const getRatingColor = (rating: number) => {
		if (rating >= 4) return 'text-green-600';
		if (rating >= 3) return 'text-yellow-600';
		return 'text-red-600';
	};

	const exportEvaluation = (evaluation: InterviewEvaluation) => {
		const data = {
			student: `${evaluation.student_nom} ${evaluation.student_prenom}`,
			specialite: evaluation.student_specialite,
			mobile: evaluation.student_mobile,
			test_requis: evaluation.student_test_required ? 'Oui' : 'Non',
			evaluateur: evaluation.membre_jury,
			date_evaluation: new Date(evaluation.date_evaluation).toLocaleDateString('fr-FR'),
			decision: evaluation.decision_jury,
			situation_etudes: evaluation.situation_etudes,
			scores: {
				motivation_domaine: evaluation.motivation_domaine,
				motivation_ifag: evaluation.motivation_ifag,
				projet_etudes: evaluation.projet_etudes,
				projet_professionnel: evaluation.projet_professionnel,
				aisance_verbale: evaluation.aisance_verbale,
				interaction_jury: evaluation.interaction_jury,
				culture_generale: evaluation.culture_generale,
			},
			commentaires: {
				motivation_domaine: evaluation.motivation_domaine_comment,
				motivation_ifag: evaluation.motivation_ifag_comment,
				projet_etudes: evaluation.projet_etudes_comment,
				projet_professionnel: evaluation.projet_professionnel_comment,
				aisance_verbale: evaluation.aisance_verbale_comment,
				interaction_jury: evaluation.interaction_jury_comment,
				culture_generale: evaluation.culture_generale_comment,
				global: evaluation.commentaire_global,
			}
		};

		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `evaluation_${evaluation.student_nom}_${evaluation.student_prenom}.json`;
		a.click();
		URL.revokeObjectURL(url);
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
					<p>Chargement des evaluations...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<FileText className="h-6 w-6" />
						Evaluations d'Entretiens ({evaluations.length})
					</CardTitle>
				</CardHeader>
				<CardContent>
					{/* Search and Filters */}
					<div className="flex flex-col sm:flex-row gap-4 mb-6">
						<div className="flex-1">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
								<input
									type="text"
									placeholder="Rechercher par nom d'etudiant ou membre du jury..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
								/>
							</div>
						</div>
						<div className="relative">
							<Button
								variant="outline"
								onClick={() => setShowFilters(!showFilters)}
								className="flex items-center gap-2">
								<Filter className="h-4 w-4" />
								Filtres
								<ChevronDown className="h-4 w-4" />
							</Button>
							{showFilters && (
								<div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-10 p-2">
									<select
										value={filterDecision}
										onChange={(e) => setFilterDecision(e.target.value)}
										className="w-full p-2 border border-gray-300 rounded text-sm">
										<option value="">Toutes les decisions</option>
										<option value="admis">Admis</option>
										<option value="non_admis">Non Admis</option>
										<option value="indecis">Indecis</option>
									</select>
								</div>
							)}
						</div>
					</div>

					{/* Evaluations Table */}
					<div className="overflow-x-auto">
						<table className="w-full border-collapse">
							<thead>
								<tr className="border-b">
									<th className="text-left p-3 min-w-[150px]">Etudiant</th>
									<th className="text-left p-3 min-w-[100px]">Specialite</th>
									<th className="text-left p-3 min-w-[80px]">Test</th>
									<th className="text-left p-3 min-w-[120px]">Evaluateur</th>
									<th className="text-left p-3 min-w-[100px]">Decision</th>
									<th className="text-left p-3 min-w-[100px]">Scores Moy.</th>
									<th className="text-left p-3 min-w-[100px]">Date</th>
									<th className="text-left p-3 min-w-[100px]">Actions</th>
								</tr>
							</thead>
							<tbody>
								{filteredEvaluations.map((evaluation) => {
									const averageScore = Math.round((
										evaluation.motivation_domaine +
										evaluation.motivation_ifag +
										evaluation.projet_etudes +
										evaluation.projet_professionnel +
										evaluation.aisance_verbale +
										evaluation.interaction_jury +
										evaluation.culture_generale
									) / 7 * 10) / 10;

									return (
										<tr key={evaluation.id} className="border-b hover:bg-gray-50">
											<td className="p-3">
												<div>
													<div className="font-medium">
														{evaluation.student_nom} {evaluation.student_prenom}
													</div>
													<div className="text-sm text-gray-500">{evaluation.student_mobile}</div>
												</div>
											</td>
											<td className="p-3">
												<Badge>{evaluation.student_specialite}</Badge>
											</td>
											<td className="p-3">
												{evaluation.student_test_required ? (
													<Badge variant="warning">Requis</Badge>
												) : (
													<Badge variant="outline">Non requis</Badge>
												)}
											</td>
											<td className="p-3 text-sm">{evaluation.membre_jury}</td>
											<td className="p-3">{getDecisionBadge(evaluation.decision_jury)}</td>
											<td className="p-3">
												<span className={`font-medium ${getRatingColor(averageScore)}`}>
													{averageScore}/5
												</span>
											</td>
											<td className="p-3 text-sm text-gray-500">
												{new Date(evaluation.date_evaluation).toLocaleDateString('fr-FR')}
											</td>
											<td className="p-3">
												<div className="flex gap-2">
													<Button
														size="sm"
														variant="outline"
														onClick={() => setSelectedEvaluation(evaluation)}
														className="p-2">
														<Eye className="h-4 w-4" />
													</Button>
													<Button
														size="sm"
														variant="outline"
														onClick={() => exportEvaluation(evaluation)}
														className="p-2">
														<Download className="h-4 w-4" />
													</Button>
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>

						{filteredEvaluations.length === 0 && (
							<div className="text-center py-8 text-gray-500">
								Aucune evaluation trouvee.
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Detailed View Modal */}
			{selectedEvaluation && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
						<div className="px-6 py-4 border-b flex items-center justify-between">
							<h2 className="text-xl font-bold">
								Evaluation: {selectedEvaluation.student_nom} {selectedEvaluation.student_prenom}
							</h2>
							<Button
								variant="ghost"
								onClick={() => setSelectedEvaluation(null)}
								className="p-2">
								×
							</Button>
						</div>
						
						<div className="flex-1 overflow-y-auto px-6 py-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{/* Student Info */}
								<Card>
									<CardHeader>
										<CardTitle className="text-lg">Informations Etudiant</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-2">
											<p><strong>Nom:</strong> {selectedEvaluation.student_nom} {selectedEvaluation.student_prenom}</p>
											<p><strong>Mobile:</strong> {selectedEvaluation.student_mobile}</p>
											<p><strong>Specialite:</strong> {selectedEvaluation.student_specialite}</p>
											<p><strong>Test requis:</strong> {selectedEvaluation.student_test_required ? 'Oui' : 'Non'}</p>
										</div>
									</CardContent>
								</Card>

								{/* Evaluation Info */}
								<Card>
									<CardHeader>
										<CardTitle className="text-lg">Informations Evaluation</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-2">
											<p><strong>Evaluateur:</strong> {selectedEvaluation.membre_jury}</p>
											<p><strong>Date:</strong> {new Date(selectedEvaluation.date_evaluation).toLocaleDateString('fr-FR')}</p>
											<p><strong>Decision:</strong> {getDecisionBadge(selectedEvaluation.decision_jury)}</p>
										</div>
									</CardContent>
								</Card>
							</div>

							{/* Scores */}
							<Card className="mt-6">
								<CardHeader>
									<CardTitle className="text-lg">Scores d'Evaluation</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										{[
											{ key: 'motivation_domaine', label: 'Motivation Domaine', score: selectedEvaluation.motivation_domaine },
											{ key: 'motivation_ifag', label: 'Motivation IFAG', score: selectedEvaluation.motivation_ifag },
											{ key: 'projet_etudes', label: 'Projet Etudes', score: selectedEvaluation.projet_etudes },
											{ key: 'projet_professionnel', label: 'Projet Professionnel', score: selectedEvaluation.projet_professionnel },
											{ key: 'aisance_verbale', label: 'Aisance Verbale', score: selectedEvaluation.aisance_verbale },
											{ key: 'interaction_jury', label: 'Interaction Jury', score: selectedEvaluation.interaction_jury },
											{ key: 'culture_generale', label: 'Culture Generale', score: selectedEvaluation.culture_generale },
										].map(item => (
											<div key={item.key} className="flex items-center justify-between">
												<span>{item.label}:</span>
												<div className="flex items-center gap-1">
													{[1, 2, 3, 4, 5].map(star => (
														<Star
															key={star}
															className={`h-4 w-4 ${
																star <= item.score 
																	? 'text-yellow-500 fill-current' 
																	: 'text-gray-300'
															}`}
														/>
													))}
													<span className="ml-2 font-medium">{item.score}/5</span>
												</div>
											</div>
										))}
									</div>
								</CardContent>
							</Card>

							{/* Comments */}
							<Card className="mt-6">
								<CardHeader>
									<CardTitle className="text-lg">Commentaires Detailles</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										<div>
											<h4 className="font-medium mb-2">Situation des Etudes:</h4>
											<p className="text-sm bg-gray-50 p-3 rounded">{selectedEvaluation.situation_etudes}</p>
										</div>
										
										{[
											{ label: 'Motivation Domaine', comment: selectedEvaluation.motivation_domaine_comment },
											{ label: 'Motivation IFAG', comment: selectedEvaluation.motivation_ifag_comment },
											{ label: 'Projet Etudes', comment: selectedEvaluation.projet_etudes_comment },
											{ label: 'Projet Professionnel', comment: selectedEvaluation.projet_professionnel_comment },
											{ label: 'Aisance Verbale', comment: selectedEvaluation.aisance_verbale_comment },
											{ label: 'Interaction Jury', comment: selectedEvaluation.interaction_jury_comment },
											{ label: 'Culture Generale', comment: selectedEvaluation.culture_generale_comment },
										].map(item => item.comment && (
											<div key={item.label}>
												<h4 className="font-medium mb-2">{item.label}:</h4>
												<p className="text-sm bg-gray-50 p-3 rounded">{item.comment}</p>
											</div>
										))}

										<div>
											<h4 className="font-medium mb-2">Commentaire Global:</h4>
											<p className="text-sm bg-blue-50 p-3 rounded border-l-4 border-blue-400">
												{selectedEvaluation.commentaire_global}
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};