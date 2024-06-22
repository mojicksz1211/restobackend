var account_id;
var record_id;
var game_id;

$(document).ready(function () {
	if ($.fn.DataTable.isDataTable('#game_list-tbl')) {
		$('#game_list-tbl').DataTable().destroy();
	}

	var dataTable = $('#game_list-tbl').DataTable({
		columnDefs: [{
			createdCell: function (cell, cellData, rowData, rowIndex, colIndex) {
				$(cell).addClass('text-center');
			}
		}]
	});

	function reloadData() {

		$.ajax({
			url: '/game_list_data', // Endpoint to fetch data
			method: 'GET',
			success: function (data) {
				dataTable.clear();
				data.forEach(function (row) {

					var status = '';
					if (row.game_status == 2) {
						status = '<span class="badge bg-info">ON GAME</span>';
					} else if (row.game_status == 3) {
						status = '<span class="badge bg-primary" style="font-size: 15px;">FINISH</span>';
					} else {
						status = '<span class="badge bg-success" style="font-size: 15px;">SETTLED</span>';
					}

					var btn = `<div class="btn-group">
            <button type="button" onclick="viewRecord(${row.game_list_id})" class="btn btn-sm btn-alt-info js-bs-tooltip-enabled"
              data-bs-toggle="tooltip" aria-label="Details" data-bs-original-title="Details">
              GAME RECORD
            </button>
            <button type="button" onclick="changeStatus(${row.game_list_id})" class="btn btn-sm btn-alt-warning js-bs-tooltip-enabled"
              data-bs-toggle="tooltip" aria-label="Details" data-bs-original-title="Status">
              CHANGE STATUS
            </button>
            <button type="button" onclick="archive_game_list(${row.game_list_id})" class="btn btn-sm btn-alt-danger js-bs-tooltip-enabled"
              data-bs-toggle="tooltip" aria-label="Archive" data-bs-original-title="Archive">
              <i class="fa fa-trash-alt"></i>
            </button>
          </div>`;

					var ref = '';
					var acct_code = '';

					if (row.GUESTNo) {
						ref = `${row.CODE}-${row.AGENT_CODE}-${row.GUESTNo}-${row.GAME_NO}`;
						acct_code = `${row.CODE}-${row.AGENT_CODE}-${row.GUESTNo}`;
					} else {
						ref = `${row.CODE}-${row.AGENT_CODE}-${row.GAME_NO}`;
						acct_code = `${row.CODE}-${row.AGENT_CODE}`;
					}

					var dateFormat = moment(row.GAME_DATE).format('MMMM DD, YYYY');

					$.ajax({
						url: '/game_list/' + row.game_list_id + '/record',
						method: 'GET',
						success: function (response) {
							var total_buy_in = 0;
							var total_cash_out = 0;
							var total_rolling = 0;

							response.forEach(function (res) {
								if (res.CAGE_TYPE == 1) {
									total_buy_in = res.AMOUNT;
								}

								if (res.CAGE_TYPE == 2) {
									total_cash_out = res.AMOUNT;
								}

								if (res.CAGE_TYPE == 3) {
									total_rolling = res.AMOUNT;
								}
							});

							var gross = total_buy_in - total_cash_out;
							var net = (gross * .6) - (total_rolling * .015);


							dataTable.row.add([`${row.GAME_NO}`, row.game_list_id, parseFloat(total_buy_in).toLocaleString(), parseFloat(total_cash_out).toLocaleString(), parseFloat(total_rolling).toLocaleString(), parseFloat(gross).toLocaleString(), parseFloat(net).toLocaleString(), status, btn]).draw();
						},
						error: function (xhr, status, error) {
							console.error('Error fetching options:', error);
						}
					});

				});
			},
			error: function (xhr, status, error) {
				console.error('Error fetching data:', error);
			}
		});
	}

	function computation(id) {
		$.ajax({
			url: '/game_list/' + id + '/record',
			method: 'GET',
			success: function (response) {
				var arr = [];

				arr.push(response);
				return arr;
			},
			error: function (xhr, status, error) {
				console.error('Error fetching options:', error);
			}
		});
	}

	reloadData();

	$('#add_game_list').submit(function (event) {
		event.preventDefault();

		var formData = $(this).serialize();

		$.ajax({
			url: '/add_game_list',
			type: 'POST',
			data: formData,
			// processData: false, 
			// contentType: false,
			success: function (response) {
				reloadData();
				$('#modal-new-game-list').modal('hide');
			},
			error: function (xhr, status, error) {
				var errorMessage = xhr.responseJSON.error;
				// if(errorMessage == 'password') {
				//   Swal.fire({
				//     icon: "error",
				//     title: "Oops...",
				//     text: "Password not match!",
				//   });
				// } else {
				console.error('Error updating user role:', error);
				// }
			}
		});
	});


	$('#edit_status').submit(function (event) {
		event.preventDefault();

		var formData = $(this).serialize();
		$.ajax({
			url: '/game_list/change_status/' + game_id,
			type: 'PUT',
			data: formData,
			success: function (response) {
				reloadData();
				$('#modal-change_status').modal('hide');
			},
			error: function (error) {
				console.error('Error updating agent:', error);
			}
		});
	});
	// }

});

function addGameList(id) {
	$('#modal-new-game-list').modal('show');

	get_account();
}

function addBuyin() {
	$('#modal-add-buyin').modal('show');
}

function addRolling() {
	$('#modal-add-rolling').modal('show');
}

function showRollings() {
	$('#modal-show-rollings').modal('show');
}

function changeStatus(id) {
	$('#modal-change_status').modal('show');

	game_id = id;
}

function get_account() {
	$.ajax({
		url: '/account_data',
		method: 'GET',
		success: function (response) {
			var selectOptions = $('#txtTrans');
			selectOptions.empty();
			selectOptions.append($('<option>', {
				value: '',
				text: '--SELECT ACCOUNT--'
			}));
			response.forEach(function (option) {

				selectOptions.append($('<option>', {
					value: option.account_id,
					text: option.agent_name + ' (' + option.agent_code + ')'
				}));
			});
		},
		error: function (xhr, status, error) {
			console.error('Error fetching options:', error);
		}
	});
}



function archive_game_list(id) {
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
				url: '/game_list/remove/' + id,
				type: 'PUT',
				success: function (response) {
					window.location.reload();
				},
				error: function (error) {
					console.error('Error deleting game list:', error);
				}
			});
		}
	})
}

function viewRecord(id) {
	record_id = id;
	window.location.href = '/game_record/' + id;
}