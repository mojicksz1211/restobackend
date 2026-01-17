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

// Load translations from data attributes
var manageTableTranslations = {};
$(document).ready(function () {
	// Load translations from data attributes
	var $transEl = $('#manageTableTranslations');
	if ($transEl.length) {
		manageTableTranslations = {
			success: $transEl.data('success') || 'Success!',
			error: $transEl.data('error') || 'Error!',
			table_created_successfully: $transEl.data('table-created-successfully') || 'Restaurant table created successfully',
			table_updated_successfully: $transEl.data('table-updated-successfully') || 'Restaurant table updated successfully',
			table_deleted_successfully: $transEl.data('table-deleted-successfully') || 'Restaurant table has been deleted',
			failed_to_create_table: $transEl.data('failed-to-create-table') || 'Failed to create restaurant table',
			failed_to_update_table: $transEl.data('failed-to-update-table') || 'Failed to update restaurant table',
			failed_to_delete_table: $transEl.data('failed-to-delete-table') || 'Failed to delete restaurant table',
			failed_to_load_tables: $transEl.data('failed-to-load-tables') || 'Failed to load restaurant tables. Please refresh the page.',
			delete_confirmation_title: $transEl.data('delete-confirmation-title') || 'Are you sure?',
			delete_confirmation_text: $transEl.data('delete-confirmation-text') || "You won't be able to revert this!",
			delete_confirm_button: $transEl.data('delete-confirm-button') || 'Yes, delete it!',
			all: $transEl.data('all') || 'All',
			available: $transEl.data('available') || 'Available',
			occupied: $transEl.data('occupied') || 'Occupied',
			reserved: $transEl.data('reserved') || 'Reserved',
			not_available: $transEl.data('not-available') || 'Not Available',
			unknown: $transEl.data('unknown') || 'Unknown',
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
		
		// Update filter dropdown options with translations
		var $filterStatus = $('#filter_status');
		if ($filterStatus.length) {
			$filterStatus.html(`
				<option value="">${manageTableTranslations.all}</option>
				<option value="1">${manageTableTranslations.available}</option>
				<option value="2">${manageTableTranslations.occupied}</option>
				<option value="4">${manageTableTranslations.reserved}</option>
				<option value="3">${manageTableTranslations.not_available}</option>
			`);
		}
	}

	if ($.fn.DataTable.isDataTable('#restaurantTableTable')) {
		$('#restaurantTableTable').DataTable().destroy();
	}

	// Get pagination translations
	const paginationTrans = manageTableTranslations.pagination || {};
	const showingText = paginationTrans.showing || 'Showing';
	const toText = paginationTrans.to || 'to';
	const ofText = paginationTrans.of || 'of';
	const entriesText = paginationTrans.entries || 'entries';
	const searchText = paginationTrans.search || 'Search';

	dataTable = $('#restaurantTableTable').DataTable({
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
					title: manageTableTranslations.success,
					text: manageTableTranslations.table_updated_successfully,
				});
				reloadRestaurantTableData();
				$('#modal-edit_restaurant_table').modal('hide');
			},
			error: function (xhr, status, error) {
				console.error('Error updating restaurant table:', error);
				var errorMsg = manageTableTranslations.failed_to_update_table;
				if (xhr.responseJSON && xhr.responseJSON.error) {
					errorMsg = xhr.responseJSON.error;
				}
				Swal.fire({
					icon: "error",
					title: manageTableTranslations.error,
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
					title: manageTableTranslations.success,
					text: manageTableTranslations.table_created_successfully,
				});
				reloadRestaurantTableData();
				$('#modal-new_restaurant_table').modal('hide');
				$('#add_new_restaurant_table')[0].reset();
			},
			error: function (xhr, status, error) {
				console.error('Error creating restaurant table:', error);
				var errorMessage = manageTableTranslations.failed_to_create_table;
				if (xhr.responseJSON && xhr.responseJSON.error) {
					errorMessage = xhr.responseJSON.error;
				}
				Swal.fire({
					icon: "error",
					title: manageTableTranslations.error,
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
				title: manageTableTranslations.error,
				text: manageTableTranslations.failed_to_load_tables,
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
				statusBadge = '<span class="badge bg-success">' + (manageTableTranslations.available || 'Available') + '</span>';
				break;
			case 2:
				statusBadge = '<span class="badge bg-warning">' + (manageTableTranslations.occupied || 'Occupied') + '</span>';
				break;
			case 4:
				statusBadge = '<span class="badge bg-info">' + (manageTableTranslations.reserved || 'Reserved') + '</span>';
				break;
			case 3:
				statusBadge = '<span class="badge bg-danger">' + (manageTableTranslations.not_available || 'Not Available') + '</span>';
				break;
			default:
				statusBadge = '<span class="badge bg-secondary">' + (manageTableTranslations.unknown || 'Unknown') + '</span>';
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
		title: manageTableTranslations.delete_confirmation_title || 'Are you sure?',
		text: manageTableTranslations.delete_confirmation_text || "You won't be able to revert this!",
		icon: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#3085d6',
		cancelButtonColor: '#d33',
		confirmButtonText: manageTableTranslations.delete_confirm_button || 'Yes, delete it!'
	}).then((result) => {
		if (result.isConfirmed) {
			$.ajax({
				url: '/restaurant_table/' + id,
				type: 'DELETE',
				success: function (response) {
					Swal.fire({
						icon: "success",
						title: manageTableTranslations.success,
						text: manageTableTranslations.table_deleted_successfully,
					});
					reloadRestaurantTableData();
				},
				error: function (xhr, status, error) {
					console.error('Error deleting restaurant table:', error);
					var errorMsg = manageTableTranslations.failed_to_delete_table;
					if (xhr.responseJSON && xhr.responseJSON.error) {
						errorMsg = xhr.responseJSON.error;
					}
					Swal.fire({
						icon: "error",
						title: manageTableTranslations.error,
						text: errorMsg,
					});
				}
			});
		}
	});
}

