// ============================================
// MENU MANAGEMENT JAVASCRIPT
// ============================================
// File: public/assets/js/functions/manageMenu.js
// Description: Client-side logic for menu management
// Features: DataTables, AJAX, Form handling
// ============================================

var menu_id;
var dataTable;
var allMenuData = []; // Store all menu data for filtering

// Load translations from data attributes
var manageMenuTranslations = {};
$(document).ready(function () {
	// Load translations from data attributes
	var $transEl = $('#manageMenuTranslations');
	if ($transEl.length) {
		manageMenuTranslations = {
			available: $transEl.data('available') || 'Available',
			not_available: $transEl.data('not-available') || 'Not Available',
			all: $transEl.data('all') || 'All',
			all_categories: $transEl.data('all-categories') || 'All Categories',
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
		var $filterAvailability = $('#filter_availability');
		if ($filterAvailability.length) {
			$filterAvailability.html(`
				<option value="">${manageMenuTranslations.all}</option>
				<option value="1">${manageMenuTranslations.available}</option>
				<option value="0">${manageMenuTranslations.not_available}</option>
			`);
		}
	}
	if ($.fn.DataTable.isDataTable('#menuTable')) {
		$('#menuTable').DataTable().destroy();
	}

	// Get pagination translations
	const paginationTrans = manageMenuTranslations.pagination || {};
	const showingText = paginationTrans.showing || 'Showing';
	const toText = paginationTrans.to || 'to';
	const ofText = paginationTrans.of || 'of';
	const entriesText = paginationTrans.entries || 'entries';
	const searchText = paginationTrans.search || 'Search';

	dataTable = $('#menuTable').DataTable({
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

	// Load categories for dropdown
	loadCategories();

	// Initial load
	reloadMenuData();

	// Filter event listeners
	$('#filter_category').on('change', applyFilters);
	$('#filter_availability').on('change', applyFilters);

	// Handle image preview positioning on hover
	$(document).on('mouseenter', '.menu-image-container', function(e) {
		var $preview = $(this).find('.menu-image-preview');
		if ($preview.length === 0) return;
		
		var $container = $(this);
		var containerOffset = $container.offset();
		var previewWidth = 350;
		var previewHeight = 350;
		var windowWidth = $(window).width();
		var windowHeight = $(window).height();
		var scrollTop = $(window).scrollTop();
		
		// Calculate position relative to viewport
		var containerTop = containerOffset.top - scrollTop;
		var containerLeft = containerOffset.left;
		
		// Default: show to the right
		var leftPos = containerLeft + 60;
		var topPos = containerTop;
		
		// Check if preview would go off screen on the right
		if (leftPos + previewWidth > windowWidth) {
			// Show on the left side instead
			leftPos = containerLeft - previewWidth - 10;
		}
		
		// Check if preview would go off screen on the bottom
		if (containerTop + previewHeight > windowHeight) {
			// Adjust to show above or align with top
			topPos = Math.max(10, windowHeight - previewHeight - 10);
		}
		
		// Check if preview would go off screen on the top
		if (topPos < 10) {
			topPos = 10;
		}
		
		// Check if preview would go off screen on the left
		if (leftPos < 10) {
			leftPos = 10;
		}
		
		// Clear any previous timeout
		if ($preview.data('hide-timeout')) {
			clearTimeout($preview.data('hide-timeout'));
			$preview.removeData('hide-timeout');
		}
		
		// Set position and show preview
		$preview.css({
			'left': leftPos + 'px',
			'top': topPos + 'px',
			'display': 'block',
			'opacity': '1',
			'visibility': 'visible'
		}).addClass('show');
	});
	
	// Hide preview when mouse leaves
	$(document).on('mouseleave', '.menu-image-container', function() {
		var $preview = $(this).find('.menu-image-preview');
		if ($preview.length === 0) return;
		
		$preview.removeClass('show');
		
		// Hide after animation completes
		var timeoutId = setTimeout(function() {
			$preview.css({
				'display': 'none',
				'opacity': '0',
				'visibility': 'hidden'
			});
		}, 200);
		
		$preview.data('hide-timeout', timeoutId);
	});

	// Load categories for dropdown
	function loadCategories() {
		$.ajax({
			url: '/categories',
			method: 'GET',
			success: function (data) {
				var options = '<option></option>';
				var filterOptions = `<option value="">${manageMenuTranslations.all_categories || 'All Categories'}</option>`;
				data.forEach(function (category) {
					options += `<option value="${category.IDNo}">${category.CATEGORY_NAME}</option>`;
					filterOptions += `<option value="${category.IDNo}">${category.CATEGORY_NAME}</option>`;
				});
				$('#category_id').html(options);
				$('#edit_category_id').html(options);
				$('#filter_category').html(filterOptions);
			},
			error: function (xhr, status, error) {
				console.error('Error fetching categories:', error);
				// Silent error for dropdown loading - don't show alert
			}
		});
	}

	// Edit menu form submit
	$('#edit_menu').submit(function (event) {
		event.preventDefault();

		var formData = new FormData(this);
		
		$.ajax({
			url: '/menu/' + menu_id,
			type: 'PUT',
			data: formData,
			processData: false,
			contentType: false,
			success: function (response) {
				Swal.fire({
					icon: "success",
					title: "Success!",
					text: "Menu updated successfully",
				});
				reloadMenuData();
				$('#modal-edit_menu').modal('hide');
				$('#preview_edit').hide();
			},
			error: function (xhr, status, error) {
				console.error('Error updating menu:', error);
				var errorMsg = 'Failed to update menu';
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

	// Add new menu form submit
	$('#add_new_menu').submit(function (event) {
		event.preventDefault();

		var formData = new FormData(this);
		
		$.ajax({
			url: '/menu',
			type: 'POST',
			data: formData,
			processData: false,
			contentType: false,
			success: function (response) {
				Swal.fire({
					icon: "success",
					title: "Success!",
					text: "Menu created successfully",
				});
				reloadMenuData();
				$('#modal-new_menu').modal('hide');
				$('#add_new_menu')[0].reset();
				$('#preview_new').hide();
			},
			error: function (xhr, status, error) {
				console.error('Error creating menu:', error);
				var errorMsg = 'Failed to create menu';
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

// Reload menu data in DataTable
function reloadMenuData() {
	$.ajax({
		url: '/menus',
		method: 'GET',
		success: function (data) {
			allMenuData = data; // Store all data for filtering
			applyFilters(); // Apply current filters
		},
		error: function (xhr, status, error) {
			console.error('Error fetching menus:', error);
			Swal.fire({
				icon: "error",
				title: "Error!",
				text: "Failed to load menus. Please refresh the page.",
			});
		}
	});
}

// Apply filters to menu data
function applyFilters() {
	var categoryFilter = $('#filter_category').val();
	var availabilityFilter = $('#filter_availability').val();

	var filteredData = allMenuData.filter(function(row) {
		// Category filter
		if (categoryFilter && row.CATEGORY_ID != categoryFilter) {
			return false;
		}

		// Availability filter
		if (availabilityFilter !== '' && parseInt(row.IS_AVAILABLE) != parseInt(availabilityFilter)) {
			return false;
		}

		return true;
	});

	// Clear and repopulate table
	dataTable.clear();
	filteredData.forEach(function (row) {
		var image = '';
		if (row.MENU_IMG) {
			// Escape image URL for HTML
			var imgUrl = (row.MENU_IMG || '').replace(/"/g, '&quot;');
			var menuName = (row.MENU_NAME || '').replace(/"/g, '&quot;');
			image = `<div class="menu-image-container">
				<img src="${imgUrl}" alt="${menuName}" class="menu-thumbnail" data-full-image="${imgUrl}">
				<div class="menu-image-preview">
					<img src="${imgUrl}" alt="${menuName}">
				</div>
			</div>`;
		} else {
			image = '<span class="text-muted">No Image</span>';
		}

		var available = '';
		if (row.IS_AVAILABLE == 1) {
			available = `<span class="css-blue">${manageMenuTranslations.available || 'Available'}</span>`;
		} else {
			available = `<span class="css-red">${manageMenuTranslations.not_available || 'Not Available'}</span>`;
		}

		var price = parseFloat(row.MENU_PRICE || 0).toFixed(2);
		var description = row.MENU_DESCRIPTION || '';
		if (description.length > 50) {
			description = description.substring(0, 50) + '...';
		}

		// Escape single quotes for JavaScript
		var menuName = (row.MENU_NAME || '').replace(/'/g, "\\'");
		var menuDesc = (row.MENU_DESCRIPTION || '').replace(/'/g, "\\'");
		var menuImg = (row.MENU_IMG || '').replace(/'/g, "\\'");
		
		var btn = `<div class="btn-group">
			<button type="button" class="btn btn-sm bg-danger-subtle js-bs-tooltip-enabled" onclick="delete_menu(${row.IDNo})"
				data-bs-toggle="tooltip" aria-label="Delete" data-bs-original-title="Delete">
				<i class="fa fa-trash"></i>
			</button>
			<button type="button" class="btn btn-sm bg-info-subtle js-bs-tooltip-enabled" onclick="edit_menu(${row.IDNo}, '${menuName}', '${menuDesc}', '${menuImg}', ${row.MENU_PRICE || 0}, ${row.IS_AVAILABLE}, ${row.CATEGORY_ID || 'null'})"
				data-bs-toggle="tooltip" aria-label="Edit" data-bs-original-title="Edit">
				<i class="fa fa-pencil-alt"></i>
			</button>
		</div>`;

		dataTable.row.add([
			image,
			row.MENU_NAME,
			row.CATEGORY_NAME || 'No Category',
			description,
			'₱' + price,
			available,
			btn
		]).draw();
	});
}

// Open new menu modal
function add_menu_modal() {
	$('#modal-new_menu').modal('show');
}

// Open edit menu modal with data
function edit_menu(id, name, description, img, price, isAvailable, categoryId) {
	menu_id = id;
	$('#edit_menu_id').val(id);
	$('#edit_menu_name').val(name || '');
	$('#edit_menu_description').val(description || '');
	$('#edit_menu_img').val(img || ''); // Store existing image URL in hidden field
	$('#edit_menu_price').val(price || 0);
	$('#edit_is_available').val(isAvailable || 0);
	
	// Show current image if exists
	if (img && img.trim() !== '') {
		$('#current_img_edit').attr('src', img);
		$('#current_image_edit').show();
	} else {
		$('#current_image_edit').hide();
	}
	
	// Reset file input and preview
	$('#edit_menu_img_file').val('');
	$('#preview_edit').hide();
	
	if (categoryId && categoryId !== 'null') {
		$('#edit_category_id').val(categoryId).trigger('change');
	} else {
		$('#edit_category_id').val(null).trigger('change');
	}
	
	$('#modal-edit_menu').modal('show');
}

// Preview image before upload
function previewImage(input, previewId) {
	if (input.files && input.files[0]) {
		var reader = new FileReader();
		reader.onload = function(e) {
			$('#' + previewId).show();
			$('#preview_img_' + previewId.split('_')[1]).attr('src', e.target.result);
		};
		reader.readAsDataURL(input.files[0]);
	} else {
		$('#' + previewId).hide();
	}
}

// Delete menu with confirmation
function delete_menu(id) {
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
				url: '/menu/' + id,
				type: 'DELETE',
				success: function (response) {
					Swal.fire({
						icon: "success",
						title: "Deleted!",
						text: "Menu has been deleted",
					});
					reloadMenuData();
				},
				error: function (xhr, status, error) {
					console.error('Error deleting menu:', error);
					var errorMsg = 'Failed to delete menu';
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

