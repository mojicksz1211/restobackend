// ============================================
// CATEGORY MANAGEMENT JAVASCRIPT
// ============================================
// File: public/assets/js/functions/manageCategory.js
// Description: Client-side logic for category management
// Features: DataTables, AJAX, Form handling
// ============================================

var category_id;
var dataTable;

$(document).ready(function () {
	if ($.fn.DataTable.isDataTable('#categoryTable')) {
		$('#categoryTable').DataTable().destroy();
	}

	dataTable = $('#categoryTable').DataTable({
		columnDefs: [{
			createdCell: function (cell, cellData, rowData, rowIndex, colIndex) {
				$(cell).addClass('text-center');
			}
		}]
	});

	// Initial load
	reloadCategoryData();

	// Edit category form submit
	$('#edit_category').submit(function (event) {
		event.preventDefault();

		var formData = $(this).serialize();
		$.ajax({
			url: '/category/' + category_id,
			type: 'PUT',
			data: formData,
			success: function (response) {
				Swal.fire({
					icon: "success",
					title: "Success!",
					text: "Category updated successfully",
				});
				reloadCategoryData();
				$('#modal-edit_category').modal('hide');
			},
			error: function (xhr, status, error) {
				console.error('Error updating category:', error);
				var errorMsg = 'Failed to update category';
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

	// Add new category form submit
	$('#add_new_category').submit(function (event) {
		event.preventDefault();

		var formData = $(this).serialize();
		$.ajax({
			url: '/category',
			type: 'POST',
			data: formData,
			success: function (response) {
				Swal.fire({
					icon: "success",
					title: "Success!",
					text: "Category created successfully",
				});
				reloadCategoryData();
				$('#modal-new_category').modal('hide');
				$('#add_new_category')[0].reset();
			},
			error: function (xhr, status, error) {
				console.error('Error creating category:', error);
				var errorMessage = 'Failed to create category';
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

// Reload category data in DataTable
function reloadCategoryData() {
	$.ajax({
		url: '/categories_list',
		method: 'GET',
		success: function (data) {
			dataTable.clear();
			if (!data || data.length === 0) {
				return;
			}
			data.forEach(function (row) {
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

				// Format description
				var description = row.CAT_DESC || '';
				if (description.length > 50) {
					description = description.substring(0, 50) + '...';
				}
				if (!description) {
					description = '<span class="text-muted">No description</span>';
				}

				// Escape single quotes for JavaScript
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

				dataTable.row.add([
					row.CAT_NAME,
					description,
					dateCreated,
					btn
				]).draw();
			});
		},
		error: function (xhr, status, error) {
			console.error('Error fetching categories:', error);
			Swal.fire({
				icon: "error",
				title: "Error!",
				text: "Failed to load categories. Please refresh the page.",
			});
		}
	});
}

// Open new category modal
function add_category_modal() {
	$('#modal-new_category').modal('show');
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
				url: '/category/' + id,
				type: 'DELETE',
				success: function (response) {
					Swal.fire({
						icon: "success",
						title: "Deleted!",
						text: "Category has been deleted",
					});
					reloadCategoryData();
				},
				error: function (xhr, status, error) {
					console.error('Error deleting category:', error);
					var errorMsg = 'Failed to delete category';
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


