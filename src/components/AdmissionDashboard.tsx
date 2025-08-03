import React, { useMemo } from 'react';
import { CalendarComponent } from './Calendar';
import {
	Users,
	CheckCircle,
	XCircle,
	Clock,
	FileText,
	GraduationCap,
	TrendingUp,
	BarChart3,
	PieChart,
	Calendar,
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

interface AdmissionDashboardProps {
	students: Student[];
	salesPersons: Array<{ id: number; name: string }>;
	selectedDate: string;
	onDateChange: (date: string) => void;
}

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
	<div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>{children}</div>
);

const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
	<div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
	<h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h3>
);

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
	<div className={`p-6 pt-0 ${className}`}>{children}</div>
);

const Badge = ({ 
	children, 
	variant = 'default',
	className = '' 
}: { 
	children: React.ReactNode; 
	variant?: 'default' | 'secondary' | 'destructive' | 'success'; 
	className?: string;
}) => {
	const variants = {
		default: 'bg-blue-100 text-blue-800',
		secondary: 'bg-gray-100 text-gray-800',
		destructive: 'bg-red-100 text-red-800',
		success: 'bg-green-100 text-green-800',
	};

	return (
		<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
			{children}
		</span>
	);
};

const StatCard = ({ 
	title, 
	value, 
	icon: Icon, 
	color = 'blue',
	percentage 
}: {
	title: string;
	value: number;
	icon: React.ComponentType<{ className?: string }>;
	color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
	percentage?: number;
}) => {
	const colorClasses = {
		blue: 'bg-blue-50 border-blue-200 text-blue-600',
		green: 'bg-green-50 border-green-200 text-green-600',
		red: 'bg-red-50 border-red-200 text-red-600',
		yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
		purple: 'bg-purple-50 border-purple-200 text-purple-600',
	};

	return (
		<Card className={`${colorClasses[color]} border-2`}>
			<CardContent className="p-6">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-sm font-medium text-gray-600">{title}</p>
						<p className="text-3xl font-bold">{value}</p>
						{percentage !== undefined && (
							<p className="text-sm text-gray-500 mt-1">
								{percentage.toFixed(1)}% of total
							</p>
						)}
					</div>
					<Icon className="h-8 w-8 opacity-75" />
				</div>
			</CardContent>
		</Card>
	);
};

export const AdmissionDashboard: React.FC<AdmissionDashboardProps> = ({ students, salesPersons, selectedDate, onDateChange }) => {
	// Filter students by selected date (based on interview date)
	const filteredStudents = useMemo(() => {
		if (!selectedDate) return students;
		return students.filter((student) => {
			if (!student.interviewDate) return false;
			return new Date(student.interviewDate).toDateString() === new Date(selectedDate).toDateString();
		});
	}, [students, selectedDate]);

	const stats = useMemo(() => {
		const total = filteredStudents.length;

		// Validation statistics
		const accepted = filteredStudents.filter(s => s.validation === 'accepted').length;
		const rejected = filteredStudents.filter(s => s.validation === 'rejected').length;
		const pending = filteredStudents.filter(s => s.validation === 'pending').length;

		// Interview statistics
		const withInterview = filteredStudents.filter(s => s.interviewDate).length;
		const withoutInterview = total - withInterview;

		// Test statistics
		const requireTest = filteredStudents.filter(s => s.testRequired).length;
		const noTestRequired = total - requireTest;

		// Student status statistics
		const inscrit = filteredStudents.filter(s => s.studentStatus === 'inscrit').length;
		const enCours = filteredStudents.filter(s => s.studentStatus === 'en_cours').length;
		const abandonner = filteredStudents.filter(s => s.studentStatus === 'abandonner').length;

		// Speciality statistics
		const specialtyStats = {
			LAC: filteredStudents.filter(s => s.specialite === 'LAC').length,
			LFC: filteredStudents.filter(s => s.specialite === 'LFC').length,
			LINFO: filteredStudents.filter(s => s.specialite === 'LINFO').length,
			MASTER_MM: filteredStudents.filter(s => s.specialite === 'MASTER_MM').length,
			MASTER_TD: filteredStudents.filter(s => s.specialite === 'MASTER_TD').length,
		};

		// Sales person statistics
		const salesStats = salesPersons.map(sales => ({
			...sales,
			count: filteredStudents.filter(s => s.salesPersonId === sales.id).length,
		}));

		return {
			total,
			validation: { accepted, rejected, pending },
			interview: { withInterview, withoutInterview },
			test: { requireTest, noTestRequired },
			studentStatus: { inscrit, enCours, abandonner },
			specialty: specialtyStats,
			sales: salesStats,
		};
	}, [filteredStudents, salesPersons]);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<BarChart3 className="h-8 w-8 text-purple-600" />
					<div>
						<h2 className="text-2xl font-bold text-gray-900">Admission Dashboard</h2>
						<p className="text-gray-600">Overview of student admissions and statistics</p>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Filter by Interview Date</label>
						<CalendarComponent 
							value={selectedDate} 
							onChange={onDateChange} 
							className="w-64"
						/>
					</div>
				</div>
			</div>

			{/* Date Info */}
			{selectedDate && (
				<div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
					<div className="flex items-center gap-2">
						<Calendar className="h-5 w-5 text-purple-600" />
						<span className="text-purple-800 font-medium">
							Showing data for: {new Date(selectedDate).toLocaleDateString('en-US', { 
								weekday: 'long',
								year: 'numeric', 
								month: 'long', 
								day: 'numeric' 
							})}
						</span>
						<span className="ml-2 bg-purple-600 text-white px-2 py-1 rounded-full text-xs">
							{stats.total} students
						</span>
					</div>
				</div>
			)}

			{/* Main Statistics */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<StatCard
					title="Total Students"
					value={stats.total}
					icon={Users}
					color="blue"
				/>
				<StatCard
					title="Accepted"
					value={stats.validation.accepted}
					icon={CheckCircle}
					color="green"
					percentage={(stats.validation.accepted / stats.total) * 100}
				/>
				<StatCard
					title="Rejected"
					value={stats.validation.rejected}
					icon={XCircle}
					color="red"
					percentage={(stats.validation.rejected / stats.total) * 100}
				/>
				<StatCard
					title="Pending"
					value={stats.validation.pending}
					icon={Clock}
					color="yellow"
					percentage={(stats.validation.pending / stats.total) * 100}
				/>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<StatCard
					title="Have Interview"
					value={stats.interview.withInterview}
					icon={Calendar}
					color="blue"
					percentage={(stats.interview.withInterview / stats.total) * 100}
				/>
				<StatCard
					title="Need Test"
					value={stats.test.requireTest}
					icon={FileText}
					color="purple"
					percentage={(stats.test.requireTest / stats.total) * 100}
				/>
				<StatCard
					title="Enrolled"
					value={stats.studentStatus.inscrit}
					icon={GraduationCap}
					color="green"
					percentage={(stats.studentStatus.inscrit / stats.total) * 100}
				/>
				<StatCard
					title="Dropped"
					value={stats.studentStatus.abandonner}
					icon={XCircle}
					color="red"
					percentage={(stats.studentStatus.abandonner / stats.total) * 100}
				/>
			</div>

			{/* Detailed Statistics */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Speciality Breakdown */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<PieChart className="h-5 w-5" />
							Students by Speciality
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{Object.entries(stats.specialty).map(([specialty, count]) => (
								<div key={specialty} className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<Badge variant="default">{specialty}</Badge>
									</div>
									<div className="flex items-center gap-2">
										<span className="font-semibold">{count}</span>
										<span className="text-sm text-gray-500">
											({((count / stats.total) * 100).toFixed(1)}%)
										</span>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Sales Person Performance */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<TrendingUp className="h-5 w-5" />
							Students by Sales Person
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{stats.sales
								.sort((a, b) => b.count - a.count)
								.map((sales) => (
									<div key={sales.id} className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											<div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
												<span className="text-sm font-medium text-indigo-600">
													{sales.name.split(' ').map(n => n[0]).join('')}
												</span>
											</div>
											<span className="font-medium">{sales.name}</span>
										</div>
										<div className="flex items-center gap-2">
											<span className="font-semibold">{sales.count}</span>
											<span className="text-sm text-gray-500">
												({((sales.count / stats.total) * 100).toFixed(1)}%)
											</span>
										</div>
									</div>
								))}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Status Overview */}
			<Card>
				<CardHeader>
					<CardTitle>Student Status Overview</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div className="text-center">
							<div className="w-16 h-16 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
								<GraduationCap className="h-8 w-8 text-green-600" />
							</div>
							<p className="text-2xl font-bold text-green-600">{stats.studentStatus.inscrit}</p>
							<p className="text-sm text-gray-600">Enrolled Students</p>
						</div>
						<div className="text-center">
							<div className="w-16 h-16 mx-auto mb-3 rounded-full bg-yellow-100 flex items-center justify-center">
								<Clock className="h-8 w-8 text-yellow-600" />
							</div>
							<p className="text-2xl font-bold text-yellow-600">{stats.studentStatus.enCours}</p>
							<p className="text-sm text-gray-600">In Progress</p>
						</div>
						<div className="text-center">
							<div className="w-16 h-16 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center">
								<XCircle className="h-8 w-8 text-red-600" />
							</div>
							<p className="text-2xl font-bold text-red-600">{stats.studentStatus.abandonner}</p>
							<p className="text-sm text-gray-600">Dropped Out</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};