// ============================================
// EMPLOYEE MANAGEMENT JAVASCRIPT
// ============================================
// File: public/assets/js/functions/manageEmployee.js
// Description: Client-side logic for employee management
// Features: DataTables, AJAX, Form handling
// ============================================

var employee_id;
var employeeDataTable;
var manageEmployeeTranslations = {};

// Helper function for error handling
function showError(xhr, defaultMsg) {
	var errorMsg = defaultMsg;
	if (xhr.responseJSON && xhr.responseJSON.error) {
		errorMsg = xhr.responseJSON.error;
	}
	Swal.fire({
		icon: "error",
		title: manageEmployeeTranslations.error || 'Error!',
		text: errorMsg,
	});
}

$(document).ready(function () {
	var $transEl = $('#manageEmployeeTranslations');
	if ($transEl.length) {
		manageEmployeeTranslations = {
			success: $transEl.data('success') || 'Success!',
			error: $transEl.data('error') || 'Error!',
			employee_created_successfully: $transEl.data('employee-created-successfully') || 'Employee created successfully',
			employee_updated_successfully: $transEl.data('employee-updated-successfully') || 'Employee updated successfully',
			employee_deleted_successfully: $transEl.data('employee-deleted-successfully') || 'Employee has been deleted',
			failed_to_create_employee: $transEl.data('failed-to-create-employee') || 'Failed to create employee',
			failed_to_update_employee: $transEl.data('failed-to-update-employee') || 'Failed to update employee',
			failed_to_delete_employee: $transEl.data('failed-to-delete-employee') || 'Failed to delete employee',
			failed_to_load_employees: $transEl.data('failed-to-load-employees') || 'Failed to load employees. Please refresh the page.',
			delete_confirmation_title: $transEl.data('delete-confirmation-title') || 'Are you sure?',
			delete_confirmation_text: $transEl.data('delete-confirmation-text') || "You won't be able to revert this!",
			delete_confirm_button: $transEl.data('delete-confirm-button') || 'Yes, delete it!',
			active: $transEl.data('active') || 'ACTIVE',
			inactive: $transEl.data('inactive') || 'INACTIVE',
			pagination: {
				showing: $transEl.data('pagination-showing') || 'Showing',
				to: $transEl.data('pagination-to') || 'to',
				of: $transEl.data('pagination-of') || 'of',
				entries: $transEl.data('pagination-entries') || 'entries',
				previous: $transEl.data('pagination-previous') || 'Previous',
				next: $transEl.data('pagination-next') || 'Next',
				search: $transEl.data('pagination-search') || 'Search',
				search_placeholder: $transEl.data('pagination-search-placeholder') || 'Search...'
			}
		};
	}

	// Initialize employee DataTable
	if ($('#employeeTable').length) {
		if ($.fn.DataTable.isDataTable('#employeeTable')) {
			$('#employeeTable').DataTable().destroy();
			employeeDataTable = null;
		}

		// Get pagination translations
		const paginationTrans = manageEmployeeTranslations.pagination || {};
		const showingText = paginationTrans.showing || 'Showing';
		const toText = paginationTrans.to || 'to';
		const ofText = paginationTrans.of || 'of';
		const entriesText = paginationTrans.entries || 'entries';
		const searchText = paginationTrans.search || 'Search';

		employeeDataTable = $('#employeeTable').DataTable({
			columnDefs: [
				{ targets: [0, 1, 2, 3, 4, 5], className: 'text-left' },
				{ targets: [6], className: 'text-center' }
			],
			order: [[0, 'asc']],
			pageLength: 10,
			responsive: true,
			lengthChange: false,
			language: {
				lengthMenu: showingText + " _MENU_ " + entriesText,
				info: showingText + " _START_ " + toText + " _END_ " + ofText + " _TOTAL_ " + entriesText,
				infoEmpty: showingText + " 0 " + toText + " 0 " + ofText + " 0 " + entriesText,
				infoFiltered: "(" + searchText + " " + ofText + " _MAX_ " + entriesText + ")",
				search: searchText + ":",
				searchPlaceholder: paginationTrans.search_placeholder || "Search...",
				paginate: {
					previous: paginationTrans.previous || 'Previous',
					next: paginationTrans.next || 'Next'
				}
			}
		});
		
		reloadEmployeeData();
	}

	// View employee details button click handler
	$(document).on('click', '.view-employee-btn', function() {
		var $btn = $(this);
		var id = $btn.data('id');
		
		// Fetch employee data from API
		$.ajax({
			url: '/employee/' + id,
			method: 'GET',
			success: function(employee) {
				view_employee_details(employee);
			},
			error: function(xhr, status, error) {
				console.error('Error fetching employee:', error);
				showError(xhr, 'Failed to load employee data');
			}
		});
	});

	// Edit employee button click handler - fetch data from API
	$(document).on('click', '.edit-employee-btn', function() {
		var $btn = $(this);
		var id = $btn.data('id');
		
		// Fetch employee data from API
		$.ajax({
			url: '/employee/' + id,
			method: 'GET',
			success: function(employee) {
				edit_employee(employee);
			},
			error: function(xhr, status, error) {
				console.error('Error fetching employee:', error);
				showError(xhr, 'Failed to load employee data');
			}
		});
	});

	// Edit employee form submit
	$(document).on('submit', '#edit_employee', function (event) {
		event.preventDefault();
		var $form = $(this);
		
		$.ajax({
			url: '/employee/' + employee_id,
			type: 'PUT',
			data: $form.serialize(),
			success: function (response) {
				Swal.fire({
					icon: "success",
					title: manageEmployeeTranslations.success,
					text: manageEmployeeTranslations.employee_updated_successfully,
				});
				$form[0].reset();
				$('#modal-edit_employee').modal('hide');
				reloadEmployeeData();
			},
			error: function (xhr, status, error) {
				console.error('Error updating employee:', error);
				showError(xhr, manageEmployeeTranslations.failed_to_update_employee);
			}
		});
	});

	// Toggle user account fields visibility
	$(document).on('change', '#create_user_account_checkbox', function() {
		if ($(this).is(':checked')) {
			$('#user_account_fields').slideDown();
			$('#new_employee_username, #new_employee_password, #new_employee_password2, #new_employee_permissions').prop('required', true);
		} else {
			$('#user_account_fields').slideUp();
			$('#new_employee_username, #new_employee_password, #new_employee_password2, #new_employee_permissions').prop('required', false).val('');
		}
	});

	// Add new employee form submit
	$(document).on('submit', '#add_new_employee', function (event) {
		event.preventDefault();
		var $form = $(this);
		
		// Validate password match if creating user account
		if ($('#create_user_account_checkbox').is(':checked')) {
			var password = $('#new_employee_password').val();
			var password2 = $('#new_employee_password2').val();
			if (password !== password2) {
				Swal.fire({
					icon: "error",
					title: manageEmployeeTranslations.error,
					text: "Passwords do not match",
				});
				return;
			}
		}
		
		$.ajax({
			url: '/employee',
			type: 'POST',
			data: $form.serialize(),
			success: function (response) {
				Swal.fire({
					icon: "success",
					title: manageEmployeeTranslations.success,
					text: response.message || manageEmployeeTranslations.employee_created_successfully,
				});
				$form[0].reset();
				$('#user_account_fields').hide();
				$('#create_user_account_checkbox').prop('checked', false);
				$('#modal-new_employee').modal('hide');
				reloadEmployeeData();
			},
			error: function (xhr, status, error) {
				console.error('Error creating employee:', error);
				showError(xhr, manageEmployeeTranslations.failed_to_create_employee);
			}
		});
	});
});

// ============================================
// EMPLOYEE MANAGEMENT FUNCTIONS
// ============================================

// Open new employee modal
function add_employee_modal() {
	$('#modal-new_employee').modal('show');
}

// Reload employee data in DataTable
function reloadEmployeeData() {
	if (!employeeDataTable) {
		return;
	}
	
	$.ajax({
		url: '/employees_list',
		method: 'GET',
		success: function (data) {
			employeeDataTable.clear();
			
			if (!data || data.length === 0) {
				employeeDataTable.draw();
				return;
			}
			
			var rows = [];
			var activeText = manageEmployeeTranslations.active || 'ACTIVE';
			var inactiveText = manageEmployeeTranslations.inactive || 'INACTIVE';
			
			data.forEach(function (row) {
				var dateStarted = row.DATE_STARTED 
					? new Date(row.DATE_STARTED).toLocaleDateString('en-US', { 
						year: 'numeric', month: 'short', day: 'numeric'
					})
					: 'N/A';

				var status = parseInt(row.STATUS) === 1 
					? `<span class="css-blue">${activeText}</span>`
					: `<span class="css-red">${inactiveText}</span>`;

				var branchName = row.BRANCH_NAME || row.BRANCH_LABEL || '—';
				var contact = row.CONTACTNo || '—';
				var department = row.DEPARTMENT || '—';
				var fullname = row.FULLNAME || ((row.FIRSTNAME || '') + ' ' + (row.LASTNAME || '')).trim() || '—';

				var btn = '<div class="btn-group">' +
					'<button type="button" class="btn btn-sm bg-success-subtle js-bs-tooltip-enabled view-employee-btn"' +
					' data-id="' + row.IDNo + '"' +
					' data-bs-toggle="tooltip" aria-label="View Details" data-bs-original-title="View Details">' +
					'<i class="fa fa-eye"></i>' +
					'</button>' +
					'<button type="button" class="btn btn-sm bg-info-subtle js-bs-tooltip-enabled edit-employee-btn"' +
					' data-id="' + row.IDNo + '"' +
					' data-bs-toggle="tooltip" aria-label="Edit" data-bs-original-title="Edit">' +
					'<i class="fa fa-pencil-alt"></i>' +
					'</button>' +
					'<button type="button" class="btn btn-sm bg-danger-subtle js-bs-tooltip-enabled" onclick="delete_employee(' + row.IDNo + ')"' +
					' data-bs-toggle="tooltip" aria-label="Delete" data-bs-original-title="Delete">' +
					'<i class="fa fa-trash"></i>' +
					'</button>' +
					'</div>';

				rows.push([
					fullname, 
					contact, 
					department, 
					branchName, 
					status, 
					dateStarted, 
					btn
				]);
			});
			
			employeeDataTable.rows.add(rows).draw();
		},
		error: function (xhr, status, error) {
			console.error('Error fetching employees:', error);
			Swal.fire({
				icon: "error",
				title: manageEmployeeTranslations.error,
				text: manageEmployeeTranslations.failed_to_load_employees,
			});
		}
	});
}

// Open edit employee modal with data
function edit_employee(employee) {
	employee_id = employee.IDNo;
	$('#edit_employee_id').val(employee.IDNo);
	$('#edit_employee_firstname').val(employee.FIRSTNAME || '');
	$('#edit_employee_lastname').val(employee.LASTNAME || '');
	$('#edit_employee_contact').val(employee.CONTACTNo || '');
	$('#edit_employee_department').val(employee.DEPARTMENT || '');
	$('#edit_employee_address').val(employee.ADDRESS || '');
	
	// Format DATE_STARTED for date input (YYYY-MM-DD format)
	var dateStarted = employee.DATE_STARTED || '';
	if (dateStarted) {
		if (typeof dateStarted === 'string') {
			// Extract date part if it includes time
			if (dateStarted.includes('T')) {
				dateStarted = dateStarted.split('T')[0].trim();
			} else if (dateStarted.includes(' ')) {
				dateStarted = dateStarted.split(' ')[0].trim();
			}
			// Validate YYYY-MM-DD format
			if (!dateStarted.match(/^\d{4}-\d{2}-\d{2}$/)) {
				dateStarted = '';
			}
		} else if (dateStarted instanceof Date) {
			dateStarted = dateStarted.toISOString().split('T')[0];
		} else {
			dateStarted = '';
		}
	}
	$('#edit_employee_date_started').val(dateStarted);
	
	// Format salary with commas
	var salary = employee.SALARY || '';
	if (salary) {
		salary = salary.toString().replace(/,/g, '');
		salary = parseFloat(salary).toLocaleString('en-US');
	}
	$('#edit_employee_salary').val(salary);
	
	$('#edit_employee_status').val(employee.STATUS || 1);
	$('#edit_employee_emergency_name').val(employee.EMERGENCY_CONTACT_NAME || '');
	$('#edit_employee_emergency_phone').val(employee.EMERGENCY_CONTACT_PHONE || '');
	$('#modal-edit_employee').modal('show');
}

// Delete employee with confirmation
function delete_employee(id) {
	Swal.fire({
		title: manageEmployeeTranslations.delete_confirmation_title || 'Are you sure?',
		text: manageEmployeeTranslations.delete_confirmation_text || "You won't be able to revert this!",
		icon: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#3085d6',
		cancelButtonColor: '#d33',
		confirmButtonText: manageEmployeeTranslations.delete_confirm_button || 'Yes, delete it!'
	}).then((result) => {
		if (result.isConfirmed) {
			$.ajax({
				url: '/employee/' + id,
				type: 'DELETE',
				success: function (response) {
					Swal.fire({
						icon: "success",
						title: manageEmployeeTranslations.success,
						text: manageEmployeeTranslations.employee_deleted_successfully,
					});
					reloadEmployeeData();
				},
				error: function (xhr, status, error) {
					console.error('Error deleting employee:', error);
					showError(xhr, manageEmployeeTranslations.failed_to_delete_employee);
				}
			});
		}
	});
}

// View employee details
function view_employee_details(employee) {
	// Format salary with commas
	var salary = employee.SALARY || '';
	if (salary) {
		salary = salary.toString().replace(/,/g, '');
		salary = parseFloat(salary).toLocaleString('en-US');
	} else {
		salary = '—';
	}
	
	// Format date started
	var dateStarted = employee.DATE_STARTED || '';
	if (dateStarted) {
		if (dateStarted.includes('T')) {
			dateStarted = dateStarted.split('T')[0];
		}
		var dateObj = new Date(dateStarted);
		if (!isNaN(dateObj.getTime())) {
			dateStarted = dateObj.toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});
		} else {
			dateStarted = '';
		}
	}
	
	// Populate modal fields (input fields)
	$('#view_employee_firstname').val(employee.FIRSTNAME || '');
	$('#view_employee_lastname').val(employee.LASTNAME || '');
	$('#view_employee_contact').val(employee.CONTACTNo || '');
	$('#view_employee_department').val(employee.DEPARTMENT || '');
	$('#view_employee_address').val(employee.ADDRESS || '');
	$('#view_employee_date_started').val(dateStarted);
	$('#view_employee_salary').val(salary);
	$('#view_employee_branch').val(employee.BRANCH_NAME || '');
	$('#view_employee_emergency_name').val(employee.EMERGENCY_CONTACT_NAME || '');
	$('#view_employee_emergency_phone').val(employee.EMERGENCY_CONTACT_PHONE || '');
	
	// Show modal
	$('#modal-view_employee').modal('show');
}

// Expose functions globally for onclick handlers
window.add_employee_modal = add_employee_modal;
window.edit_employee = edit_employee;
window.delete_employee = delete_employee;
window.view_employee_details = view_employee_details;
window.reloadEmployeeData = reloadEmployeeData;

