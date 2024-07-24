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
		}],
		createdRow: function (row, data, index) {

			if (parseInt(data[10].split(',').join('')) < 0) {
				$('td:eq(10)', row).css({
					'background-color': '#fff',
					'color': 'red'
				});
			}
		},
	});

	function reloadData() {

		$.ajax({
			url: '/game_list_data', // Endpoint to fetch data
			method: 'GET',
			success: function (data) {
				dataTable.clear();

				data.forEach(function (row) {

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

					var btn_his = `<button type="button" onclick="showHistory(${row.game_list_id})" class="btn btn-sm btn-alt-info js-bs-tooltip-enabled"
						data-bs-toggle="tooltip" aria-label="Details" data-bs-original-title="Details"  style="font-size:8px !important;">
						History
						</button>`;

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
							var initial_buy_in = 0;

							var total_nn_init = 0;
							var total_cc_init = 0;
							var total_nn = 0;
							var total_cc = 0;
							var total_cash_out_nn = 0;
							var total_cash_out_cc = 0;
							var total_rolling_nn = 0;
							var total_rolling_cc = 0;

							var total_rolling_real = 0;
							var total_rolling_nn_real = 0;
							var total_rolling_cc_real = 0;


							response.forEach(function (res) {

								if (res.CAGE_TYPE == 1 && (total_nn_init != 0 || total_cc_init != 0)) {
									total_buy_in = total_buy_in + res.AMOUNT;
									total_nn = total_nn + res.NN_CHIPS;
									total_cc = total_cc + res.CC_CHIPS;
								}

								if ((total_nn_init == 0 && total_cc_init == 0) && res.CAGE_TYPE == 1) {
									initial_buy_in = res.AMOUNT;
									total_nn_init = total_nn_init + res.NN_CHIPS;
									total_cc_init = total_cc_init + res.CC_CHIPS;
								}

								if (res.CAGE_TYPE == 2) {
									total_cash_out = total_cash_out + res.AMOUNT;
									total_cash_out_nn = total_cash_out_nn + res.NN_CHIPS;
									total_cash_out_cc = total_cash_out_cc + res.CC_CHIPS;
								}

								if (res.CAGE_TYPE == 3) {
									total_rolling = total_rolling + res.AMOUNT;
									total_rolling_nn = total_rolling_nn + res.NN_CHIPS;
									total_rolling_cc = total_rolling_cc + res.CC_CHIPS;
								}

								if (res.CAGE_TYPE == 4) {
									total_rolling_real = total_rolling_real + res.AMOUNT;
									total_rolling_nn_real = total_rolling_nn_real + res.NN_CHIPS;
									total_rolling_cc_real = total_rolling_cc_real + res.CC_CHIPS;
								}

							});

							var total_initial = total_nn_init + total_cc_init;
							var total_buy_in_chips = total_nn + total_cc;
							var total_cash_out_chips = total_cash_out_nn + total_cash_out_cc;
							var total_rolling_chips = total_rolling_nn + total_rolling_cc + total_rolling + total_rolling_real + total_rolling_nn_real + total_rolling_cc_real - total_cash_out_nn;

							var total_rolling_real_chips = total_rolling_real + total_rolling_nn_real + total_rolling_cc_real;

							var gross = total_buy_in - total_cash_out;

							var total_amount = total_buy_in_chips + total_initial;

							var net = (total_rolling_chips * (row.COMMISSION_PERCENTAGE / 100)).toLocaleString();

							var winloss = parseFloat(total_amount - total_cash_out_chips).toLocaleString();



							var status = '';

							var buyin_td = '';
							var rolling_td = '';
							var cashout_td = '';
							if (row.game_status == 2) {
								status = `<button type="button" onclick="changeStatus(${row.game_list_id}, ${net}, ${row.ACCOUNT_ID })" class="btn btn-sm btn-alt-info js-bs-tooltip-enabled"
								data-bs-toggle="tooltip" aria-label="Details" data-bs-original-title="Status"  style="font-size:8px !important;">ON GAME</button>`;

								buyin_td = '<button class="btn btn-link" style="font-size:11px;text-decoration: underline;" onclick="addBuyin(' + row.game_list_id + ', ' + row.ACCOUNT_ID + ')">' + parseFloat(total_buy_in_chips).toLocaleString() + '</button>';
								rolling_td = '<button class="btn btn-link" style="font-size:11px;text-decoration: underline;" onclick="addRolling(' + row.game_list_id + ')">' + parseFloat(total_rolling_real_chips).toLocaleString() + '</button>';
								cashout_td = '<button class="btn btn-link" style="font-size:11px;text-decoration: underline;" onclick="addCashout(' + row.game_list_id + ', ' + row.ACCOUNT_ID + ')">' + parseFloat(total_cash_out_chips).toLocaleString() + '</button>';

							} else {
								status = `<a href="#" onclick="changeStatus(${row.game_list_id}, ${net}, ${row.ACCOUNT_ID })">${moment(row.GAME_ENDED).format('MMMM DD, YYYY HH:mm:ss')}</a>`;

								buyin_td = parseFloat(total_buy_in_chips).toLocaleString();
								rolling_td = parseFloat(total_rolling_real_chips).toLocaleString();
								cashout_td = '<span style="font-size:11px;text-decoration: none;" >' + parseFloat(total_cash_out_chips).toLocaleString() + '</span>';

							}

							// dataTable.row.add([`${row.GAME_NO}`, `${row.game_list_id} (${row.agent_name})`, parseFloat(total_buy_in).toLocaleString(), parseFloat(total_cash_out).toLocaleString(), parseFloat(total_rolling).toLocaleString(), parseFloat(gross).toLocaleString(), parseFloat(net).toLocaleString(), status, btn]).draw();
							dataTable.row.add([`GAME-${row.game_list_id}`, `${row.agent_code} (${row.agent_name})`, total_initial.toLocaleString(), buyin_td, total_amount.toLocaleString(), rolling_td, parseFloat(total_rolling_chips).toLocaleString(), cashout_td, `${row.COMMISSION_PERCENTAGE}%`, net, winloss, status, btn_his]).draw();
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

	$('#add_buyin').submit(function (event) {
		event.preventDefault();

		var formData = $(this).serialize();

		$.ajax({
			url: '/game_list/add/buyin',
			type: 'POST',
			data: formData,
			// processData: false, 
			// contentType: false,
			success: function (response) {
				reloadData();
				$('#modal-add-buyin').modal('hide');
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

	$('#add_cashout').submit(function (event) {
		event.preventDefault();

		var formData = $(this).serialize();

		$.ajax({
			url: '/game_list/add/cashout',
			type: 'POST',
			data: formData,
			// processData: false, 
			// contentType: false,
			success: function (response) {
				reloadData();
				$('#modal-add-cashout').modal('hide');
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

	$('#add_rolling').submit(function (event) {
		event.preventDefault();

		var formData = $(this).serialize();

		$.ajax({
			url: '/game_list/add/rolling',
			type: 'POST',
			data: formData,
			// processData: false, 
			// contentType: false,
			success: function (response) {
				reloadData();
				$('#modal-add-rolling').modal('hide');
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

function addBuyin(id, account) {
	$('#modal-add-buyin').modal('show');

	$('.txtAmount').val('');
	$('.txtNN').val('');
	$('.txtCC').val('');
	$('.form-check-input').prop('checked', false);

	$('.game_list_id').val(id);
	$('.txtAccountCode').val(account);
}

function addRolling(id) {
	$('#modal-add-rolling').modal('show');

	$('.txtAmount').val('');
	$('.txtNN').val('');
	$('.txtCC').val('');

	$('.game_list_id').val(id);
}

function addCashout(id, account) {
	$('#modal-add-cashout').modal('show');

	$('.txtAmount').val('');
	$('.txtNN').val('');
	$('.txtCC').val('');

	$('.form-check-input').prop('checked', false);

	$('.game_list_id').val(id);
	$('.txtAccountCode').val(account);

}


function showHistory(record_id) {
	$('#modal-show-history').modal('show');

	if ($.fn.DataTable.isDataTable('#game_record-tbl')) {
		$('#game_record-tbl').DataTable().destroy();
	}

	var dataTable = $('#game_record-tbl').DataTable({
		columnDefs: [{
			createdCell: function (cell, cellData, rowData, rowIndex, colIndex) {
				$(cell).addClass('text-center');
			}
		}]
	});

	function reloadDataRecord() {
		$.ajax({
			url: '/game_record_data/' + record_id, // Endpoint to fetch data
			method: 'GET',
			success: function (data) {
				dataTable.clear();
				data.forEach(function (row) {


					var btn = `<div class="btn-group">
			<button type="button" onclick="archive_game_record(${row.game_record_id})" class="btn btn-sm btn-alt-danger js-bs-tooltip-enabled"
			data-bs-toggle="tooltip" aria-label="Archive" data-bs-original-title="Archive">
			<i class="fa fa-trash-alt"></i>
			</button>
		</div>`;



					var trading = moment(row.record_date).format('MMMM DD, YYYY HH:mm:ss');
					// var record_date = moment(row.RECORD_DATE).format('MMMM DD, YYYY');

					var buy_in = 0;
					var cash_out = 0;
					var rolling = 0;
					var real_rolling = 0;

					if (row.CAGE_TYPE == 1) {
						buy_in = row.CC_CHIPS + row.NN_CHIPS;
					}

					if (row.CAGE_TYPE == 2) {
						cash_out = row.CC_CHIPS + row.NN_CHIPS;
					}

					if (row.CAGE_TYPE == 3) {
						rolling = row.AMOUNT + row.CC_CHIPS + row.NN_CHIPS;
					}

					if (row.CAGE_TYPE == 4) {
						real_rolling = row.AMOUNT + row.CC_CHIPS + row.NN_CHIPS;
					}

					dataTable.row.add([trading, buy_in.toLocaleString(), cash_out.toLocaleString(), real_rolling.toLocaleString(), rolling.toLocaleString(), row.NN_CHIPS.toLocaleString(), row.CC_CHIPS.toLocaleString(), btn]).draw();
				});
			},
			error: function (xhr, status, error) {
				console.error('Error fetching data:', error);
			}
		});
	}

	reloadDataRecord()
}

function changeStatus(id, net, account) {
	$('#modal-change_status').modal('show');

	$('.txtAccountCode').val(account);
	$('.txtAmount').val(net);

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

function archive_game_record(id) {
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
				url: '/game_record/remove/' + id,
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

$(document).ready(function () {
	$("input[data-type='number']").keyup(function (event) {
		// skip for arrow keys
		if (event.which >= 37 && event.which <= 40) {
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