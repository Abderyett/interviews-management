import React, { useState, useMemo } from 'react';
import { 
	Search, 
	Users, 
	Phone, 
	GraduationCap, 
	Calendar,
	CheckCircle,
	Clock,
	XCircle,
	User,
	FileText,
	Filter,
	X,
	Edit
} from 'lucide-react';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './ui/select';

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
	testStartTime?: string;
	testEndTime?: string;
	testStatus?: 'not_started' | 'in_progress' | 'completed' | 'absent';
	testDuration?: number;
	presenceStatus?: 'not_checked' | 'present' | 'absent' | 'late';
	presenceCheckedAt?: string;
	presenceCheckedBy?: string;
	interviewStatus?: 'not_registered' | 'in_queue' | 'interviewing' | 'completed';
	interviewQueueNumber?: number;
	interviewCompletedTime?: string;
	studentId?: string;
	name?: string;
	studentRegistryId?: string;
}

interface SalesStudentManagementProps {
	students: AdmissionStudent[];
	salesPersonId?: number;
	onUpdateStudent?: (student: AdmissionStudent) => void;
}

export const SalesStudentManagement: React.FC<SalesStudentManagementProps> = ({
	students,
	salesPersonId,
	onUpdateStudent
}) => {
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedSpeciality, setSelectedSpeciality] = useState('all');
	const [selectedValidationStatus, setSelectedValidationStatus] = useState('all');
	const [selectedStudentStatus, setSelectedStudentStatus] = useState('all');
	const [showFilters, setShowFilters] = useState(false);

	// Filter students by salesPersonId
	const myStudents = useMemo(() => {
		return students.filter(student => student.salesPersonId === salesPersonId);
	}, [students, salesPersonId]);

	// Get unique specialities for filter dropdown
	const specialities = useMemo(() => {
		const unique = [...new Set(myStudents.map(student => student.specialite).filter(Boolean))];
		return unique.sort();
	}, [myStudents]);

	// Apply search and filters
	const filteredStudents = useMemo(() => {
		let filtered = myStudents;

		// Search filter
		if (searchTerm.trim()) {
			const searchLower = searchTerm.toLowerCase().trim();
			filtered = filtered.filter(student => 
				student.nom.toLowerCase().includes(searchLower) ||
				student.prenom.toLowerCase().includes(searchLower) ||
				`${student.nom} ${student.prenom}`.toLowerCase().includes(searchLower) ||
				student.mobile.includes(searchTerm.trim()) ||
				student.specialite.toLowerCase().includes(searchLower) ||
				student.bacType.toLowerCase().includes(searchLower)
			);
		}

		// Speciality filter
		if (selectedSpeciality && selectedSpeciality !== 'all') {
			filtered = filtered.filter(student => student.specialite === selectedSpeciality);
		}

		// Validation status filter
		if (selectedValidationStatus && selectedValidationStatus !== 'all') {
			filtered = filtered.filter(student => student.validation === selectedValidationStatus);
		}

		// Student status filter
		if (selectedStudentStatus && selectedStudentStatus !== 'all') {
			filtered = filtered.filter(student => student.studentStatus === selectedStudentStatus);
		}

		// Sort by most recent first
		return filtered.sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());
	}, [myStudents, searchTerm, selectedSpeciality, selectedValidationStatus, selectedStudentStatus]);

	// Statistics
	const stats = useMemo(() => {
		return {
			total: myStudents.length,
			pending: myStudents.filter(s => s.validation === 'pending').length,
			accepted: myStudents.filter(s => s.validation === 'accepted').length,
			rejected: myStudents.filter(s => s.validation === 'rejected').length,
			inscrit: myStudents.filter(s => s.studentStatus === 'inscrit').length,
			enCours: myStudents.filter(s => s.studentStatus === 'en_cours').length,
			abandonner: myStudents.filter(s => s.studentStatus === 'abandonner').length,
		};
	}, [myStudents]);

	const getValidationStatusIcon = (status: string | undefined) => {
		switch (status) {
			case 'accepted':
				return <CheckCircle className="h-4 w-4 text-green-600" />;
			case 'rejected':
				return <XCircle className="h-4 w-4 text-red-600" />;
			case 'pending':
			default:
				return <Clock className="h-4 w-4 text-yellow-600" />;
		}
	};

	const getValidationStatusColor = (status: string | undefined) => {
		switch (status) {
			case 'accepted':
				return 'bg-green-50 text-green-800 border-green-200';
			case 'rejected':
				return 'bg-red-50 text-red-800 border-red-200';
			case 'pending':
			default:
				return 'bg-yellow-50 text-yellow-800 border-yellow-200';
		}
	};

	const getStudentStatusIcon = (status: string | undefined) => {
		switch (status) {
			case 'inscrit':
				return <CheckCircle className="h-4 w-4 text-green-600" />;
			case 'abandonner':
				return <XCircle className="h-4 w-4 text-red-600" />;
			case 'en_cours':
			default:
				return <Clock className="h-4 w-4 text-blue-600" />;
		}
	};

	const getStudentStatusColor = (status: string | undefined) => {
		switch (status) {
			case 'inscrit':
				return 'bg-green-50 text-green-800 border-green-200';
			case 'abandonner':
				return 'bg-red-50 text-red-800 border-red-200';
			case 'en_cours':
			default:
				return 'bg-blue-50 text-blue-800 border-blue-200';
		}
	};

	const clearFilters = () => {
		setSearchTerm('');
		setSelectedSpeciality('all');
		setSelectedValidationStatus('all');
		setSelectedStudentStatus('all');
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<Users className="h-6 w-6 text-green-600" />
					<div>
						<h2 className="text-2xl font-semibold">My Students</h2>
						<p className="text-sm text-gray-500">Manage and view all your students</p>
					</div>
				</div>
				<button
					onClick={() => setShowFilters(!showFilters)}
					className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
						showFilters 
							? 'bg-green-600 text-white border-green-600' 
							: 'border-gray-300 text-gray-700 hover:bg-gray-50'
					}`}>
					<Filter className="h-4 w-4" />
					{showFilters ? 'Hide Filters' : 'Show Filters'}
				</button>
			</div>

			{/* Statistics Cards */}
			<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
				<div className="bg-white rounded-lg border p-4">
					<div className="flex items-center gap-2">
						<Users className="h-5 w-5 text-gray-600" />
						<span className="text-sm font-medium text-gray-600">Total</span>
					</div>
					<div className="text-2xl font-bold text-gray-900">{stats.total}</div>
				</div>
				<div className="bg-white rounded-lg border p-4">
					<div className="flex items-center gap-2">
						<Clock className="h-5 w-5 text-yellow-600" />
						<span className="text-sm font-medium text-yellow-600">Pending</span>
					</div>
					<div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
				</div>
				<div className="bg-white rounded-lg border p-4">
					<div className="flex items-center gap-2">
						<CheckCircle className="h-5 w-5 text-green-600" />
						<span className="text-sm font-medium text-green-600">Accepted</span>
					</div>
					<div className="text-2xl font-bold text-green-900">{stats.accepted}</div>
				</div>
				<div className="bg-white rounded-lg border p-4">
					<div className="flex items-center gap-2">
						<XCircle className="h-5 w-5 text-red-600" />
						<span className="text-sm font-medium text-red-600">Rejected</span>
					</div>
					<div className="text-2xl font-bold text-red-900">{stats.rejected}</div>
				</div>
				<div className="bg-white rounded-lg border p-4">
					<div className="flex items-center gap-2">
						<CheckCircle className="h-5 w-5 text-green-600" />
						<span className="text-sm font-medium text-green-600">Inscrit</span>
					</div>
					<div className="text-2xl font-bold text-green-900">{stats.inscrit}</div>
				</div>
				<div className="bg-white rounded-lg border p-4">
					<div className="flex items-center gap-2">
						<Clock className="h-5 w-5 text-blue-600" />
						<span className="text-sm font-medium text-blue-600">En Cours</span>
					</div>
					<div className="text-2xl font-bold text-blue-900">{stats.enCours}</div>
				</div>
				<div className="bg-white rounded-lg border p-4">
					<div className="flex items-center gap-2">
						<XCircle className="h-5 w-5 text-red-600" />
						<span className="text-sm font-medium text-red-600">Abandonner</span>
					</div>
					<div className="text-2xl font-bold text-red-900">{stats.abandonner}</div>
				</div>
			</div>

			{/* Search and Filters */}
			<div className="bg-white rounded-lg border p-4 space-y-4">
				{/* Search */}
				<div className="relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
					<input
						type="text"
						placeholder="Search students by name, mobile, speciality, or bac type..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
					/>
					{searchTerm && (
						<button
							onClick={() => setSearchTerm('')}
							className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
						>
							<X className="h-4 w-4" />
						</button>
					)}
				</div>

				{/* Filters */}
				{showFilters && (
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Speciality</label>
							<Select
								value={selectedSpeciality}
								onValueChange={(value) => setSelectedSpeciality(value)}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="All Specialities" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Specialities</SelectItem>
									{specialities.map(speciality => (
										<SelectItem key={speciality} value={speciality}>{speciality}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Validation Status</label>
							<Select
								value={selectedValidationStatus}
								onValueChange={(value) => setSelectedValidationStatus(value)}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="All Validation Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Validation Status</SelectItem>
									<SelectItem value="pending">Pending</SelectItem>
									<SelectItem value="accepted">Accepted</SelectItem>
									<SelectItem value="rejected">Rejected</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Student Status</label>
							<Select
								value={selectedStudentStatus}
								onValueChange={(value) => setSelectedStudentStatus(value)}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="All Student Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Student Status</SelectItem>
									<SelectItem value="en_cours">En Cours</SelectItem>
									<SelectItem value="inscrit">Inscrit</SelectItem>
									<SelectItem value="abandonner">Abandonner</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="md:col-span-3 flex justify-end">
							<button
								onClick={clearFilters}
								className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
							>
								<X className="h-4 w-4" />
								Clear Filters
							</button>
						</div>
					</div>
				)}

				{/* Results info */}
				<div className="flex items-center justify-between text-sm text-gray-600">
					<span>
						Showing {filteredStudents.length} of {myStudents.length} students
					</span>
					{(searchTerm || (selectedSpeciality && selectedSpeciality !== 'all') || (selectedValidationStatus && selectedValidationStatus !== 'all') || (selectedStudentStatus && selectedStudentStatus !== 'all')) && (
						<span className="text-green-600">Filters active</span>
					)}
				</div>
			</div>

			{/* Students List */}
			<div className="bg-white rounded-lg border">
				<div className="p-4 border-b">
					<h3 className="font-medium">Student List</h3>
				</div>

				{filteredStudents.length === 0 ? (
					<div className="p-8 text-center text-gray-500">
						<Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
						{searchTerm || (selectedSpeciality && selectedSpeciality !== 'all') || (selectedValidationStatus && selectedValidationStatus !== 'all') || (selectedStudentStatus && selectedStudentStatus !== 'all') ? (
							<div>
								<p>No students found matching your criteria</p>
								<button
									onClick={clearFilters}
									className="mt-2 text-green-600 hover:text-green-800 underline text-sm"
								>
									Clear filters to see all students
								</button>
							</div>
						) : (
							<p>No students found</p>
						)}
					</div>
				) : (
					<div className="divide-y">
						{filteredStudents.map((student) => (
							<div key={student.id} className="p-4">
								{/* Actions Bar - First */}
								<div className="flex justify-end mb-3">
									{onUpdateStudent ? (
										<button
											onClick={() => {
												// For now, this will redirect to the main admission form
												// In a real implementation, this could open a modal or navigate to edit page
												alert(`Edit functionality would open form for ${student.nom} ${student.prenom}. Please use the main Admission section to edit student details.`);
											}}
											className="p-2 border border-indigo-300 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-500 hover:text-indigo-700 rounded-md transition-colors cursor-pointer"
											title="Edit student">
											<Edit className="h-4 w-4" />
										</button>
									) : (
										<button
											disabled
											className="p-2 border border-gray-200 text-gray-300 rounded-md cursor-not-allowed"
											title="Edit not available">
											<Edit className="h-4 w-4" />
										</button>
									)}
								</div>
								
								<div className="flex items-start justify-between">
									{/* Student Info */}
									<div className="flex items-start gap-4 flex-1">
										<div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
											<User className="h-6 w-6 text-green-600" />
										</div>
										
										<div className="flex-1 min-w-0">
											<div className="flex items-start justify-between">
												<div>
													<h4 className="text-lg font-medium text-gray-900">
														{student.nom} {student.prenom}
													</h4>
													<div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
														<div className="flex items-center gap-1">
															<Phone className="h-3 w-3" />
															{student.mobile}
														</div>
														<div className="flex items-center gap-1">
															<GraduationCap className="h-3 w-3" />
															{student.specialite}
														</div>
														<div className="flex items-center gap-1">
															<Calendar className="h-3 w-3" />
															{student.bacType} {student.anneeBac}
														</div>
													</div>
												</div>

												{/* Status Badges */}
												<div className="flex flex-col gap-2 items-end">
													<div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getValidationStatusColor(student.validation)}`}>
														{getValidationStatusIcon(student.validation)}
														{(student.validation || 'pending').toUpperCase()}
													</div>
													<div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStudentStatusColor(student.studentStatus)}`}>
														{getStudentStatusIcon(student.studentStatus)}
														{(student.studentStatus || 'en_cours').replace('_', ' ').toUpperCase()}
													</div>
												</div>
											</div>

											{/* Additional Info */}
											<div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
												{student.moyenneGenerale && (
													<div className="bg-blue-50 p-3 rounded-lg">
														<div className="text-xs text-blue-600 font-medium mb-1">Academic Scores</div>
														<div className="space-y-1 text-sm">
															<div>Moyenne: {student.moyenneGenerale}</div>
															{student.maths && <div>Maths: {student.maths}</div>}
															{student.francais && <div>Français: {student.francais}</div>}
															{student.physique && <div>Physique: {student.physique}</div>}
														</div>
													</div>
												)}

												{student.testRequired && (
													<div className="bg-yellow-50 p-3 rounded-lg">
														<div className="text-xs text-yellow-600 font-medium mb-1">Test Status</div>
														<div className="text-sm">
															<div>Required: Yes</div>
															<div>Status: {(student.testStatus || 'not_started').replace('_', ' ')}</div>
															{student.testScores && Object.keys(student.testScores).length > 0 && (
																<div className="mt-1">
																	{Object.entries(student.testScores).map(([key, value]) => (
																		<div key={key}>{key}: {value}</div>
																	))}
																</div>
															)}
														</div>
													</div>
												)}

												{(student.licenceSpecialite || student.university) && (
													<div className="bg-green-50 p-3 rounded-lg">
														<div className="text-xs text-green-600 font-medium mb-1">Previous Education</div>
														<div className="space-y-1 text-sm">
															{student.licenceSpecialite && <div>Speciality: {student.licenceSpecialite}</div>}
															{student.university && <div>University: {student.university}</div>}
														</div>
													</div>
												)}
											</div>

											{/* Validation Comment */}
											{student.validationComment && (
												<div className="mt-3 p-3 bg-gray-50 rounded-lg">
													<div className="flex items-start gap-2">
														<FileText className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
														<div>
															<div className="text-xs text-gray-600 font-medium mb-1">Validation Comment</div>
															<div className="text-sm text-gray-700">{student.validationComment}</div>
														</div>
													</div>
												</div>
											)}

											{/* Creation Date */}
											<div className="mt-3 text-xs text-gray-500">
												Created: {new Date(student.dateCreated).toLocaleDateString('fr-FR', {
													year: 'numeric',
													month: 'long',
													day: 'numeric',
													hour: '2-digit',
													minute: '2-digit'
												})}
											</div>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default SalesStudentManagement;