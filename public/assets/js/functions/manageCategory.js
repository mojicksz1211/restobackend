// ============================================
// CATEGORY MANAGEMENT JAVASCRIPT
// ============================================
// File: public/assets/js/functions/manageCategory.js
// Description: Client-side logic for category management
// Features: DataTables, AJAX, Form handling
// ============================================

var category_id;
var categoryDataTable;
var keepManageCategoriesModalOpen = false;
var manageCategoryTranslations = {};

// Helper function for error handling
function showError(xhr, defaultMsg) {
	var errorMsg = defaultMsg;
	if (xhr.responseJSON && xhr.responseJSON.error) {
		errorMsg = xhr.responseJSON.error;
	}
	Swal.fire({
		icon: "error",
		title: manageCategoryTranslations.error || 'Error!',
		text: errorMsg,
	});
}

$(document).ready(function () {
	var $transEl = $('#manageCategoryTranslations');
	if ($transEl.length) {
		manageCategoryTranslations = {
			success: $transEl.data('success') || 'Success!',
			error: $transEl.data('error') || 'Error!',
			category_created_successfully: $transEl.data('category-created-successfully') || 'Category created successfully',
			category_updated_successfully: $transEl.data('category-updated-successfully') || 'Category updated successfully',
			category_deleted_successfully: $transEl.data('category-deleted-successfully') || 'Category has been deleted',
			failed_to_create_category: $transEl.data('failed-to-create-category') || 'Failed to create category',
			failed_to_update_category: $transEl.data('failed-to-update-category') || 'Failed to update category',
			failed_to_delete_category: $transEl.data('failed-to-delete-category') || 'Failed to delete category',
			failed_to_load_categories: $transEl.data('failed-to-load-categories') || 'Failed to load categories. Please refresh the page.',
			delete_confirmation_title: $transEl.data('delete-confirmation-title') || 'Are you sure?',
			delete_confirmation_text: $transEl.data('delete-confirmation-text') || "You won't be able to revert this!",
			delete_confirm_button: $transEl.data('delete-confirm-button') || 'Yes, delete it!',
			no_description: $transEl.data('no-description') || 'No description'
		};
	}

	// Initialize category DataTable when modal opens
	$('#modal-manage-categories').on('shown.bs.modal', function () {
		if ($('#categoryTable').length) {
			if ($.fn.DataTable.isDataTable('#categoryTable')) {
				$('#categoryTable').DataTable().destroy();
				categoryDataTable = null;
			}

			categoryDataTable = $('#categoryTable').DataTable({
				columnDefs: [
					{ targets: [0, 1, 2], className: 'text-left' },
					{ targets: [3], className: 'text-center' }
				],
				order: [[0, 'asc']],
				pageLength: 10
			});
			
			reloadCategoryData();
		}
	});

	// Prevent manage categories modal from closing when child modals are open
	$('#modal-manage-categories').on('hide.bs.modal', function (e) {
		if ($('#modal-new_category').hasClass('show') || $('#modal-edit_category').hasClass('show')) {
			e.preventDefault();
			e.stopImmediatePropagation();
			return false;
		}
	});
	
	// When child modals close, ensure manage categories modal stays open
	$('#modal-new_category, #modal-edit_category').on('hidden.bs.modal', function () {
		setTimeout(function() {
			if (keepManageCategoriesModalOpen) {
				$('#modal-manage-categories').addClass('show').css({
					'display': 'block',
					'padding-right': '0px'
				});
				$('body').addClass('modal-open');
				
				if ($('.modal-backdrop').length === 0) {
					$('body').append('<div class="modal-backdrop fade show"></div>');
				}
				
				reloadCategoryData();
			}
		}, 200);
	});

	// Edit category form submit
	$(document).on('submit', '#edit_category', function (event) {
		event.preventDefault();
		var $form = $(this);
		
		$.ajax({
			url: '/category/' + category_id,
			type: 'PUT',
			data: $form.serialize(),
			success: function (response) {
				Swal.fire({
					icon: "success",
					title: manageCategoryTranslations.success,
					text: manageCategoryTranslations.category_updated_successfully,
				});
				$form[0].reset();
				$('#modal-edit_category').modal('hide');
				reloadCategoryData();
			},
			error: function (xhr, status, error) {
				console.error('Error updating category:', error);
				showError(xhr, manageCategoryTranslations.failed_to_update_category);
			}
		});
	});

	// Add new category form submit
	$(document).on('submit', '#add_new_category', function (event) {
		event.preventDefault();
		var $form = $(this);
		
		$.ajax({
			url: '/category',
			type: 'POST',
			data: $form.serialize(),
			success: function (response) {
				Swal.fire({
					icon: "success",
					title: manageCategoryTranslations.success,
					text: manageCategoryTranslations.category_created_successfully,
				});
				$form[0].reset();
				$('#modal-new_category').modal('hide');
				reloadCategoryData();
			},
			error: function (xhr, status, error) {
				console.error('Error creating category:', error);
				showError(xhr, manageCategoryTranslations.failed_to_create_category);
			}
		});
	});
});

// ============================================
// CATEGORY MANAGEMENT MODAL FUNCTIONS
// ============================================

// Show manage categories modal
function showManageCategoriesModal() {
	keepManageCategoriesModalOpen = true;
	$('#modal-manage-categories').modal('show');
}

// Open new category modal without closing manage categories modal
function openNewCategoryModal() {
	keepManageCategoriesModalOpen = true;
	$('#modal-new_category').modal('show');
}

// Open new category modal (standalone - for backward compatibility)
function add_category_modal() {
	$('#modal-new_category').modal('show');
}

// Allow user to close manage categories modal when clicking close button
$(document).on('click', '#modal-manage-categories .btn-close, #modal-manage-categories button[data-bs-dismiss="modal"]', function() {
	keepManageCategoriesModalOpen = false;
});

// Reload category data in DataTable
function reloadCategoryData() {
	if (!categoryDataTable) {
		return;
	}
	
	// Get current language from cookie or default to 'en'
	var currentLang = document.cookie.split('; ').find(row => row.startsWith('lang='));
	currentLang = currentLang ? currentLang.split('=')[1] : 'en';
	
	$.ajax({
		url: '/categories_list',
		method: 'GET',
		data: {
			lang: currentLang
		},
		success: function (data) {
			categoryDataTable.clear();
			
			if (!data || data.length === 0) {
				categoryDataTable.draw();
				return;
			}
			
			var rows = [];
			var noDesc = manageCategoryTranslations.no_description || 'No description';
			
			data.forEach(function (row) {
				var dateCreated = row.ENCODED_DT 
					? new Date(row.ENCODED_DT).toLocaleDateString('en-US', { 
						year: 'numeric', month: 'short', day: 'numeric',
						hour: '2-digit', minute: '2-digit'
					})
					: 'N/A';

				var description = row.CAT_DESC || '';
				if (description.length > 50) {
					description = description.substring(0, 50) + '...';
				}
				if (!description) {
					description = '<span class="text-muted">' + noDesc + '</span>';
				}

				var categoryName = (row.CAT_NAME || '').replace(/'/g, "\\'");
				var categoryDesc = (row.CAT_DESC || '').replace(/'/g, "\\'");
				
				var btn = `<div class="btn-group">
					<button type="button" class="btn btn-sm bg-danger-subtle js-bs-tooltip-enabled" onclick="delete_category(${row.IDNo})"
						data-bs-toggle="tooltip" aria-label="Delete" data-bs-original-title="Delete">
						<i class="fa fa-trash"></i>
					</button>
					<button type="button" class="btn btn-sm bg-info-subtle js-bs-tooltip-enabled" onclick="edit_category(${row.IDNo}, '${categoryName}', '${categoryDesc}')"
						data-bs-toggle="tooltip" aria-label="Edit" data-bs-original-title="Edit">
						<i class="fa fa-pencil-alt"></i>
					</button>
				</div>`;

				rows.push([row.CAT_NAME || '', description, dateCreated, btn]);
			});
			
			categoryDataTable.rows.add(rows).draw();
		},
		error: function (xhr, status, error) {
			console.error('Error fetching categories:', error);
			Swal.fire({
				icon: "error",
				title: manageCategoryTranslations.error,
				text: manageCategoryTranslations.failed_to_load_categories,
			});
		}
	});
}

// Open edit category modal with data
function edit_category(id, name, description) {
	category_id = id;
	$('#edit_category_id').val(id);
	$('#edit_category_name').val(name || '');
	$('#edit_category_desc').val(description || '');
	$('#modal-edit_category').modal('show');
}

// Delete category with confirmation
function delete_category(id) {
	Swal.fire({
		title: manageCategoryTranslations.delete_confirmation_title || 'Are you sure?',
		text: manageCategoryTranslations.delete_confirmation_text || "You won't be able to revert this!",
		icon: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#3085d6',
		cancelButtonColor: '#d33',
		confirmButtonText: manageCategoryTranslations.delete_confirm_button || 'Yes, delete it!'
	}).then((result) => {
		if (result.isConfirmed) {
			$.ajax({
				url: '/category/' + id,
				type: 'DELETE',
				success: function (response) {
					Swal.fire({
						icon: "success",
						title: manageCategoryTranslations.success,
						text: manageCategoryTranslations.category_deleted_successfully,
					});
					reloadCategoryData();
				},
				error: function (xhr, status, error) {
					console.error('Error deleting category:', error);
					showError(xhr, manageCategoryTranslations.failed_to_delete_category);
				}
			});
		}
	});
}

// Expose functions globally for onclick handlers
window.showManageCategoriesModal = showManageCategoriesModal;
window.openNewCategoryModal = openNewCategoryModal;
window.add_category_modal = add_category_modal;
window.edit_category = edit_category;
window.delete_category = delete_category;

