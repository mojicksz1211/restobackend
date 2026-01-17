// ============================================
// USER ROLE MANAGEMENT JAVASCRIPT
// ============================================
// File: public/assets/js/functions/userRoles.js
// Description: Client-side logic for user role management
// Features: DataTables, AJAX, Form handling
// ============================================

var role_id;
var dataTable;

// Load translations from data attributes
var userRolesTranslations = {};
$(document).ready(function () {
	var $transEl = $('#userRolesTranslations');
	if ($transEl.length) {
		userRolesTranslations = {
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
	if ($.fn.DataTable.isDataTable('#userRoleTable')) {
		$('#userRoleTable').DataTable().destroy();
	}

	// Get pagination translations
	const paginationTrans = userRolesTranslations.pagination || {};
	const showingText = paginationTrans.showing || 'Showing';
	const toText = paginationTrans.to || 'to';
	const ofText = paginationTrans.of || 'of';
	const entriesText = paginationTrans.entries || 'entries';
	const searchText = paginationTrans.search || 'Search';

	dataTable = $('#userRoleTable').DataTable({
		columnDefs: [{
			createdCell: function (cell, cellData, rowData, rowIndex, colIndex) {
				$(cell).addClass('text-center');
			}
		}],
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

	// Initial load
	reloadUserRoleData();

	// Edit user role form submit
	$('#update_role').submit(function (event) {
		event.preventDefault();

		var formData = $(this).serialize();
		$.ajax({
			url: '/user_role/' + role_id,
			type: 'PUT',
			data: formData,
			success: function (response) {
				Swal.fire({
					icon: "success",
					title: "Success!",
					text: "User role updated successfully",
				});
				reloadUserRoleData();
				$('#modal-edit_user_role').modal('hide');
			},
			error: function (xhr, status, error) {
				console.error('Error updating user role:', error);
				var errorMsg = 'Failed to update user role';
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
});

// ============================================
// GLOBAL FUNCTIONS
// ============================================

// Reload user role data in DataTable
function reloadUserRoleData() {
	$.ajax({
		url: '/user_role_data',
		method: 'GET',
		success: function (data) {
			dataTable.clear();
			if (!data || data.length === 0) {
				return;
			}
			data.forEach(function (row) {
				var status = '';
				const isActive = row.ACTIVE && row.ACTIVE.data
					? parseInt(row.ACTIVE.data[0]) === 1
					: parseInt(row.ACTIVE) === 1;
				
				if (isActive) {
					status = `<span class="css-blue">${userRolesTranslations.active || 'ACTIVE'}</span>`;
				} else {
					status = `<span class="css-red">${userRolesTranslations.inactive || 'INACTIVE'}</span>`;
				}

				// Escape single quotes for JavaScript
				var role = (row.ROLE || '').replace(/'/g, "\\'");

				// WITHOUT DELETE FUNCTION ACTION
				var btn = `<div class="btn-group">
					<button type="button" class="btn btn-sm bg-info-subtle js-bs-tooltip-enabled" onclick="edit_role(${row.IDNo}, '${role}')"
						data-bs-toggle="tooltip" aria-label="Edit" data-bs-original-title="Edit">
						<i class="fa fa-pencil-alt"></i>
					</button>
				</div>`;

				dataTable.row.add([row.ROLE, status, btn]).draw();
			});
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

// Open edit user role modal with data
function edit_role(id, role) {
	role_id = id;
	$('#role').val(role);
	$('#modal-edit_user_role').modal('show');
}

// Archive/delete user role with confirmation
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
					var errorMsg = 'Failed to delete user role';
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

