// ============================================
// RESTAURANT TABLE MANAGEMENT JAVASCRIPT
// ============================================
// File: public/assets/js/functions/manageTable.js
// Description: Client-side logic for restaurant table management
// Features: DataTables, AJAX, Form handling
// ============================================

// Immediate execution test
console.log('=== manageTable.js FILE EXECUTING ===');
console.log('Timestamp:', new Date().toISOString());

var restaurant_table_id;
var itemsPerPage = 10;
var showBranchColumn = false;
var manageTableTranslations = {};
var manageTableDataTable;

function getTableContext() {
	const el = document.getElementById('tableContextData');
	if (!el) {
		return { permissions: 0, branchId: null };
	}
	const permissions = parseInt(el.getAttribute('data-permissions') || '0');
	const branchId = el.getAttribute('data-branch-id') || null;
	return { permissions, branchId };
}

function adminNeedsBranchSelection() {
	const ctx = getTableContext();
	return ctx.permissions === 1 && !ctx.branchId;
}

function requireBranchSelection(message) {
	if (!adminNeedsBranchSelection()) {
		return false;
	}
	const text = message || 'Please select a specific branch in the top bar first.';
	if (typeof Swal !== 'undefined') {
		Swal.fire({
			icon: 'warning',
			title: 'Select a branch',
			text
		});
	} else {
		alert(text);
	}
	return true;
}

// Wait for DOM and jQuery
(function() {
	console.log('Setting up DOM ready handler...');

	function initManageTable() {
		if (typeof jQuery === 'undefined') {
			console.error('ERROR: jQuery is not loaded!');
			setTimeout(initManageTable, 100);
			return;
		}

		console.log('✓ jQuery is loaded, version:', jQuery.fn.jquery);

		$(document).ready(function () {
			console.log('=== Document ready - initializing manageTable ===');

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
			}

			showBranchColumn = adminNeedsBranchSelection();

			initializeDataTable();
			bindGlobalEvents();
			bindFilterControls();
			bindFormSubmissions();
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initManageTable);
	} else {
		initManageTable();
	}
})();

function initializeDataTable() {
	var $table = $('#restaurantTables');
	if (!$table.length) {
		console.error('restaurantTables table not found!');
		return;
	}

	if ($.fn.DataTable.isDataTable($table)) {
		manageTableDataTable = $table.DataTable();
		manageTableDataTable.ajax.reload();
		return;
	}

	// Get pagination translations
	const paginationTrans = manageTableTranslations.pagination || {};
	const showingText = paginationTrans.showing || 'Showing';
	const toText = paginationTrans.to || 'to';
	const ofText = paginationTrans.of || 'of';
	const entriesText = paginationTrans.entries || 'entries';
	const searchText = paginationTrans.search || 'Search';

	manageTableDataTable = $table.DataTable({
		responsive: true,
		lengthChange: false,
		pageLength: itemsPerPage,
		ajax: {
			url: '/restaurant_tables',
			method: 'GET',
			dataSrc: '',
			error: function(xhr, status, error) {
				console.error('AJAX Error fetching restaurant tables:', status, error);
				if (typeof Swal !== 'undefined') {
					Swal.fire({
						icon: "error",
						title: manageTableTranslations.error || 'Error',
						text: manageTableTranslations.failed_to_load_tables || 'Failed to load tables',
					});
				} else {
					console.error('SweetAlert2 (Swal) is not loaded!');
				}
			}
		},
		columns: getTableColumns(),
		order: [[0, 'asc']],
		columnDefs: [
			{
				targets: 3,
				visible: showBranchColumn
			},
			{
				targets: -1,
				orderable: false,
				searchable: false
			}
		],
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
}

function getTableColumns() {
	return [
		{
			data: 'TABLE_NUMBER',
			className: 'text-center align-middle',
			render: function(data) {
				return data || 'N/A';
			}
		},
		{
			data: 'CAPACITY',
			className: 'text-center align-middle',
			render: function(data) {
				return data || 0;
			}
		},
		{
			data: 'STATUS',
			className: 'text-center align-middle',
			render: function(data, type) {
				if (type === 'display') {
					return formatStatusBadge(data);
				}
				return data;
			}
		},
		{
			data: null,
			className: 'text-center align-middle',
			render: function(data, type) {
				if (type === 'display') {
					return getBranchLabel(data);
				}
				return data && data.BRANCH_NAME ? data.BRANCH_NAME : '';
			}
		},
		{
			data: null,
			className: 'text-center align-middle',
			render: function(data) {
				var tableNumber = (data.TABLE_NUMBER || '').replace(/'/g, "\\'");
				var capacity = data.CAPACITY || 0;
				var status = data.STATUS || 1;
				return `
					<div class="btn-group" role="group">
						<button type="button" class="btn btn-sm bg-secondary-subtle js-bs-tooltip-enabled" onclick="view_transaction_history(${data.IDNo}, '${tableNumber}')"
							data-bs-toggle="tooltip" aria-label="Transaction History" data-bs-original-title="Transaction History">
							<i class="fa fa-history"></i>
						</button>
						<button type="button" class="btn btn-sm bg-info-subtle js-bs-tooltip-enabled" onclick="edit_restaurant_table(${data.IDNo}, '${tableNumber}', ${capacity}, ${status})"
							data-bs-toggle="tooltip" aria-label="Edit" data-bs-original-title="Edit">
							<i class="fa fa-pencil-alt"></i>
						</button>
						<button type="button" class="btn btn-sm bg-danger-subtle js-bs-tooltip-enabled" onclick="delete_restaurant_table(${data.IDNo})"
							data-bs-toggle="tooltip" aria-label="Delete" data-bs-original-title="Delete">
							<i class="fa fa-trash"></i>
						</button>
					</div>
				`;
			}
		}
	];
}

function formatStatusBadge(status) {
	var badge = '<span class="badge bg-secondary">Unknown</span>';
	switch (parseInt(status)) {
		case 1:
			badge = '<span class="badge bg-success">' + (manageTableTranslations.available || 'Available') + '</span>';
			break;
		case 2:
			badge = '<span class="badge bg-warning">' + (manageTableTranslations.occupied || 'Occupied') + '</span>';
			break;
		case 4:
			badge = '<span class="badge bg-info">' + (manageTableTranslations.reserved || 'Reserved') + '</span>';
			break;
		case 3:
			badge = '<span class="badge bg-danger">' + (manageTableTranslations.not_available || 'Not Available') + '</span>';
			break;
		default:
			badge = '<span class="badge bg-secondary">' + (manageTableTranslations.unknown || 'Unknown') + '</span>';
	}
	return badge;
}

function getBranchLabel(row) {
	var branchLabel = row && (row.BRANCH_NAME || row.BRANCH_LABEL || row.BRANCH_CODE || row.BRANCH_ID) ? (row.BRANCH_NAME || row.BRANCH_LABEL || row.BRANCH_CODE || row.BRANCH_ID) : 'N/A';
	if (branchLabel && typeof branchLabel === 'string' && branchLabel.includes(' - ')) {
		branchLabel = branchLabel.split(' - ').slice(1).join(' - ').trim() || branchLabel;
	}
	return `<span class="badge bg-secondary">${branchLabel}</span>`;
}

function bindGlobalEvents() {
	$(document).on('show.bs.modal', '.modal', function() {
		$('[data-bs-toggle="tooltip"]').tooltip('hide');
		$('.tooltip').remove();
	});

	$(document).on('shown.bs.modal', '.modal', function() {
		$('.tooltip').remove();
	});
}

function bindFilterControls() {
	var statusColumnIndex = 2;

	$('#filter_status').on('change', function() {
		var status = $(this).val();
		if (manageTableDataTable) {
			manageTableDataTable.column(statusColumnIndex).search(status, false, false).draw();
		}
	});

	$('#search_input').on('keyup', function() {
		var query = $(this).val();
		if (manageTableDataTable) {
			manageTableDataTable.search(query).draw();
		}
	});
}

function bindFormSubmissions() {
	$('#edit_restaurant_table').submit(function (event) {
		event.preventDefault();
		if (requireBranchSelection('Please select a specific branch in the top bar before updating a table.')) {
			return;
		}

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

	$('#add_new_restaurant_table').submit(function (event) {
		event.preventDefault();
		if (requireBranchSelection('Please select a specific branch in the top bar before creating a table.')) {
			return;
		}

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
}

// ============================================
// GLOBAL FUNCTIONS
// ============================================

// Reload restaurant table data
function reloadRestaurantTableData() {
	if (manageTableDataTable) {
		manageTableDataTable.ajax.reload(null, false);
	}
}
// Open new restaurant table modal
function add_restaurant_table_modal() {
	if (requireBranchSelection('Please select a specific branch in the top bar before adding a table.')) {
		return;
	}
	// Hide all tooltips before opening modal
	$('[data-bs-toggle="tooltip"]').tooltip('hide');
	$('.tooltip').remove();
	
	$('#modal-new_restaurant_table').modal('show');
}

// Open edit restaurant table modal with data
function edit_restaurant_table(id, tableNumber, capacity, status) {
	if (requireBranchSelection('Please select a specific branch in the top bar before editing a table.')) {
		return;
	}
	// Hide all tooltips before opening modal
	$('[data-bs-toggle="tooltip"]').tooltip('hide');
	$('.tooltip').remove();
	
	restaurant_table_id = id;
	$('#edit_restaurant_table_id').val(id);
	$('#edit_table_number').val(tableNumber || '');
	$('#edit_capacity').val(capacity || 0);
	$('#edit_status').val(status || 1);
	$('#modal-edit_restaurant_table').modal('show');
}

// Delete restaurant table with confirmation
function delete_restaurant_table(id) {
	if (requireBranchSelection('Please select a specific branch in the top bar before deleting a table.')) {
		return;
	}
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

// View transaction history for a table
function view_transaction_history(tableId, tableNumber) {
	if (requireBranchSelection('Please select a specific branch in the top bar before viewing transactions.')) {
		return;
	}
	// Hide all tooltips before opening modal to prevent overlap
	$('[data-bs-toggle="tooltip"]').tooltip('hide');
	$('.tooltip').remove(); // Remove any lingering tooltip elements
	
	// Set table number in modal header
	$('#transaction_history_table_number').text(tableNumber || 'N/A');
	
	// Show modal - tooltips will be hidden by global event listener
	$('#modal-transaction_history').modal('show');
	
	// Additional cleanup after a short delay to ensure tooltips are gone
	setTimeout(function() {
		$('.tooltip').remove();
	}, 100);
	
	// Show loading state
	$('#transaction_history_loading').show();
	$('#transaction_history_empty').hide();
	$('#transaction_history_content').hide();
	
	// Fetch transaction history
	$.ajax({
		url: '/restaurant_table/' + tableId + '/transactions',
		method: 'GET',
		success: function (transactions) {
			$('#transaction_history_loading').hide();
			
			if (!transactions || transactions.length === 0) {
				$('#transaction_history_empty').show();
				return;
			}
			
			// Display transactions
			$('#transaction_history_content').show();
			var tbody = $('#transaction_history_tbody');
			tbody.empty();
			
			// Order status mapping
			var orderStatuses = {
				3: '<span class="badge bg-warning">Pending</span>',
				2: '<span class="badge bg-info">Confirmed</span>',
				1: '<span class="badge bg-success">Settled</span>',
				'-1': '<span class="badge bg-danger">Cancelled</span>'
			};
			
			// Order type mapping
			var orderTypes = {
				'DINE_IN': '<span class="badge bg-primary">Dine In</span>',
				'TAKE_OUT': '<span class="badge bg-secondary">Take Out</span>',
				'DELIVERY': '<span class="badge bg-info">Delivery</span>'
			};
			
			// Calculate totals
			var totalSubtotal = 0;
			var totalTax = 0;
			var totalService = 0;
			var totalDiscount = 0;
			var totalGrandTotal = 0;
			
			transactions.forEach(function (transaction) {
				// Format date
				var dateStr = 'N/A';
				if (transaction.ENCODED_DT) {
					var date = new Date(transaction.ENCODED_DT);
					dateStr = date.toLocaleDateString('en-US', {
						year: 'numeric',
						month: 'short',
						day: 'numeric',
						hour: '2-digit',
						minute: '2-digit'
					});
				}
				
				// Format amounts
				var subtotal = parseFloat(transaction.SUBTOTAL || 0);
				var tax = parseFloat(transaction.TAX_AMOUNT || 0);
				var service = parseFloat(transaction.SERVICE_CHARGE || 0);
				var discount = parseFloat(transaction.DISCOUNT_AMOUNT || 0);
				var grandTotal = parseFloat(transaction.GRAND_TOTAL || 0);
				
				// Add to totals
				totalSubtotal += subtotal;
				totalTax += tax;
				totalService += service;
				totalDiscount += discount;
				totalGrandTotal += grandTotal;
				
				// Get status badge
				var statusBadge = orderStatuses[transaction.STATUS] || '<span class="badge bg-secondary">Unknown</span>';
				
				// Get order type badge
				var orderTypeBadge = orderTypes[transaction.ORDER_TYPE] || transaction.ORDER_TYPE || 'N/A';
				
				// Get created by username
				var createdBy = transaction.ENCODED_BY_USERNAME || 'N/A';
				
				var row = `
					<tr>
						<td><strong>${transaction.ORDER_NO || 'N/A'}</strong></td>
						<td>${orderTypeBadge}</td>
						<td>${statusBadge}</td>
						<td>₱${subtotal.toFixed(2)}</td>
						<td>₱${tax.toFixed(2)}</td>
						<td>₱${service.toFixed(2)}</td>
						<td>₱${discount.toFixed(2)}</td>
						<td><strong>₱${grandTotal.toFixed(2)}</strong></td>
						<td>${dateStr}</td>
						<td>${createdBy}</td>
					</tr>
				`;
				
				tbody.append(row);
			});
			
			// Update totals in footer
			$('#total_subtotal').text('₱' + totalSubtotal.toFixed(2));
			$('#total_tax').text('₱' + totalTax.toFixed(2));
			$('#total_service').text('₱' + totalService.toFixed(2));
			$('#total_discount').text('₱' + totalDiscount.toFixed(2));
			$('#total_grand_total').text('₱' + totalGrandTotal.toFixed(2));
		},
		error: function (xhr, status, error) {
			console.error('Error fetching transaction history:', error);
			$('#transaction_history_loading').hide();
			Swal.fire({
				icon: "error",
				title: "Error",
				text: "Failed to load transaction history. Please try again.",
			});
		}
	});
}

