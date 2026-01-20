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
var allTableData = [];
var filteredData = [];
var currentPage = 1;
var itemsPerPage = 10;
var searchQuery = '';

// Load translations from data attributes
var manageTableTranslations = {};

// Wait for DOM and jQuery
(function() {
	console.log('Setting up DOM ready handler...');
	
	// Check if jQuery is available
	function initManageTable() {
		if (typeof jQuery === 'undefined') {
			console.error('ERROR: jQuery is not loaded!');
			setTimeout(initManageTable, 100); // Retry after 100ms
			return;
		}
		
		console.log('✓ jQuery is loaded, version:', jQuery.fn.jquery);
		
		$(document).ready(function () {
			console.log('=== Document ready - initializing manageTable ===');
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

	// Initialize empty state
	console.log('Initializing UI elements');
	var $container = $('#tableCardsContainer');
	var $emptyState = $('#emptyState');
	
	console.log('Container found:', $container.length > 0);
	console.log('Empty state found:', $emptyState.length > 0);
	
	if ($container.length > 0) {
		$container.hide();
	} else {
		console.error('tableCardsContainer not found!');
	}
	
	if ($emptyState.length > 0) {
		$emptyState.show();
	} else {
		console.error('emptyState not found!');
	}

	// Initial load
	console.log('Calling reloadRestaurantTableData...');
	reloadRestaurantTableData();

	// Filter and search event listeners
	$('#filter_status').on('change', function() {
		currentPage = 1;
		applyFilters();
	});
	
	$('#search_input').on('keyup', function() {
		searchQuery = $(this).val().toLowerCase();
		currentPage = 1;
		applyFilters();
	});

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
		
		console.log('=== Document ready handler completed ===');
		});
	}
	
	// Start initialization
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initManageTable);
	} else {
		initManageTable();
	}
})();

// ============================================
// GLOBAL FUNCTIONS
// ============================================

// Reload restaurant table data
function reloadRestaurantTableData() {
	console.log('reloadRestaurantTableData called');
	console.log('Making AJAX request to /restaurant_tables');
	
	$.ajax({
		url: '/restaurant_tables',
		method: 'GET',
		success: function (data) {
			console.log('AJAX Success - Tables data received:', data);
			console.log('Data type:', typeof data);
			console.log('Is array?', Array.isArray(data));
			// Ensure data is an array
			allTableData = Array.isArray(data) ? data : [];
			console.log('All table data length:', allTableData.length);
			console.log('All table data:', allTableData);
			applyFilters();
		},
		error: function (xhr, status, error) {
			console.error('AJAX Error fetching restaurant tables:');
			console.error('Status:', status);
			console.error('Error:', error);
			console.error('Response status:', xhr.status);
			console.error('Response text:', xhr.responseText);
			allTableData = [];
			applyFilters();
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
	});
}

// Apply filters to restaurant table data
function applyFilters() {
	var statusFilter = $('#filter_status').val();

	console.log('Applying filters. Total data:', allTableData.length);
	console.log('Status filter:', statusFilter);
	console.log('Search query:', searchQuery);

	// Ensure allTableData is an array
	if (!Array.isArray(allTableData)) {
		console.error('allTableData is not an array:', allTableData);
		allTableData = [];
	}

	// Filter by status and search query
	filteredData = allTableData.filter(function(row) {
		// Status filter
		if (statusFilter !== '' && parseInt(row.STATUS) != parseInt(statusFilter)) {
			return false;
		}
		
		// Search filter
		if (searchQuery) {
			var tableNumber = (row.TABLE_NUMBER || '').toLowerCase();
			var capacity = (row.CAPACITY || '').toString().toLowerCase();
			if (!tableNumber.includes(searchQuery) && !capacity.includes(searchQuery)) {
				return false;
			}
		}
		
		return true;
	});

	console.log('Filtered data:', filteredData.length);

	// Render cards with pagination
	renderTableCards();
	renderPagination();
}

// Render table cards
function renderTableCards() {
	var container = $('#tableCardsContainer');
	container.empty();
	
	console.log('Rendering cards. Filtered data length:', filteredData.length);
	console.log('Current page:', currentPage);
	
	var startIndex = (currentPage - 1) * itemsPerPage;
	var endIndex = startIndex + itemsPerPage;
	var pageData = filteredData.slice(startIndex, endIndex);
	
	console.log('Page data length:', pageData.length);
	
	if (pageData.length === 0 && filteredData.length === 0) {
		console.log('No data to display, showing empty state');
		$('#emptyState').show();
		container.hide();
	} else {
		$('#emptyState').hide();
		container.show();
		
		pageData.forEach(function (row) {
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
			var statusText = '';
			switch(parseInt(row.STATUS)) {
				case 1:
					statusBadge = '<span class="badge bg-success">' + (manageTableTranslations.available || 'Available') + '</span>';
					statusText = manageTableTranslations.available || 'Available';
					break;
				case 2:
					statusBadge = '<span class="badge bg-warning">' + (manageTableTranslations.occupied || 'Occupied') + '</span>';
					statusText = manageTableTranslations.occupied || 'Occupied';
					break;
				case 4:
					statusBadge = '<span class="badge bg-info">' + (manageTableTranslations.reserved || 'Reserved') + '</span>';
					statusText = manageTableTranslations.reserved || 'Reserved';
					break;
				case 3:
					statusBadge = '<span class="badge bg-danger">' + (manageTableTranslations.not_available || 'Not Available') + '</span>';
					statusText = manageTableTranslations.not_available || 'Not Available';
					break;
				default:
					statusBadge = '<span class="badge bg-secondary">' + (manageTableTranslations.unknown || 'Unknown') + '</span>';
					statusText = manageTableTranslations.unknown || 'Unknown';
			}

			// Escape single quotes for JavaScript
			var tableNumber = (row.TABLE_NUMBER || '').replace(/'/g, "\\'");
			
			var cardHtml = `
				<div class="col-md-6 col-lg-4 col-xl-3">
					<div class="table-card">
						<div class="table-card-header">
							<span class="table-number-badge">Table ${row.TABLE_NUMBER || 'N/A'}</span>
							${statusBadge}
						</div>
						<div class="table-card-body">
							<div class="table-card-info">
								<div class="table-card-info-item">
									<span class="table-card-info-label"><i class="fa fa-users me-2"></i>Capacity: <span class="table-card-info-value">${row.CAPACITY || 0}</span></span>
								</div>
								<div class="table-card-info-item">
									<span class="table-card-info-label"><i class="fa fa-calendar me-2"></i>Date Created: <span class="table-card-info-value" style="font-size: 11px;">${dateCreated}</span></span>
								</div>
							</div>
						</div>
						<div class="table-card-actions">
							<button type="button" class="btn btn-sm btn-danger" onclick="delete_restaurant_table(${row.IDNo})"
								data-bs-toggle="tooltip" aria-label="Delete" data-bs-original-title="Delete">
								<i class="fa fa-trash"></i>
							</button>
							<button type="button" class="btn btn-sm btn-info" onclick="edit_restaurant_table(${row.IDNo}, '${tableNumber}', ${row.CAPACITY || 0}, ${row.STATUS || 1})"
								data-bs-toggle="tooltip" aria-label="Edit" data-bs-original-title="Edit">
								<i class="fa fa-pencil-alt"></i>
							</button>
						</div>
					</div>
				</div>
			`;
			
			container.append(cardHtml);
		});
		
		// Initialize tooltips
		$('[data-bs-toggle="tooltip"]').tooltip();
	}
}

// Render pagination controls
function renderPagination() {
	var totalPages = Math.ceil(filteredData.length / itemsPerPage);
	var paginationControls = $('#paginationControls');
	var paginationInfo = $('#paginationInfo');
	
	paginationControls.empty();
	
	if (totalPages === 0) {
		paginationInfo.text('');
		return;
	}
	
	var startItem = (currentPage - 1) * itemsPerPage + 1;
	var endItem = Math.min(currentPage * itemsPerPage, filteredData.length);
	var totalItems = filteredData.length;
	
	const paginationTrans = manageTableTranslations.pagination || {};
	const showingText = paginationTrans.showing || 'Showing';
	const toText = paginationTrans.to || 'to';
	const ofText = paginationTrans.of || 'of';
	const entriesText = paginationTrans.entries || 'entries';
	const previousText = paginationTrans.previous || 'Previous';
	const nextText = paginationTrans.next || 'Next';
	
	paginationInfo.text(`${showingText} ${startItem} ${toText} ${endItem} ${ofText} ${totalItems} ${entriesText}`);
	
	// Previous button
	var prevDisabled = currentPage === 1 ? 'disabled' : '';
	var prevHtml = `
		<li class="page-item ${prevDisabled}">
			<a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">${previousText}</a>
		</li>
	`;
	paginationControls.append(prevHtml);
	
	// Page number buttons
	var maxVisiblePages = 5;
	var startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
	var endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
	
	if (startPage > 1) {
		paginationControls.append(`<li class="page-item"><a class="page-link" href="#" onclick="changePage(1); return false;">1</a></li>`);
		if (startPage > 2) {
			paginationControls.append(`<li class="page-item disabled"><span class="page-link">...</span></li>`);
		}
	}
	
	for (var i = startPage; i <= endPage; i++) {
		var activeClass = i === currentPage ? 'active' : '';
		var pageHtml = `
			<li class="page-item ${activeClass}">
				<a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
			</li>
		`;
		paginationControls.append(pageHtml);
	}
	
	if (endPage < totalPages) {
		if (endPage < totalPages - 1) {
			paginationControls.append(`<li class="page-item disabled"><span class="page-link">...</span></li>`);
		}
		paginationControls.append(`<li class="page-item"><a class="page-link" href="#" onclick="changePage(${totalPages}); return false;">${totalPages}</a></li>`);
	}
	
	// Next button
	var nextDisabled = currentPage === totalPages ? 'disabled' : '';
	var nextHtml = `
		<li class="page-item ${nextDisabled}">
			<a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">${nextText}</a>
		</li>
	`;
	paginationControls.append(nextHtml);
}

// Change page function
function changePage(page) {
	var totalPages = Math.ceil(filteredData.length / itemsPerPage);
	if (page >= 1 && page <= totalPages) {
		currentPage = page;
		renderTableCards();
		renderPagination();
		// Scroll to top of cards container
		$('html, body').animate({
			scrollTop: $('#tableCardsContainer').offset().top - 100
		}, 300);
	}
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

