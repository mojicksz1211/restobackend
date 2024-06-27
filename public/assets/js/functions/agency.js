var agency_id;

$(document).ready(function () {
	if ($.fn.DataTable.isDataTable('#agency-tbl')) {
		$('#agency-tbl').DataTable().destroy();
	}

	var dataTable = $('#agency-tbl').DataTable({
		columnDefs: [{
			createdCell: function (cell, cellData, rowData, rowIndex, colIndex) {
				$(cell).addClass('text-center');
			}
		}]
	});

	function reloadData() {
		$.ajax({
			url: '/agency_data',
			method: 'GET',
			success: function (data) {
				dataTable.clear();
				data.forEach(function (row) {

					var status = '';
					if (row.ACTIVE.data[0] == 1) {
						status = '<span class="badge bg-info" style="font-size:10px !important;">ACTIVE</span>';
					} else {
						status = '<span class="badge bg-danger" style="font-size:10px !important;">INACTIVE</span>';
					}

					var btn = `<div class="btn-group">
            <button type="button" onclick="edit_agency(${row.IDNo}, '${row.AGENCY}')" class="btn btn-sm btn-alt-secondary js-bs-tooltip-enabled"
              data-bs-toggle="tooltip" aria-label="Edit" data-bs-original-title="Edit"  style="font-size:10px !important;">
              <i class="fa fa-pencil-alt"></i>
            </button>
            <button type="button" onclick="archive_agency(${row.IDNo})" class="btn btn-sm btn-alt-danger js-bs-tooltip-enabled"
              data-bs-toggle="tooltip" aria-label="Archive" data-bs-original-title="Archive"  style="font-size:10px !important;">
              <i class="fa fa-trash-alt"></i>
            </button>
          </div>`;

					dataTable.row.add([row.AGENCY, status, btn]).draw();
				});
			},
			error: function (xhr, status, error) {
				console.error('Error fetching data:', error);
			}
		});
	}

	reloadData();


	$('#edit_agency').submit(function (event) {
		event.preventDefault();

		var formData = $(this).serialize();
		$.ajax({
			url: '/agency/' + agency_id,
			type: 'PUT',
			data: formData,
			success: function (response) {
				reloadData();
				$('#modal-edit-agency').modal('hide');
			},
			error: function (error) {
				console.error('Error updating agency:', error);
			}
		});
	});

});

function edit_agency(id, agency) {
	$('#modal-edit-agency').modal('show');
	$('#agency').val(agency);
	agency_id = id;
}

function archive_agency(id) {
	Swal.fire({
		title: 'Are you sure you want to delete this?',
		icon: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#3085d6',
		cancelButtonColor: '#d33',
		confirmButtonText: 'Yes'
	}).then((result) => {
		if (result.isConfirmed) {
			$.ajax({
				url: '/agency/remove/' + id,
				type: 'PUT',
				success: function (response) {
					window.location.reload();
				},
				error: function (error) {
					console.error('Error deleting user role:', error);
				}
			});
		}
	})
}