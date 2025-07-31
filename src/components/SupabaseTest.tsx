import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export const SupabaseTest: React.FC = () => {
	const [testResults, setTestResults] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);

	const runTests = async () => {
		setLoading(true);
		const results: string[] = [];

		try {
			// Test 1: Basic Supabase connection
			results.push('🔄 Testing Supabase connection...');
			const { data: healthData, error: healthError } = await supabase
				.from('students')
				.select('count', { count: 'exact', head: true });

			if (healthError) {
				results.push(`❌ Supabase connection failed: ${healthError.message}`);
			} else {
				results.push('✅ Supabase connection OK');
			}

			// Test 2: Check if chat_users table exists
			results.push('🔄 Checking chat_users table...');
			const { data: usersData, error: usersError } = await supabase
				.from('chat_users')
				.select('count', { count: 'exact', head: true });

			if (usersError) {
				results.push(`❌ chat_users table error: ${usersError.message}`);
				results.push('💡 Run the chat_schema.sql script in Supabase SQL Editor');
			} else {
				results.push('✅ chat_users table exists');
			}

			// Test 3: Check if chat_messages table exists
			results.push('🔄 Checking chat_messages table...');
			const { data: messagesData, error: messagesError } = await supabase
				.from('chat_messages')
				.select('count', { count: 'exact', head: true });

			if (messagesError) {
				results.push(`❌ chat_messages table error: ${messagesError.message}`);
				results.push('💡 Run the chat_schema.sql script in Supabase SQL Editor');
			} else {
				results.push('✅ chat_messages table exists');
			}

			// Test 4: Try to insert a test user
			if (!usersError) {
				results.push('🔄 Testing user insert...');
				const { data: insertData, error: insertError } = await supabase
					.from('chat_users')
					.upsert({
						user_id: 'test-user',
						name: 'Test User',
						role: 'receptionist',
						online: true
					}, { onConflict: 'user_id' })
					.select();

				if (insertError) {
					results.push(`❌ User insert failed: ${insertError.message}`);
				} else {
					results.push('✅ User insert successful');
					
					// Clean up test user
					await supabase
						.from('chat_users')
						.delete()
						.eq('user_id', 'test-user');
					results.push('✅ Test user cleaned up');
				}
			}

		} catch (error) {
			results.push(`❌ Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}

		setTestResults(results);
		setLoading(false);
	};

	return (
		<div className="fixed top-4 right-4 w-96 bg-white border rounded-lg shadow-lg p-4 z-50">
			<h3 className="font-bold text-lg mb-3">Supabase Chat Test</h3>
			
			<button
				onClick={runTests}
				disabled={loading}
				className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
			>
				{loading ? 'Running Tests...' : 'Run Supabase Tests'}
			</button>

			{testResults.length > 0 && (
				<div className="mt-4 max-h-64 overflow-y-auto">
					<h4 className="font-semibold mb-2">Test Results:</h4>
					<div className="space-y-1 text-sm font-mono">
						{testResults.map((result, index) => (
							<div key={index} className="whitespace-pre-wrap">
								{result}
							</div>
						))}
					</div>
				</div>
			)}

			<div className="mt-4 text-xs text-gray-600">
				<p><strong>If you see table errors:</strong></p>
				<p>1. Go to Supabase Dashboard</p>
				<p>2. SQL Editor → New Query</p>
				<p>3. Copy/paste chat_schema.sql</p>
				<p>4. Run the script</p>
			</div>
		</div>
	);
};