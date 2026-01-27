// ============================================
// USER MANAGEMENT JAVASCRIPT
// ============================================
// File: public/assets/js/functions/manageUsers.js
// Description: Client-side logic for user management
// Features: DataTables, AJAX, Form handling
// ============================================

var user_id;
var dataTable;
var userRoleDataTable; // DataTable for user roles modal
var tablesList = [];
var edit_user_table_id = null;
var role_id; // For user role editing
var keepUserRolesModalOpen = false; // Track if user roles modal should stay open
const ADMIN_ROLE_ID = 1; // IDNo = 1 (Administrator)
const TABLE_ROLE_ID = 2; // IDNo = 2 (Table-TabletMenu)
var assignedTableIds = new Set(); // active users' assigned TABLE_IDs (1-to-1)

// Load translations from data attributes
var manageUsersTranslations = {};
var userRolesTranslations = {};
$(document).ready(function () {
	const permFromDom = Number($('#manageUsersTranslations').data('permissions') || 0);
	const IS_ADMIN_VIEW = permFromDom === 1;
	var $transEl = $('#manageUsersTranslations');
	if ($transEl.length) {
		manageUsersTranslations = {
			active: $transEl.data('active') || 'ACTIVE',
			inactive: $transEl.data('inactive') || 'INACTIVE',
			delete: $transEl.data('delete') || 'Delete',
			edit: $transEl.data('edit') || 'Edit',
			error: $transEl.data('error') || 'Error!',
			failed_to_load_users: $transEl.data('failed-to-load-users') || 'Failed to load users. Please refresh the page.',
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

	if ($.fn.DataTable.isDataTable('#usersTable')) {
		$('#usersTable').DataTable().destroy();
	}

	const paginationTrans = manageUsersTranslations.pagination || {};
	const showingText = paginationTrans.showing || 'Showing';
	const toText = paginationTrans.to || 'to';
	const ofText = paginationTrans.of || 'of';
	const entriesText = paginationTrans.entries || 'entries';
	const searchText = paginationTrans.search || 'Search';

	dataTable = $('#usersTable').DataTable({
		columnDefs: [
			{
				createdCell: function (cell, cellData, rowData, rowIndex, colIndex) {
					$(cell).addClass('text-center');
				}
			},
			...(IS_ADMIN_VIEW ? [{
				targets: 2,
							createdCell: function (cell) {
								$(cell).removeClass('text-center');
							}
			}] : [])
		],
		pageLength: 10,
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

	reloadUserData();
	loadRestaurantTables();

	$(document).on('change', '#user_role', function () {
		toggleTableFieldForNew();
		toggleBranchFieldForNew();
	});

	$(document).on('change', '.edit_user_role', function () {
		toggleTableFieldForEdit();
	});

	// Helper function for error handling
	function showError(xhr, defaultMsg) {
		var errorMsg = defaultMsg;
		if (xhr.responseJSON && xhr.responseJSON.error) {
			errorMsg = xhr.responseJSON.error;
		}
		Swal.fire({
			icon: "error",
			title: "Error!",
			text: errorMsg,
		});
	}

	$('#edit_user').submit(function (event) {
		event.preventDefault();
		var $form = $(this);

		$.ajax({
			url: '/user/' + user_id,
			type: 'PUT',
			data: $form.serialize(),
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
				showError(xhr, 'Failed to update user');
			}
		});
	});

	$('#add_new_user').submit(function (event) {
		event.preventDefault();
		var $form = $(this);
		const salt = generateSalt(50);
		var formData = $form.serialize() + '&salt=' + salt;

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
				$form[0].reset();
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
				showError(xhr, errorMsg);
			}
		});
	});

	loadBranchesForNewUser();
	$('#modal-new_user').on('shown.bs.modal', function () {
		loadBranchesForNewUser();
	});

	// User Roles Translations
	var $userRolesTransEl = $('#userRolesTranslations');
	if ($userRolesTransEl.length) {
		userRolesTranslations = {
			active: $userRolesTransEl.data('active') || 'ACTIVE',
			inactive: $userRolesTransEl.data('inactive') || 'INACTIVE',
			pagination: {
				showing: $userRolesTransEl.data('pagination-showing') || 'Showing',
				to: $userRolesTransEl.data('pagination-to') || 'to',
				of: $userRolesTransEl.data('pagination-of') || 'of',
				entries: $userRolesTransEl.data('pagination-entries') || 'entries',
				previous: $userRolesTransEl.data('pagination-previous') || 'Previous',
				next: $userRolesTransEl.data('pagination-next') || 'Next',
				search: $userRolesTransEl.data('pagination-search') || 'Search',
				search_placeholder: $userRolesTransEl.data('pagination-search-placeholder') || 'Search...'
			}
		};
	}

	$('#modal-user-roles').on('shown.bs.modal', function () {
		if (!userRoleDataTable && $('#userRoleTable').length) {
			const pagTrans = userRolesTranslations.pagination || {};
			const showText = pagTrans.showing || 'Showing';
			const toText = pagTrans.to || 'to';
			const ofText = pagTrans.of || 'of';
			const entriesText = pagTrans.entries || 'entries';
			const searchText = pagTrans.search || 'Search';

			if ($.fn.DataTable.isDataTable('#userRoleTable')) {
				$('#userRoleTable').DataTable().destroy();
			}

			userRoleDataTable = $('#userRoleTable').DataTable({
				columnDefs: [{
					createdCell: function (cell) {
						$(cell).addClass('text-center');
					}
				}],
				pageLength: 10,
				language: {
					lengthMenu: showText + " _MENU_ " + entriesText,
					info: showText + " _START_ " + toText + " _END_ " + ofText + " _TOTAL_ " + entriesText,
					infoEmpty: showText + " 0 " + toText + " 0 " + ofText + " 0 " + entriesText,
					infoFiltered: "(" + searchText + " " + ofText + " _MAX_ " + entriesText + ")",
					search: searchText + ":",
					searchPlaceholder: pagTrans.search_placeholder || "Search...",
					paginate: {
						previous: pagTrans.previous || 'Previous',
						next: pagTrans.next || 'Next'
					}
				}
			});
			
			reloadUserRoleData();
		} else if (userRoleDataTable) {
			reloadUserRoleData();
		}
	});

	$('#modal-user-roles').on('hide.bs.modal', function (e) {
		if ($('#modal-new-role').hasClass('show') || $('#modal-edit_user_role').hasClass('show')) {
			e.preventDefault();
			e.stopImmediatePropagation();
			return false;
		}
	});
	
	$('#modal-new-role, #modal-edit_user_role').on('hidden.bs.modal', function () {
		setTimeout(function() {
			if (keepUserRolesModalOpen) {
				$('#modal-user-roles').addClass('show').css({
					'display': 'block',
					'padding-right': '0px'
				});
				$('body').addClass('modal-open');
				
				if ($('.modal-backdrop').length === 0) {
					$('body').append('<div class="modal-backdrop fade show"></div>');
				}
				
				reloadUserRoleData();
			}
		}, 200);
	});

	$(document).on('submit', 'form[action="/add_user_role"]', function (event) {
		event.preventDefault();
		var $form = $(this);
		
		$.ajax({
			url: '/add_user_role',
			type: 'POST',
			data: $form.serialize(),
			success: function (response) {
				Swal.fire({
					icon: "success",
					title: "Success!",
					text: "User role created successfully",
				});
				$form[0].reset();
				$('#modal-new-role').modal('hide');
			},
			error: function (xhr, status, error) {
				console.error('Error creating user role:', error);
				showError(xhr, 'Failed to create user role');
			}
		});
	});

	$('#update_role').submit(function (event) {
		event.preventDefault();
		var $form = $(this);
		
		$.ajax({
			url: '/user_role/' + role_id,
			type: 'PUT',
			data: $form.serialize(),
			success: function (response) {
				Swal.fire({
					icon: "success",
					title: "Success!",
					text: "User role updated successfully",
				});
				$('#modal-edit_user_role').modal('hide');
			},
			error: function (xhr, status, error) {
				console.error('Error updating user role:', error);
				showError(xhr, 'Failed to update user role');
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
	$select.empty().append('<option value="">Select Table</option>');

	const selected = (selectedId !== null && selectedId !== undefined && selectedId !== '') 
			? parseInt(selectedId)
			: null;

	(tablesList || []).forEach(function (t) {
		const tid = parseInt(t.IDNo);
		if (assignedTableIds.has(tid) && (selected === null || tid !== selected)) {
			return; // enforce 1-to-1: hide already assigned tables
		}
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

function toggleBranchFieldForNew() {
	const $wrapper = $('#new_branch_wrapper');
	const $select = $('#new_branch_id');
	if ($wrapper.length === 0 || $select.length === 0) return; // Only for admin creator UI

	const roleId = parseInt($('#user_role').val());

	if (roleId === ADMIN_ROLE_ID) {
		// Admin account: no single-branch assignment; gets ALL branches automatically
		$wrapper.hide();
		$select.prop('disabled', true).val('');
	} else {
		// Non-admin: must pick exactly one branch
		$wrapper.show();
		$select.prop('disabled', false);
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

function loadBranchesForNewUser() {
	const $select = $('#new_branch_id');
	if ($select.length === 0) return; // Only exists for admin

	$.ajax({
		url: '/branch',
		method: 'GET',
		headers: { Accept: 'application/json' },
		dataType: 'json',
		success: function (rows) {
			$select.empty();
			if (!rows || rows.length === 0) {
				$select.append('<option value=\"\">No branches</option>');
				$select.prop('disabled', true);
				return;
			}
			rows.forEach(function (b) {
				$select.append(`<option value=\"${b.IDNo}\">${b.BRANCH_NAME} (${b.BRANCH_CODE})</option>`);
			});
		},
		error: function (xhr) {
			console.error('Failed to load branches for new user:', xhr.responseText);
			$select.empty().append('<option value=\"\">Failed to load branches</option>');
			$select.prop('disabled', true);
		}
	});
}

// Reload user data in DataTable
function reloadUserData() {
	$.ajax({
		url: '/users',
		method: 'GET',
		success: function (data) {
			const permFromDom = Number($('#manageUsersTranslations').data('permissions') || 0);
			const IS_ADMIN_VIEW = permFromDom === 1;
			dataTable.clear();

			assignedTableIds = new Set();
			(data || []).forEach(function (u) {
				const tid = u.TABLE_ID;
				if (tid !== null && tid !== undefined && tid !== '') {
					assignedTableIds.add(parseInt(tid));
				}
			});
			populateTableSelect('#new_table_id');
			populateTableSelect('#edit_table_id', edit_user_table_id);
			toggleTableFieldForNew();
			toggleTableFieldForEdit();
			toggleBranchFieldForNew();

			if (!data || data.length === 0) {
				return;
			}
			var rows = [];
			var activeText = manageUsersTranslations.active || 'ACTIVE';
			var inactiveText = manageUsersTranslations.inactive || 'INACTIVE';
			var deleteLabel = manageUsersTranslations.delete || 'Delete';
			var editLabel = manageUsersTranslations.edit || 'Edit';
			
			data.forEach(function (row) {
				const isActive = row.ACTIVE && row.ACTIVE.data
						? parseInt(row.ACTIVE.data[0]) === 1
						: parseInt(row.ACTIVE) === 1;
				const status = isActive 
					? `<span class="css-blue">${activeText}</span>`
					: `<span class="css-red">${inactiveText}</span>`;

				var firstname = (row.FIRSTNAME || '').replace(/'/g, "\\'");
				var lastname = (row.LASTNAME || '').replace(/'/g, "\\'");
				var username = (row.USERNAME || '').replace(/'/g, "\\'");

				var btn = `<div class="btn-group">
					<button type="button" class="btn btn-sm bg-danger-subtle js-bs-tooltip-enabled" onclick="archive_user(${row.user_id})"
						data-bs-toggle="tooltip" aria-label="${deleteLabel}" data-bs-original-title="${deleteLabel}">
						<i class="fa fa-trash"></i>
					</button>
					<button type="button" class="btn btn-sm bg-info-subtle js-bs-tooltip-enabled" onclick="edit_user(${row.user_id}, '${firstname}', '${lastname}', '${username}', ${row.PERMISSIONS}, ${row.TABLE_ID || 'null'})"
						data-bs-toggle="tooltip" aria-label="${editLabel}" data-bs-original-title="${editLabel}">
						<i class="fa fa-pencil-alt"></i>
					</button>
				</div>`;

				const fullName = `${row.FIRSTNAME || ''} ${row.LASTNAME || ''}`.trim();

				if (IS_ADMIN_VIEW) {
					const branchLabel = row.BRANCH_LABEL || row.BRANCHES || '';
					rows.push([fullName, row.USERNAME, branchLabel, row.role, status, btn]);
				} else {
					rows.push([fullName, row.USERNAME, row.role, status, btn]);
				}
			});
			
			if (rows.length > 0) {
				dataTable.rows.add(rows).draw();
			}
		},
		error: function (xhr, status, error) {
			console.error('Error fetching users:', error);
			Swal.fire({
				icon: "error",
				title: manageUsersTranslations.error || "Error!",
				text: manageUsersTranslations.failed_to_load_users || "Failed to load users. Please refresh the page.",
			});
		}
	});
}

function generateSalt(length) {
	const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let salt = '';
	for (let i = 0; i < length; i++) {
		salt += charset.charAt(Math.floor(Math.random() * charset.length));
	}
	return salt;
}
function edit_user(id, firstname, lastname, username, role, table_id) {
	user_id = id;
	edit_user_table_id = table_id !== undefined ? table_id : null;
	$('#firstname').val(firstname);
	$('#lastname').val(lastname);
	$('#username').val(username);
	get_user_role_edit(role);
	populateTableSelect('#edit_table_id', edit_user_table_id);
	toggleTableFieldForEdit();
	$('#modal-edit_user').modal('show');
}

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
					showError(xhr, 'Failed to delete user');
				}
			});
		}
	});
}

function get_user_role() {
	const permFromDom = Number($('#manageUsersTranslations').data('permissions') || 0);
	const IS_ADMIN_VIEW = permFromDom === 1;

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
				// If current user is non-admin, hide Administrator role (IDNo = 1)
				if (!IS_ADMIN_VIEW && Number(option.IDNo) === 1) {
					return;
				}
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

function get_user_role_edit(id) {
	$.ajax({
		url: '/user_role_data',
		method: 'GET',
		success: function (response) {
			var $select = $('.edit_user_role');
			$select.empty();
			if (!response || response.length === 0) {
				return;
			}
			response.forEach(function (option) {
				$select.append($('<option>', {
					selected: option.IDNo == id,
					value: option.IDNo,
					text: option.ROLE
				}));
			});
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

function add_user_modal() {
	$('#modal-new_user').modal('show');
	get_user_role();
	toggleTableFieldForNew();
}

function showUserRolesModal() {
	keepUserRolesModalOpen = true;
	$('#modal-user-roles').modal('show');
}

function openNewRoleModal() {
	keepUserRolesModalOpen = true;
	$('#modal-new-role').modal('show');
}

$(document).on('click', '#modal-user-roles .btn-close, #modal-user-roles button[data-bs-dismiss="modal"]', function() {
	keepUserRolesModalOpen = false;
});
function reloadUserRoleData() {
	if (!userRoleDataTable) return;
	
	$.ajax({
		url: '/user_role_data',
		method: 'GET',
		success: function (data) {
			userRoleDataTable.clear();
			if (!data || data.length === 0) {
				return;
			}
			
			var rows = [];
			var activeText = userRolesTranslations.active || 'ACTIVE';
			var inactiveText = userRolesTranslations.inactive || 'INACTIVE';
			
			data.forEach(function (row) {
				const isActive = row.ACTIVE && row.ACTIVE.data
					? parseInt(row.ACTIVE.data[0]) === 1
					: parseInt(row.ACTIVE) === 1;
				const status = isActive 
					? `<span class="css-blue">${activeText}</span>`
					: `<span class="css-red">${inactiveText}</span>`;

				var role = (row.ROLE || '').replace(/'/g, "\\'");
				var btn = `<div class="btn-group">
					<button type="button" class="btn btn-sm bg-info-subtle js-bs-tooltip-enabled" onclick="edit_role(${row.IDNo}, '${role}')"
						data-bs-toggle="tooltip" aria-label="Edit" data-bs-original-title="Edit">
						<i class="fa fa-pencil-alt"></i>
					</button>
				</div>`;

				rows.push([row.ROLE, status, btn]);
			});
			
			if (rows.length > 0) {
				userRoleDataTable.rows.add(rows).draw();
			}
		},
		error: function (xhr, status, error) {
			console.error('Error fetching user roles:', error);
			Swal.fire({
				icon: "error",
				title: "Error!",
				text: "Failed to load user roles. Please refresh the page.",
			});
		}
	});
}

function edit_role(id, role) {
	role_id = id;
	$('#role').val(role);
	$('#modal-edit_user_role').modal('show');
}

function archive_role(id) {
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
				url: '/user_role/remove/' + id,
				type: 'PUT',
				success: function (response) {
					Swal.fire({
						icon: "success",
						title: "Deleted!",
						text: "User role has been deleted",
					});
					reloadUserRoleData();
				},
				error: function (xhr, status, error) {
					console.error('Error deleting user role:', error);
					showError(xhr, 'Failed to delete user role');
				}
			});
		}
	});
}

window.showUserRolesModal = showUserRolesModal;
window.openNewRoleModal = openNewRoleModal;
window.edit_role = edit_role;
window.archive_role = archive_role;
