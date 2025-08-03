import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CalendarProps {
	value: string;
	onChange: (date: string) => void;
	className?: string;
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
	size?: 'default' | 'sm' | 'icon';
	disabled?: boolean;
	className?: string;
}) => {
	const baseClasses = 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
	
	const variants = {
		default: 'bg-primary text-primary-foreground hover:bg-primary/90',
		outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
		ghost: 'hover:bg-accent hover:text-accent-foreground',
	};
	
	const sizes = {
		default: 'h-10 px-4 py-2',
		sm: 'h-9 px-3',
		icon: 'h-10 w-10',
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

export const Calendar: React.FC<CalendarProps> = ({ value, onChange, className = '' }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [currentMonth, setCurrentMonth] = useState(new Date());
	const calendarRef = useRef<HTMLDivElement>(null);

	// Close calendar when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	// Initialize current month from selected date
	useEffect(() => {
		if (value) {
			const selectedDate = new Date(value + 'T00:00:00');
			if (!isNaN(selectedDate.getTime())) {
				setCurrentMonth(selectedDate);
			}
		}
	}, [value]);

	const formatDisplayDate = (dateString: string) => {
		if (!dateString) return 'Pick a date';
		const date = new Date(dateString + 'T00:00:00');
		if (isNaN(date.getTime())) return 'Pick a date';
		return date.toLocaleDateString('en-US', { 
			weekday: 'short',
			year: 'numeric', 
			month: 'short', 
			day: 'numeric' 
		});
	};

	const getMonthDays = (date: Date) => {
		const year = date.getFullYear();
		const month = date.getMonth();
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const daysInMonth = lastDay.getDate();
		const startingDayOfWeek = firstDay.getDay();
		
		const days = [];
		
		// Previous month's trailing days
		const prevMonth = new Date(year, month - 1, 0);
		for (let i = startingDayOfWeek - 1; i >= 0; i--) {
			days.push({
				day: prevMonth.getDate() - i,
				isCurrentMonth: false,
				date: new Date(year, month - 1, prevMonth.getDate() - i)
			});
		}
		
		// Current month days
		for (let day = 1; day <= daysInMonth; day++) {
			days.push({
				day,
				isCurrentMonth: true,
				date: new Date(year, month, day)
			});
		}
		
		// Next month's leading days
		const remainingSlots = 42 - days.length;
		for (let day = 1; day <= remainingSlots; day++) {
			days.push({
				day,
				isCurrentMonth: false,
				date: new Date(year, month + 1, day)
			});
		}
		
		return days;
	};

	const navigateMonth = (direction: 'prev' | 'next') => {
		setCurrentMonth(prev => {
			const newMonth = new Date(prev);
			if (direction === 'prev') {
				newMonth.setMonth(prev.getMonth() - 1);
			} else {
				newMonth.setMonth(prev.getMonth() + 1);
			}
			return newMonth;
		});
	};

	const selectDate = (date: Date) => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const dateString = `${year}-${month}-${day}`;
		onChange(dateString);
		// Don't close the calendar automatically - let user close it manually
	};

	const isSelectedDate = (date: Date) => {
		if (!value) return false;
		const selected = new Date(value + 'T00:00:00');
		return date.toDateString() === selected.toDateString();
	};

	const isToday = (date: Date) => {
		const today = new Date();
		return date.toDateString() === today.toDateString();
	};

	const goToToday = () => {
		const today = new Date();
		setCurrentMonth(today);
		selectDate(today);
	};

	const clearDate = () => {
		onChange('');
		setIsOpen(false);
	};

	const monthDays = getMonthDays(currentMonth);
	const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

	return (
		<div className={`relative ${className}`} ref={calendarRef}>
			{/* Trigger Button - shadcn/ui style */}
			<Button
				variant="outline"
				onClick={() => setIsOpen(!isOpen)}
				className={`w-full justify-start text-left font-normal ${!value && 'text-muted-foreground'}`}
			>
				<CalendarIcon className="mr-2 h-4 w-4" />
				<span>{formatDisplayDate(value)}</span>
			</Button>

			{/* Calendar Popover - shadcn/ui style */}
			{isOpen && (
				<div 
					className="absolute z-[100] mt-2 rounded-md border bg-popover p-3 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 w-auto p-0"
					onClick={(e) => e.stopPropagation()}
				>
					<div className="space-y-4 p-3">
						{/* Header with navigation */}
						<div className="flex items-center justify-between space-x-1">
							<Button
								variant="outline"
								size="icon"
								onClick={(e) => {
									e.stopPropagation();
									navigateMonth('prev');
								}}
								className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
							>
								<ChevronLeft className="h-4 w-4" />
							</Button>
							
							<div className="flex flex-1 justify-center text-sm font-medium">
								{monthName}
							</div>
							
							<Button
								variant="outline"
								size="icon"
								onClick={(e) => {
									e.stopPropagation();
									navigateMonth('next');
								}}
								className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
							>
								<ChevronRight className="h-4 w-4" />
							</Button>
							
							<Button
								variant="ghost"
								size="icon"
								onClick={(e) => {
									e.stopPropagation();
									setIsOpen(false);
								}}
								className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
							>
								<X className="h-4 w-4" />
							</Button>
						</div>

						{/* Calendar grid */}
						<div className="w-full space-y-2">
							{/* Weekday headers */}
							<div className="flex">
								{['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
									<div key={day} className="flex h-9 w-9 items-center justify-center text-xs font-normal text-muted-foreground">
										{day}
									</div>
								))}
							</div>

							{/* Calendar days */}
							<div className="grid grid-cols-7 gap-1">
								{monthDays.map((dayObj, index) => (
									<button
										key={index}
										onClick={(e) => {
											e.stopPropagation();
											selectDate(dayObj.date);
										}}
										className={`inline-flex h-9 w-9 items-center justify-center whitespace-nowrap rounded-md p-0 text-sm font-normal ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground
											${!dayObj.isCurrentMonth 
												? 'text-muted-foreground opacity-50' 
												: ''
											}
											${isSelectedDate(dayObj.date)
												? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground'
												: ''
											}
											${isToday(dayObj.date) && !isSelectedDate(dayObj.date)
												? 'bg-accent text-accent-foreground'
												: ''
											}
										`}
									>
										{dayObj.day}
									</button>
								))}
							</div>
						</div>

						{/* Footer with actions */}
						<div className="flex items-center justify-between border-t pt-3">
							<Button
								variant="ghost"
								size="sm"
								onClick={(e) => {
									e.stopPropagation();
									clearDate();
								}}
								className="h-8 px-2 text-xs"
							>
								Clear
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={(e) => {
									e.stopPropagation();
									goToToday();
								}}
								className="h-8 px-2 text-xs"
							>
								Today
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export const CalendarComponent = Calendar;