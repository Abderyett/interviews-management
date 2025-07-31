import React, { useState, useEffect, useRef } from 'react';
import { Plus, UserPlus, ChevronDown } from 'lucide-react';

interface Student {
	studentId: string;
	name: string;
}

interface StudentFormProps {
	onAddStudent: (student: Student) => void;
	disabled?: boolean;
}

const STUDENT_PROGRAMS = [
	{ value: '', label: 'Select Program...' },
	{ value: 'LAC', label: 'LAC' },
	{ value: 'LINFO', label: 'LINFO' },
	{ value: 'LFC', label: 'LFC' },
	{ value: 'MASTER MM', label: 'MASTER MM' },
	{ value: 'MASTER TD', label: 'MASTER TD' }
];

export const StudentForm: React.FC<StudentFormProps> = ({ onAddStudent, disabled = false }) => {
	const [name, setName] = useState('');
	const [selectedProgram, setSelectedProgram] = useState('');
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;
		
		onAddStudent({
			name: name.trim(),
			studentId: selectedProgram.trim() || 'No Program'
		});
		
		setName('');
		setSelectedProgram('');
	};

	const handleProgramSelect = (program: string) => {
		setSelectedProgram(program);
		setIsDropdownOpen(false);
	};

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsDropdownOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	return (
		<div className='pt-4 border-t space-y-3'>
			<div className='flex items-center gap-2'>
				<UserPlus className='h-4 w-4' />
				<span className='font-medium'>Add New Student</span>
			</div>
			<form onSubmit={handleSubmit} className='space-y-3'>
				<input
					type='text'
					placeholder='Student Name'
					value={name}
					onChange={(e) => setName(e.target.value)}
					disabled={disabled}
					className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
				/>
				
				{/* Program Dropdown */}
				<div className="relative" ref={dropdownRef}>
					<button
						type="button"
						onClick={() => setIsDropdownOpen(!isDropdownOpen)}
						disabled={disabled}
						className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
					>
						<span className={selectedProgram ? 'text-foreground' : 'text-muted-foreground'}>
							{selectedProgram || 'Select Program...'}
						</span>
						<ChevronDown className="h-4 w-4 opacity-50" />
					</button>
					
					{isDropdownOpen && !disabled && (
						<div className="absolute z-50 top-full mt-1 w-full min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
							{STUDENT_PROGRAMS.slice(1).map((program) => (
								<button
									key={program.value}
									type="button"
									onClick={() => handleProgramSelect(program.value)}
									className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
								>
									{program.label}
								</button>
							))}
						</div>
					)}
				</div>
				
				<button
					type='submit'
					disabled={!name.trim() || disabled}
					className='inline-flex items-center justify-center rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed'>
					<Plus className='h-4 w-4 mr-2' />
					Add Student
				</button>
			</form>
		</div>
	);
};