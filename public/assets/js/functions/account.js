var account_id;

$(document).ready(function () {
	if ($.fn.DataTable.isDataTable('#account-tbl')) {
		$('#account-tbl').DataTable().destroy();
	}

	var dataTable = $('#account-tbl').DataTable({
		columnDefs: [{
			createdCell: function (cell, cellData, rowData, rowIndex, colIndex) {
				$(cell).addClass('text-center');
			}
		}]
	});

	function reloadData() {
		$.ajax({
			url: '/account_data', // Endpoint to fetch data
			method: 'GET',
			success: function (data) {
				dataTable.clear();
				data.forEach(function (row) {

					var status = '';
					if (row.active.data == 1) {
						status = '<span class="badge bg-info" style="font-size:10px !important;">ACTIVE</span>';
					} else {
						status = '<span class="badge bg-danger style="font-size:10px !important;">INACTIVE</span>';
					}

					var btn = `
						<button type="button"  class="btn btn-sm btn-alt-info js-bs-tooltip-enabled"  style="font-size:10px !important;"
						onclick="account_details(${row.account_id}, '${row.agent_name}')"
						data-bs-toggle="tooltip" aria-label="Edit" data-bs-original-title="Details">
						Details
						</button>
						<button type="button" onclick="archive_account(${row.account_id})" class="btn btn-sm btn-alt-danger js-bs-tooltip-enabled"
						data-bs-toggle="tooltip" aria-label="Archive" data-bs-original-title="Archive"  style="font-size:10px !important;">
						<i class="fa fa-trash-alt"></i>
						</button>
					`;
					
					$.ajax({
						url: '/account_details_data/' + row.account_id, // Endpoint to fetch data
						method: 'GET',
						success: function (data_amount) {
							var deposit_amount = 0;
							var withdraw_amount = 0;

							data_amount.forEach(function (row1) {
								if (row1.TRANSACTION == 'DEPOSIT') {
									deposit_amount = deposit_amount + row1.AMOUNT;
								}
			
								if (row1.TRANSACTION == 'WITHDRAW') {
									withdraw_amount = withdraw_amount + row1.AMOUNT;
								}
							});

							var total = deposit_amount - withdraw_amount;

							dataTable.row.add([`${row.agency_name}`, row.agent_code, `${row.agent_name}`, `P${total.toLocaleString()}`,status, btn]).draw();
						}
					});
			

					
				});
			},
			error: function (xhr, status, error) {
				console.error('Error fetching data:', error);
			}
		});
	}

	reloadData();

	$('#add_new_account').submit(function (event) {
		event.preventDefault();

		var formData = $(this).serialize();

		$.ajax({
			url: '/add_account',
			type: 'POST',
			data: formData,
			// processData: false, 
			// contentType: false,
			success: function (response) {
				reloadData();
				$('#modal-new-account').modal('hide');
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
		// }
	});


	$('#edit_account').submit(function (event) {
		event.preventDefault();

		var formData = $(this).serialize();
		$.ajax({
			url: '/account/' + account_id,
			type: 'PUT',
			data: formData,
			success: function (response) {
				reloadData();
				$('#modal-edit-account').modal('hide');
			},
			error: function (error) {
				console.error('Error updating user role:', error);
			}
		});
	});



});

$(document).ready(function () {


	$('#add_new_account_details').submit(function (event) {
		event.preventDefault();

		var formData = $(this).serialize();

		$.ajax({
			url: '/add_account_details',
			type: 'POST',
			data: formData,
			success: function (response) {
				$('#modal-add-account-details').modal('hide');
				reloadDataDetails();
			},
			error: function (xhr, status, error) {
				var errorMessage = xhr.responseJSON.error;
				console.error('Error updating user role:', error);
			}
		});
	});

	$('#add_transfer_account').submit(function (event) {
		event.preventDefault();

		var formData = $(this).serialize();

		$.ajax({
			url: '/add_account_details/transfer',
			type: 'POST',
			data: formData,
			success: function (response) {
				$('#modal-transfer_account').modal('hide');
				reloadDataDetails();
			},
			error: function (xhr, status, error) {
				var errorMessage = xhr.responseJSON.error;
				console.error('Error updating user role:', error);
			}
		});
	});
});

function addAccount() {
	$('#modal-new-account').modal('show');
	get_agent();
}



function edit_account(id, agent_id, agent_name, agency_name, guest_no, membership_no) {
	$('#modal-edit-account').modal('show');
	$('#edit_agent_name').val(agent_name);
	$('#edit_agency_name').val(agency_name);
	$('#guest_no').val(guest_no);
	$('#membership_no').val(membership_no);

	edit_get_agent(agent_id);
	account_id = id;
}

function archive_account(id) {
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
				url: '/account/remove/' + id,
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

function get_agent() {
	$.ajax({
		url: '/agent_data',
		method: 'GET',
		success: function (response) {
			var selectOptions = $('#agent_id');
			selectOptions.empty();
			selectOptions.append($('<option>', {
				value: '',
				text: '--SELECT AGENT--'
			}));
			response.forEach(function (option) {
				selectOptions.append($('<option>', {
					value: option.agent_id,
					text: option.agency_code + '-' + option.agent_code
				}));
			});
		},
		error: function (xhr, status, error) {
			console.error('Error fetching options:', error);
		}
	});
}

function edit_get_agent(id) {
	$.ajax({
		url: '/agent_data',
		method: 'GET',
		success: function (response) {
			var selectOptions = $('.agent_id');
			selectOptions.empty();
			selectOptions.append($('<option>', {
				selected: false,
				value: '',
				text: '--SELECT AGENT--'
			}));
			response.forEach(function (option) {
				var selected = false;
				if (option.agent_id == id) {
					selected = true;
				}
				selectOptions.append($('<option>', {
					selected: selected,
					value: option.agent_id,
					text: option.agency_code + '-' + option.agent_code
				}));
			});
		},
		error: function (xhr, status, error) {
			console.error('Error fetching options:', error);
		}
	});
}

$('#agent_id').on('change', function () {
	var agent = $(this).val().split();

	get_agent_name(agent[0]);
});

$('.agent_id').on('change', function () {
	var agent = $(this).val();

	edit_get_agent_name(agent);
})

function get_agent_name(id) {
	$.ajax({
		url: '/agent_data/' + id,
		method: 'GET',
		success: function (response) {
			$('#agent_name').val(response[0].agent_name);
			$('#agency_name').val(response[0].agency);
		},
		error: function (xhr, status, error) {
			console.error('Error fetching options:', error);
		}
	});
}

function edit_get_agent_name(id) {
	$.ajax({
		url: '/agent_data/' + id,
		method: 'GET',
		success: function (response) {
			$('#edit_agent_name').val(response[0].agent_name);
			$('#edit_agency_name').val(response[0].agency);
		},
		error: function (xhr, status, error) {
			console.error('Error fetching options:', error);
		}
	});
}

function account_details(account_id_data, account_name) {
	reloadDataDetails();

	$('#modal-account-details').modal('show');

	$('#account_name').text(account_name);
	$('#account_id').val(account_id_data);

	account_id = account_id_data;

	if ($.fn.DataTable.isDataTable('#accountDetails')) {
		$('#accountDetails').DataTable().destroy();
	}

	var dataTableDetails = $('#accountDetails').DataTable({
		columnDefs: [{
			createdCell: function (cell, cellData, rowData, rowIndex, colIndex) {
				$(cell).addClass('text-center');
			}
		}]
	});


	function reloadDataDetails() {


		$.ajax({
			url: '/account_details_data/' + account_id_data, // Endpoint to fetch data
			method: 'GET',
			success: function (data) {
				dataTableDetails.clear().draw();
				var deposit_amount = 0;
				var withdraw_amount = 0;
				data.forEach(function (row) {
					if (row.TRANSACTION == 'DEPOSIT') {
						deposit_amount = deposit_amount + row.AMOUNT;
					}

					if (row.TRANSACTION == 'WITHDRAW') {
						withdraw_amount = withdraw_amount + row.AMOUNT;
					}


					var btn = `<div class="btn-group">
          <button type="button" onclick="archive_account_details(${row.account_details_id})" class="btn btn-sm btn-alt-danger js-bs-tooltip-enabled"
            data-bs-toggle="tooltip" aria-label="Archive" data-bs-original-title="Archive">
            <i class="fa fa-trash-alt"></i>
          </button>
        </div>`;

					// var dateFormat = moment(row.DATE).format('MMMM DD, YYYY');

					var trans = '';

					if (row.TRANSACTION == 'DEPOSIT' && row.TRANSFER == 1) {
						trans = 'DEPOSIT (Transferred)';
					} else if (row.TRANSACTION == 'WITHDRAW' && row.TRANSFER == 1) {
						trans = 'WITHDRAW (Transferred)';
					} else {
						trans = row.TRANSACTION;
					}

					var dateFormat = moment(row.encoded_date).format('MMMM DD, YYYY HH:mm:ss');

					dataTableDetails.row.add([dateFormat,trans, `P${row.AMOUNT.toLocaleString()}`]).draw();
				});


				$('.total_deposit').text(`P${deposit_amount.toLocaleString()}`);
				$('.total_withdraw').text(`P${withdraw_amount.toLocaleString()}`);
				$('.total_balance').text('P' + (deposit_amount - withdraw_amount).toLocaleString());
			},

			error: function (xhr, status, error) {
				console.error('Error fetching data:', error);
			}
		});

	}
}


function add_account_details() {
	$('#modal-account-details').modal('hide');
	$('#modal-add-account-details').modal('show');
	$('.txtAmount').val('');

	var account_id_val = $('#account_id').val();

	account_id = account_id_val;

	$('#account_id_add').val(account_id_val);

	transaction_type();
}


function transfer_account() {
	$('#modal-account-details').modal('hide');
	$('#modal-transfer_account').modal('show');
	$('.txtAmount').val('');

	var account_id_val = $('#account_id').val();
	account_id = account_id_val;
	$('#account_id_add_trans').val(account_id_val);

	get_account();
}


function transaction_type() {
	$.ajax({
		url: '/transaction_type_data',
		method: 'GET',
		success: function (response) {
			var selectOptions = $('#txtTrans');
			selectOptions.empty();
			selectOptions.append($('<option>', {
				value: ''
			}));
			response.forEach(function (option) {
				selectOptions.append($('<option>', {
					value: option.IDNo,
					text: option.TRANSACTION
				}));
			});
		},
		error: function (xhr, status, error) {
			console.error('Error fetching options:', error);
		}
	});
}

function transaction_type() {
	$.ajax({
		url: '/transaction_type_data',
		method: 'GET',
		success: function (response) {
			var selectOptions = $('#txtTrans');
			selectOptions.empty();
			selectOptions.append($('<option>', {
				value: '',
				text: '--SELECT TRANSACTION TYPE--'
			}));
			response.forEach(function (option) {
				selectOptions.append($('<option>', {
					value: option.IDNo,
					text: option.TRANSACTION
				}));
			});
		},
		error: function (xhr, status, error) {
			console.error('Error fetching options:', error);
		}
	});
}

function get_account() {
	$.ajax({
		url: '/account_data',
		method: 'GET',
		success: function (response) {
			var selectOptions = $('#txtAccount');
			selectOptions.empty();
			selectOptions.append($('<option>', {
				value: ''
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


function archive_account_details(id) {
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
				url: '/account_details/remove/' + id,
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


$(document).ready(function(){
	$("input[data-type='number']").keyup(function(event){
		// skip for arrow keys
		if(event.which >= 37 && event.which <= 40){
			event.preventDefault();
		}
		var $this = $(this);
		var num = $this.val().replace(/,/gi, "");
		var num2 = num.split(/(?=(?:\d{3})+$)/).join(",");
		$this.val(num2);
	});
})

function onlyNumberKey(evt) {
 
	let ASCIICode = (evt.which) ? evt.which : evt.keyCode
	if (ASCIICode > 31 && (ASCIICode < 48 || ASCIICode > 57))
		return false;
	return true;
}