// ============================================
// USER MANAGEMENT JAVASCRIPT
// ============================================
// File: public/assets/js/functions/manageUsers.js
// Description: Client-side logic for user management
// Features: DataTables, AJAX, Form handling
// ============================================

var user_id;
var dataTable;

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
			if (!data || data.length === 0) {
				return;
			}
			data.forEach(function (row) {
				var status = '';
				if (row.ACTIVE.data[0] == 1) {
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
					<button type="button" class="btn btn-sm bg-info-subtle js-bs-tooltip-enabled" onclick="edit_user(${row.user_id}, '${firstname}', '${lastname}', '${username}', ${row.PERMISSIONS})"
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
function edit_user(id, firstname, lastname, username, role) {
	user_id = id;
	$('#firstname').val(firstname);
	$('#lastname').val(lastname);
	$('#username').val(username);
	get_user_role_edit(role);
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
}
