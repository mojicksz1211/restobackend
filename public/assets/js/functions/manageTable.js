// ============================================
// RESTAURANT TABLE MANAGEMENT JAVASCRIPT
// ============================================
// File: public/assets/js/functions/manageTable.js
// Description: Client-side logic for restaurant table management
// Features: DataTables, AJAX, Form handling
// ============================================

var restaurant_table_id;
var dataTable;
var allTableData = [];

$(document).ready(function () {
	if ($.fn.DataTable.isDataTable('#restaurantTableTable')) {
		$('#restaurantTableTable').DataTable().destroy();
	}

	dataTable = $('#restaurantTableTable').DataTable({
		columnDefs: [{
			createdCell: function (cell, cellData, rowData, rowIndex, colIndex) {
				$(cell).addClass('text-center');
			}
		}]
	});

	// Initial load
	reloadRestaurantTableData();

	// Filter event listeners
	$('#filter_status').on('change', applyFilters);

	// Edit restaurant table form submit
	$('#edit_restaurant_table').submit(function (event) {
		event.preventDefault();

		var formData = $(this).serialize();
		$.ajax({
			url: '/restaurant_table/' + restaurant_table_id,
			type: 'PUT',
			data: formData,
			success: function (response) {
				Swal.fire({
					icon: "success",
					title: "Success!",
					text: "Restaurant table updated successfully",
				});
				reloadRestaurantTableData();
				$('#modal-edit_restaurant_table').modal('hide');
			},
			error: function (xhr, status, error) {
				console.error('Error updating restaurant table:', error);
				var errorMsg = 'Failed to update restaurant table';
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

	// Add new restaurant table form submit
	$('#add_new_restaurant_table').submit(function (event) {
		event.preventDefault();

		var formData = $(this).serialize();
		$.ajax({
			url: '/restaurant_table',
			type: 'POST',
			data: formData,
			success: function (response) {
				Swal.fire({
					icon: "success",
					title: "Success!",
					text: "Restaurant table created successfully",
				});
				reloadRestaurantTableData();
				$('#modal-new_restaurant_table').modal('hide');
				$('#add_new_restaurant_table')[0].reset();
			},
			error: function (xhr, status, error) {
				console.error('Error creating restaurant table:', error);
				var errorMessage = 'Failed to create restaurant table';
				if (xhr.responseJSON && xhr.responseJSON.error) {
					errorMessage = xhr.responseJSON.error;
				}
				Swal.fire({
					icon: "error",
					title: "Error!",
					text: errorMessage,
				});
			}
		});
	});
});

// ============================================
// GLOBAL FUNCTIONS
// ============================================

// Reload restaurant table data in DataTable
function reloadRestaurantTableData() {
	$.ajax({
		url: '/restaurant_tables',
		method: 'GET',
		success: function (data) {
			allTableData = data;
			applyFilters();
		},
		error: function (xhr, status, error) {
			console.error('Error fetching restaurant tables:', error);
			Swal.fire({
				icon: "error",
				title: "Error!",
				text: "Failed to load restaurant tables. Please refresh the page.",
			});
		}
	});
}

// Apply filters to restaurant table data
function applyFilters() {
	var statusFilter = $('#filter_status').val();

	var filteredData = allTableData.filter(function(row) {
		if (statusFilter !== '' && parseInt(row.STATUS) != parseInt(statusFilter)) {
			return false;
		}
		return true;
	});

	// Clear and repopulate table
	dataTable.clear();
	filteredData.forEach(function (row) {
		// Format date
		var dateCreated = '';
		if (row.ENCODED_DT) {
			var date = new Date(row.ENCODED_DT);
			dateCreated = date.toLocaleDateString('en-US', { 
				year: 'numeric', 
				month: 'short', 
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} else {
			dateCreated = 'N/A';
		}

		// Format status
		var statusBadge = '';
		switch(parseInt(row.STATUS)) {
			case 1:
				statusBadge = '<span class="badge bg-success">Available</span>';
				break;
			case 2:
				statusBadge = '<span class="badge bg-warning">Occupied</span>';
				break;
			case 4:
				statusBadge = '<span class="badge bg-info">Reserved</span>';
				break;
			case 3:
				statusBadge = '<span class="badge bg-danger">Not Available</span>';
				break;
			default:
				statusBadge = '<span class="badge bg-secondary">Unknown</span>';
		}

		// Escape single quotes for JavaScript
		var tableNumber = (row.TABLE_NUMBER || '').replace(/'/g, "\\'");
		
		var btn = `<div class="btn-group">
			<button type="button" class="btn btn-sm bg-danger-subtle js-bs-tooltip-enabled" onclick="delete_restaurant_table(${row.IDNo})"
				data-bs-toggle="tooltip" aria-label="Delete" data-bs-original-title="Delete">
				<i class="fa fa-trash"></i>
			</button>
			<button type="button" class="btn btn-sm bg-info-subtle js-bs-tooltip-enabled" onclick="edit_restaurant_table(${row.IDNo}, '${tableNumber}', ${row.CAPACITY || 0}, ${row.STATUS || 1})"
				data-bs-toggle="tooltip" aria-label="Edit" data-bs-original-title="Edit">
				<i class="fa fa-pencil-alt"></i>
			</button>
		</div>`;

		dataTable.row.add([
			row.TABLE_NUMBER,
			row.CAPACITY || 0,
			statusBadge,
			dateCreated,
			btn
		]).draw();
	});
}

// Open new restaurant table modal
function add_restaurant_table_modal() {
	$('#modal-new_restaurant_table').modal('show');
}

// Open edit restaurant table modal with data
function edit_restaurant_table(id, tableNumber, capacity, status) {
	restaurant_table_id = id;
	$('#edit_restaurant_table_id').val(id);
	$('#edit_table_number').val(tableNumber || '');
	$('#edit_capacity').val(capacity || 0);
	$('#edit_status').val(status || 1);
	$('#modal-edit_restaurant_table').modal('show');
}

// Delete restaurant table with confirmation
function delete_restaurant_table(id) {
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
				url: '/restaurant_table/' + id,
				type: 'DELETE',
				success: function (response) {
					Swal.fire({
						icon: "success",
						title: "Deleted!",
						text: "Restaurant table has been deleted",
					});
					reloadRestaurantTableData();
				},
				error: function (xhr, status, error) {
					console.error('Error deleting restaurant table:', error);
					var errorMsg = 'Failed to delete restaurant table';
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

