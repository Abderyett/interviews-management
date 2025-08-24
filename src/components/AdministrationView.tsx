import React, { useState, useMemo } from 'react';
import { Search, Users, CheckCircle, XCircle, Clock, Edit } from 'lucide-react';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './ui/select';

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

interface AdministrationViewProps {
	students: Student[];
}


const Badge = ({ 
	children, 
	variant = 'default' 
}: { 
	children: React.ReactNode; 
	variant?: 'default' | 'secondary' | 'destructive';
}) => {
	const variants = {
		default: 'bg-green-100 text-green-800 border-green-200',
		secondary: 'bg-yellow-100 text-yellow-800 border-yellow-200',
		destructive: 'bg-red-100 text-red-800 border-red-200',
	};
	
	return (
		<span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${variants[variant]}`}>
			{children}
		</span>
	);
};

// Sales person mapping
const SALES_PERSONS: { [key: number]: string } = {
	1: 'Samir Hadjout',
	2: 'Samy Bouaddou', 
	3: 'Imen Mouzaoui',
	4: 'Wassim Benkhannouf',
	5: 'Gassbi Wassil',
	6: 'Adem Bentayeb',
	7: 'Lyna Guita',
};

const getSalesPersonName = (id: number): string => {
	return SALES_PERSONS[id] || `Sales ID: ${id}`;
};

const getValidationLabel = (validation?: string): string => {
	switch (validation) {
		case 'accepted': return 'Accepted';
		case 'rejected': return 'Rejected';
		case 'pending':
		default: return 'Pending';
	}
};

const getValidationVariant = (validation?: string): 'default' | 'secondary' | 'destructive' => {
	switch (validation) {
		case 'accepted': return 'default';
		case 'rejected': return 'destructive';
		case 'pending':
		default: return 'secondary';
	}
};

const getValidationIcon = (validation?: string) => {
	switch (validation) {
		case 'accepted': return <CheckCircle className="h-4 w-4 text-green-600" />;
		case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />;
		case 'pending':
		default: return <Clock className="h-4 w-4 text-yellow-600" />;
	}
};

export const AdministrationView: React.FC<AdministrationViewProps> = ({ students }) => {
	const [searchQuery, setSearchQuery] = useState('');
	const [validationFilter, setValidationFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');

	// Filter students based on search and validation status
	const filteredStudents = useMemo(() => {
		let filtered = students;

		// Apply search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim();
			filtered = filtered.filter((student) =>
				student.nom.toLowerCase().includes(query) ||
				student.prenom.toLowerCase().includes(query) ||
				`${student.nom} ${student.prenom}`.toLowerCase().includes(query) ||
				student.mobile.includes(query) ||
				student.specialite.toLowerCase().includes(query) ||
				getSalesPersonName(student.salesPersonId).toLowerCase().includes(query)
			);
		}

		// Apply validation filter
		if (validationFilter !== 'all') {
			filtered = filtered.filter((student) => student.validation === validationFilter);
		}

		return filtered.sort((a, b) => b.dateCreated.getTime() - a.dateCreated.getTime());
	}, [students, searchQuery, validationFilter]);

	// Statistics
	const stats = useMemo(() => {
		const total = students.length;
		const pending = students.filter(s => s.validation === 'pending').length;
		const accepted = students.filter(s => s.validation === 'accepted').length;
		const rejected = students.filter(s => s.validation === 'rejected').length;

		return { total, pending, accepted, rejected };
	}, [students]);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<div className="flex items-center gap-2 mb-2">
					<Users className="h-6 w-6 text-indigo-600" />
					<h1 className="text-2xl font-bold text-gray-900">Administration</h1>
				</div>
				<p className="text-gray-600">
					Global view of all students with validation status for inscription verification
				</p>
			</div>

			{/* Statistics Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div className="bg-white p-4 rounded-lg border shadow-sm">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-gray-600">Total Students</p>
							<p className="text-2xl font-bold text-gray-900">{stats.total}</p>
						</div>
						<Users className="h-8 w-8 text-gray-400" />
					</div>
				</div>

				<div className="bg-white p-4 rounded-lg border shadow-sm">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-gray-600">Pending</p>
							<p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
						</div>
						<Clock className="h-8 w-8 text-yellow-400" />
					</div>
				</div>

				<div className="bg-white p-4 rounded-lg border shadow-sm">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-gray-600">Accepted</p>
							<p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
						</div>
						<CheckCircle className="h-8 w-8 text-green-400" />
					</div>
				</div>

				<div className="bg-white p-4 rounded-lg border shadow-sm">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-gray-600">Rejected</p>
							<p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
						</div>
						<XCircle className="h-8 w-8 text-red-400" />
					</div>
				</div>
			</div>

			{/* Search and Filters */}
			<div className="bg-white p-6 rounded-lg border shadow-sm">
				<div className="flex flex-col sm:flex-row gap-4">
					{/* Search */}
					<div className="flex-1 relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
						<input
							type="text"
							placeholder="Search by name, mobile, specialité, sales person..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
						/>
					</div>

					{/* Validation Filter */}
					<div>
						<Select
							value={validationFilter}
							onValueChange={(value) => setValidationFilter(value as 'all' | 'pending' | 'accepted' | 'rejected')}
						>
							<SelectTrigger className="w-full">
								<SelectValue>
								{validationFilter === 'all' ? 'All Validations' : 
								 validationFilter === 'pending' ? 'Pending Only' :
								 validationFilter === 'accepted' ? 'Accepted Only' :
								 validationFilter === 'rejected' ? 'Rejected Only' : 'All Validations'}
							</SelectValue>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Validations</SelectItem>
								<SelectItem value="pending">Pending Only</SelectItem>
								<SelectItem value="accepted">Accepted Only</SelectItem>
								<SelectItem value="rejected">Rejected Only</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Results Summary */}
				<div className="mt-4 text-sm text-gray-600">
					Showing {filteredStudents.length} of {students.length} students
				</div>
			</div>

			{/* Students Table */}
			<div className="bg-white rounded-lg border shadow-sm overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full border-collapse min-w-max">
						<thead>
							<tr className="border-b bg-gray-50">
								<th className="text-left p-4 font-medium text-gray-900">Actions</th>
								<th className="text-left p-4 font-medium text-gray-900">Student</th>
								<th className="text-left p-4 font-medium text-gray-900">Contact</th>
								<th className="text-left p-4 font-medium text-gray-900">Academic Info</th>
								<th className="text-left p-4 font-medium text-gray-900">Validation Status</th>
								<th className="text-left p-4 font-medium text-gray-900">Sales Person</th>
								<th className="text-left p-4 font-medium text-gray-900">Created</th>
							</tr>
						</thead>
						<tbody>
							{filteredStudents.length === 0 ? (
								<tr>
									<td colSpan={7} className="text-center p-8 text-gray-500">
										{searchQuery || validationFilter !== 'all' 
											? 'No students match your search criteria'
											: 'No students available'
										}
									</td>
								</tr>
							) : (
								filteredStudents.map((student, index) => (
									<tr key={student.id || index} className="border-b hover:bg-gray-50">
										{/* Actions Column - First */}
										<td className="p-4">
											<div className="flex justify-center">
												<button
													onClick={() => {
														alert(`Edit functionality for ${student.nom} ${student.prenom} - This would require proper permissions`);
													}}
													className="p-2 border border-indigo-300 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-500 hover:text-indigo-700 rounded-md transition-colors cursor-pointer"
													title="Edit student (Requires permission)">
													<Edit className="h-3 w-3" />
												</button>
											</div>
										</td>
										{/* Student Name & Specialité */}
										<td className="p-4">
											<div>
												<div className="font-medium text-gray-900">
													{student.nom} {student.prenom}
												</div>
												<div className="text-sm text-gray-500">
													{student.specialite}
												</div>
											</div>
										</td>

										{/* Contact */}
										<td className="p-4">
											<div className="text-sm text-gray-900">
												{student.mobile}
											</div>
										</td>

										{/* Academic Info */}
										<td className="p-4">
											<div className="text-sm">
												<div className="text-gray-900">
													{student.bacType} - {student.anneeBac}
												</div>
												{student.moyenneGenerale && (
													<div className="text-gray-500">
														Moy: {student.moyenneGenerale}
													</div>
												)}
												{student.testRequired && (
													<div className="text-orange-600 text-xs mt-1">
														Test Required
													</div>
												)}
											</div>
										</td>

										{/* Validation Status */}
										<td className="p-4">
											<div className="flex items-center gap-2">
												{getValidationIcon(student.validation)}
												<Badge variant={getValidationVariant(student.validation)}>
													{getValidationLabel(student.validation)}
												</Badge>
											</div>
											{student.validationComment && (
												<div className="text-xs text-gray-500 mt-1 max-w-48 truncate" title={student.validationComment}>
													{student.validationComment}
												</div>
											)}
										</td>

										{/* Sales Person */}
										<td className="p-4 text-sm text-gray-900">
											{getSalesPersonName(student.salesPersonId)}
										</td>

										{/* Created Date */}
										<td className="p-4 text-sm text-gray-500">
											{student.dateCreated.toLocaleDateString()}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};