var game_id;

$(document).ready(function() {
    if ($.fn.DataTable.isDataTable('#commission-tbl')) {
        $('#commission-tbl').DataTable().destroy();
    }

    var dataTable = $('#commission-tbl').DataTable({
        columnDefs: [
            {
              createdCell: function(cell, cellData, rowData, rowIndex, colIndex) {
                  $(cell).addClass('text-center');
              }
            }
        ]
    });

    function reloadData() {
      
      $.ajax({
        url: '/game_list_data', // Endpoint to fetch data
        method: 'GET',
        success: function(data) {
          dataTable.clear();

          data.forEach(function(row) {

            var ref = '';
            var acct_code = '';

            // if(row.GUESTNo) {
              ref =`${row.GAME_NO}`;
              // acct_code =`${row.CODE}-${row.AGENT_CODE}-${row.GUESTNo}`;
            // } else {
            //   ref = `${row.CODE}-${row.AGENT_CODE}-${row.GAME_NO}`;
            //   acct_code = `${row.CODE}-${row.AGENT_CODE}`;
            // }

            var btn = `<div class="btn-group">
            <button type="button" onclick="EditCommission(${row.game_list_id}, '${ref}','${row.EXPENSE}','${row.ACTUAL_TO_AGENT}','${row.REMARKS}','${row.CASHIER}','${row.MANAGER}')" class="btn btn-sm btn-alt-info js-bs-tooltip-enabled"
              data-bs-toggle="tooltip" aria-label="Details" data-bs-original-title="Edit">
              <i class="fa fa-pencil"></i>
            </button>
          </div>`;

            var sub_total_rolling = 0;
            var total_due = 0;
            var total_expense = 0;
            var total_actual = 0;

            $.ajax({
              url: '/game_list/'+row.game_list_id+'/record',
              method: 'GET',
              success: function(response) {

                var total_rolling = 0;

                response.forEach(function(res) {
  
                  if(res.CAGE_TYPE == 3) {
                     total_rolling = res.AMOUNT;
                  }
                });

                var due_to_agent = total_rolling * 0.015;
                var net = due_to_agent - row.EXPENSE;
                var expense = row.EXPENSE;
                var actual = row.ACTUAL_TO_AGENT;
                var remarks = row.REMARKS;
                var cashier = row.CASHIER;
                var manager = row.MANAGER;

  
                sub_total_rolling = sub_total_rolling + total_rolling;
                total_due = total_due + due_to_agent;
                total_expense = total_expense + expense;
                total_actual = total_actual + actual;

                var rollingcurrentNumber = parseInt($('.total_rolling').text().replace(/,/g, ''));
                if(rollingcurrentNumber) {
                  var rollingnewNumber = rollingcurrentNumber + sub_total_rolling;
                  var rollingformattedNumber = rollingnewNumber.toLocaleString();
                } else {
                  var rollingformattedNumber = sub_total_rolling.toLocaleString();
                }

                var duecurrentNumber = parseInt($('.total_due').text().replace(/,/g, ''));
                if(duecurrentNumber) {
                  var duenewNumber = duecurrentNumber + total_due;
                  var dueformattedNumber = duenewNumber.toLocaleString();
                } else {
                  var dueformattedNumber = total_due.toLocaleString();
                }

                var expensecurrentNumber = parseInt($('.total_expense').text().replace(/,/g, ''));
                if(expensecurrentNumber) {
                  var expensenewNumber = expensecurrentNumber + total_expense;
                  var expenseformattedNumber = expensenewNumber.toLocaleString();
                } else {
                  var expenseformattedNumber = total_expense.toLocaleString();
                }

                var actualcurrentNumber = parseInt($('.total_actual').text().replace(/,/g, ''));
                if(actualcurrentNumber) {
                  var actualnewNumber = actualcurrentNumber + total_actual;
                  var actualformattedNumber = actualnewNumber.toLocaleString();
                } else {
                  var actualformattedNumber = total_actual.toLocaleString();
                }

                $('.total_rolling').text(rollingformattedNumber);
                $('.total_due').text(dueformattedNumber);
                $('.total_expense').text(expenseformattedNumber);
                $('.total_actual').text(actualformattedNumber);

                
                dataTable.row.add([ref ,row.account_no, `${row.agent_name}`, parseFloat(total_rolling).toLocaleString(), parseFloat(due_to_agent).toLocaleString() ,expense ,parseFloat(net).toLocaleString()  ,actual ,remarks ,cashier ,manager ,btn]).draw();
              },
              error: function(xhr, status, error) {
                console.error('Error fetching options:', error);
              }
            });

          });
          
        },
        error: function(xhr, status, error) {
          console.error('Error fetching data:', error);
        }
      });
    }

    reloadData();

    $('#edit_junket_commission').submit(function(event) {
      event.preventDefault(); 

      var formData = $(this).serialize();
      $.ajax({
          url: '/game_list/' + game_id,
          type: 'PUT',
          data: formData,
          success: function(response) {
              reloadData();
              $('#modal-edit-commission').modal('hide');
          },
          error: function(error) {
              console.error('Error updating user role:', error);
          }
      });
    });

});

function EditCommission(id, ref, expense, actual, remarks, cashier, manager) {
	$('#modal-edit-commission').modal('show');
  $('.game_ref_id').text(ref);

  game_id = id;

  if(remarks == 'null') {
    remarks = '';
  }

  if(cashier == 'null') {
    cashier = '';
  }

  if(manager == 'null') {
    manager = '';
  }

  $('.txtExpense').val(expense);
  $('.txtActualAgent').val(actual);
  $('.txtRemarks').val(remarks);
  $('.txtCashier').val(cashier);
  $('.txtManager').val(manager);
}