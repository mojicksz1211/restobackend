// ============================================
// USER MANAGEMENT JAVASCRIPT
// ============================================
// File: public/assets/js/functions/manageUsers.js
// Description: Client-side logic for user management
// Features: DataTables, AJAX, Form handling
// ============================================

var user_id;
var dataTable;
var tablesList = [];
var edit_user_table_id = null;
const TABLE_ROLE_ID = 2; // IDNo = 2 (Table-TabletMenu)
var assignedTableIds = new Set(); // active users' assigned TABLE_IDs (1-to-1)

$(document).ready(function () {
	if ($.fn.DataTable.isDataTable('#usersTable')) {
		$('#usersTable').DataTable().destroy();
	}

	dataTable = $('#usersTable').DataTable({
		columnDefs: [{
			createdCell: function (cell, cellData, rowData, rowIndex, colIndex) {
				$(cell).addClass('text-center');
			}
		}]
	});

	// Initial load
	reloadUserData();
	loadRestaurantTables();

	// Toggle table select when role changes (new user)
	$(document).on('change', '#user_role', function () {
		toggleTableFieldForNew();
	});

	// Toggle table select when role changes (edit user)
	$(document).on('change', '.edit_user_role', function () {
		toggleTableFieldForEdit();
	});

	// Edit user form submit
	$('#edit_user').submit(function (event) {
		event.preventDefault();

		var formData = $(this).serialize();
		$.ajax({
			url: '/user/' + user_id,
			type: 'PUT',
			data: formData,
			success: function (response) {
				Swal.fire({
					icon: "success",
					title: "Success!",
					text: "User updated successfully",
				});
				reloadUserData();
				$('#modal-edit_user').modal('hide');
			},
			error: function (xhr, status, error) {
				console.error('Error updating user:', error);
				var errorMsg = 'Failed to update user';
				if (xhr.responseJSON && xhr.responseJSON.error) {
					errorMsg = xhr.responseJSON.error;
				}
				Swal.fire({
					icon: "error",
					title: "Error!",
					text: errorMsg,
				});
			}
		});
	});

	// Add new user form submit
	$('#add_new_user').submit(function (event) {
		event.preventDefault();

		const salt = generateSalt(50);
		var formData = $(this).serialize();
		formData += '&salt=' + salt;

		$.ajax({
			url: '/add_user',
			type: 'POST',
			data: formData,
			success: function (response) {
				Swal.fire({
					icon: "success",
					title: "Success!",
					text: "User created successfully",
				});
				reloadUserData();
				$('#modal-new_user').modal('hide');
				$('#add_new_user')[0].reset();
			},
			error: function (xhr, status, error) {
				console.error('Error creating user:', error);
				var errorMsg = 'Failed to create user';
				if (xhr.responseJSON && xhr.responseJSON.error) {
					errorMsg = xhr.responseJSON.error;
					if (errorMsg === 'password') {
						errorMsg = 'Password not match!';
					}
				}
				Swal.fire({
					icon: "error",
					title: "Error!",
					text: errorMsg,
				});
			}
		});
	});
});

function loadRestaurantTables() {
	$.ajax({
		url: '/restaurant_tables',
		method: 'GET',
		dataType: 'json',
		success: function (rows) {
			tablesList = rows || [];
			populateTableSelect('#new_table_id');
			populateTableSelect('#edit_table_id', edit_user_table_id);
		},
		error: function (xhr) {
			console.error('Failed to load restaurant tables:', xhr.responseText);
		}
	});
}

function populateTableSelect(selector, selectedId = null) {
	const $select = $(selector);
	if ($select.length === 0) return;
	$select.empty();
	$select.append('<option value="">Select Table</option>');

	const selected =
		selectedId !== null && selectedId !== undefined && selectedId !== ''
			? parseInt(selectedId)
			: null;

	(tablesList || []).forEach(function (t) {
		const tid = parseInt(t.IDNo);
		const isAssignedToOther = assignedTableIds.has(tid) && (selected === null || tid !== selected);
		if (isAssignedToOther) return; // enforce 1-to-1: hide already assigned tables
		$select.append(`<option value="${t.IDNo}">#${t.TABLE_NUMBER}</option>`);
	});

	if (selected !== null) {
		$select.val(String(selected));
	}
}

function toggleTableFieldForNew() {
	const roleId = parseInt($('#user_role').val());
	if (roleId === TABLE_ROLE_ID) {
		$('#new_table_wrapper').show();
		if (tablesList.length === 0) loadRestaurantTables();
	} else {
		$('#new_table_wrapper').hide();
		$('#new_table_id').val('');
	}
}

function toggleTableFieldForEdit() {
	const roleId = parseInt($('.edit_user_role').val());
	if (roleId === TABLE_ROLE_ID) {
		$('#edit_table_wrapper').show();
		if (tablesList.length === 0) loadRestaurantTables();
		// keep selection
		if (edit_user_table_id !== null) {
			populateTableSelect('#edit_table_id', edit_user_table_id);
		}
	} else {
		$('#edit_table_wrapper').hide();
		$('#edit_table_id').val('');
	}
}

// ============================================
// GLOBAL FUNCTIONS
// ============================================

// Reload user data in DataTable
function reloadUserData() {
	$.ajax({
		url: '/users',
		method: 'GET',
		success: function (data) {
			dataTable.clear();

			// rebuild assigned tables map for 1-to-1 UI filtering
			assignedTableIds = new Set();
			(data || []).forEach(function (u) {
				const tid = u.TABLE_ID;
				if (tid !== null && tid !== undefined && tid !== '') {
					assignedTableIds.add(parseInt(tid));
				}
			});
			// refresh selects based on assigned table IDs
			populateTableSelect('#new_table_id');
			populateTableSelect('#edit_table_id', edit_user_table_id);
			toggleTableFieldForNew();
			toggleTableFieldForEdit();

			if (!data || data.length === 0) {
				return;
			}
			data.forEach(function (row) {
				var status = '';
				// ACTIVE can be BIT (Buffer) or TINYINT (number) depending on MySQL settings
				const isActive =
					row.ACTIVE && row.ACTIVE.data
						? parseInt(row.ACTIVE.data[0]) === 1
						: parseInt(row.ACTIVE) === 1;

				if (isActive) {
					status = '<span class="css-blue">ACTIVE</span>';
				} else {
					status = '<span class="css-red">INACTIVE</span>';
				}

				// Escape single quotes for JavaScript
				var firstname = (row.FIRSTNAME || '').replace(/'/g, "\\'");
				var lastname = (row.LASTNAME || '').replace(/'/g, "\\'");
				var username = (row.USERNAME || '').replace(/'/g, "\\'");

				var btn = `<div class="btn-group">
					<button type="button" class="btn btn-sm bg-danger-subtle js-bs-tooltip-enabled" onclick="archive_user(${row.user_id})"
						data-bs-toggle="tooltip" aria-label="Delete" data-bs-original-title="Delete">
						<i class="fa fa-trash"></i>
					</button>
					<button type="button" class="btn btn-sm bg-info-subtle js-bs-tooltip-enabled" onclick="edit_user(${row.user_id}, '${firstname}', '${lastname}', '${username}', ${row.PERMISSIONS}, ${row.TABLE_ID || 'null'})"
						data-bs-toggle="tooltip" aria-label="Edit" data-bs-original-title="Edit">
						<i class="fa fa-pencil-alt"></i>
					</button>
				</div>`;

				dataTable.row.add([row.LASTNAME, row.FIRSTNAME, row.USERNAME, row.role, status, btn]).draw();
			});
		},
		error: function (xhr, status, error) {
			console.error('Error fetching users:', error);
			Swal.fire({
				icon: "error",
				title: "Error!",
				text: "Failed to load users. Please refresh the page.",
			});
		}
	});
}

// Generate salt for password
function generateSalt(length) {
	const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let salt = '';
	for (let i = 0; i < length; i++) {
		salt += charset.charAt(Math.floor(Math.random() * charset.length));
	}
	return salt;
}

// Open edit user modal with data
function edit_user(id, firstname, lastname, username, role, table_id) {
	user_id = id;
	edit_user_table_id = table_id !== undefined ? table_id : null;
	$('#firstname').val(firstname);
	$('#lastname').val(lastname);
	$('#username').val(username);
	get_user_role_edit(role);
	// set table dropdown default (will show only if role is 2)
	populateTableSelect('#edit_table_id', edit_user_table_id);
	toggleTableFieldForEdit();
	$('#modal-edit_user').modal('show');
}

// Archive/delete user with confirmation
function archive_user(id) {
	Swal.fire({
		title: 'Are you sure?',
		text: "You won't be able to revert this!",
		icon: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#3085d6',
		cancelButtonColor: '#d33',
		confirmButtonText: 'Yes, delete it!'
	}).then((result) => {
		if (result.isConfirmed) {
			$.ajax({
				url: '/user/remove/' + id,
				type: 'PUT',
				success: function (response) {
					Swal.fire({
						icon: "success",
						title: "Deleted!",
						text: "User has been deleted",
					});
					reloadUserData();
				},
				error: function (xhr, status, error) {
					console.error('Error deleting user:', error);
					var errorMsg = 'Failed to delete user';
					if (xhr.responseJSON && xhr.responseJSON.error) {
						errorMsg = xhr.responseJSON.error;
					}
					Swal.fire({
						icon: "error",
						title: "Error!",
						text: errorMsg,
					});
				}
			});
		}
	});
}

// Load user roles for dropdown (new user)
function get_user_role() {
	$.ajax({
		url: '/user_role_data',
		method: 'GET',
		success: function (response) {
			var selectOptions = $('#user_role');
			selectOptions.empty();
			if (!response || response.length === 0) {
				return;
			}
			response.forEach(function (option) {
				selectOptions.append($('<option>', {
					value: option.IDNo,
					text: option.ROLE
				}));
			});
			toggleTableFieldForNew();
		},
		error: function (xhr, status, error) {
			console.error('Error fetching user roles:', error);
			Swal.fire({
				icon: "error",
				title: "Error!",
				text: "Failed to load user roles",
			});
		}
	});
}

// Load user roles for dropdown (edit user)
function get_user_role_edit(id) {
	$.ajax({
		url: '/user_role_data',
		method: 'GET',
		success: function (response) {
			var selectOptionsEdit = $('.edit_user_role');
			selectOptionsEdit.empty();
			if (!response || response.length === 0) {
				return;
			}
			response.forEach(function (option) {
				var selected = false;
				if (option.IDNo == id) {
					selected = true;
				}
				selectOptionsEdit.append($('<option>', {
					selected: selected,
					value: option.IDNo,
					text: option.ROLE
				}));
			});
			// After roles loaded, toggle table field visibility
			toggleTableFieldForEdit();
		},
		error: function (xhr, status, error) {
			console.error('Error fetching user roles:', error);
			Swal.fire({
				icon: "error",
				title: "Error!",
				text: "Failed to load user roles",
			});
		}
	});
}

// Open new user modal
function add_user_modal() {
	$('#modal-new_user').modal('show');
	get_user_role();
	toggleTableFieldForNew();
}
