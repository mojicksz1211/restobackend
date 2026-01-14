// ============================================
// USER ROLE MANAGEMENT JAVASCRIPT
// ============================================
// File: public/assets/js/functions/userRoles.js
// Description: Client-side logic for user role management
// Features: DataTables, AJAX, Form handling
// ============================================

var role_id;
var dataTable;

$(document).ready(function () {
	if ($.fn.DataTable.isDataTable('#userRoleTable')) {
		$('#userRoleTable').DataTable().destroy();
	}

	dataTable = $('#userRoleTable').DataTable({
		columnDefs: [{
			createdCell: function (cell, cellData, rowData, rowIndex, colIndex) {
				$(cell).addClass('text-center');
			}
		}]
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
				if (row.ACTIVE.data[0] == 1) {
					status = '<span class="css-blue">ACTIVE</span>';
				} else {
					status = '<span class="css-red">INACTIVE</span>';
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

