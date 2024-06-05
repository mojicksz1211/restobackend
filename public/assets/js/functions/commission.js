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

          var sub_total_rolling = [];
          var total_due = 0;
          var total_expense = 0;
          var total_actual = 0;

          data.forEach(function(row) {

            var ref = '';
            var acct_code = '';

            if(row.GUESTNo) {
              ref =`${row.CODE}-${row.AGENT_CODE}-${row.GUESTNo}-${row.GAME_NO}`;
              acct_code =`${row.CODE}-${row.AGENT_CODE}-${row.GUESTNo}`;
            } else {
              ref = `${row.CODE}-${row.AGENT_CODE}-${row.GAME_NO}`;
              acct_code = `${row.CODE}-${row.AGENT_CODE}`;
            }

            var btn = `<div class="btn-group">
            <button type="button" onclick="EditCommission(${row.game_list_id}, '${ref}','${row.EXPENSE}','${row.ACTUAL_TO_AGENT}','${row.REMARKS}','${row.CASHIER}','${row.MANAGER}')" class="btn btn-sm btn-alt-info js-bs-tooltip-enabled"
              data-bs-toggle="tooltip" aria-label="Details" data-bs-original-title="Edit">
              <i class="fa fa-pencil"></i>
            </button>
          </div>`;

            $.ajax({
              url: '/game_list/'+row.game_list_id+'/record',
              method: 'GET',
              success: function(response) {
                var total_rolling = response[0].total_rolling;

                if(total_rolling == null) {
                  total_rolling = 0;
                }

                var due_to_agent = total_rolling * 0.015;
                var net = due_to_agent - row.EXPENSE;
                var expense = row.EXPENSE;
                var actual = row.ACTUAL_TO_AGENT;
                var remarks = row.REMARKS;
                var cashier = row.CASHIER;
                var manager = row.MANAGER;

  
                sub_total_rolling.push(sub_total_rolling + total_rolling);
                total_due = total_due + due_to_agent;
                total_expense = total_expense + expense;
                total_actual = total_actual + actual;
                
                dataTable.row.add([ref ,acct_code, `${row.account_name}`, parseFloat(total_rolling).toLocaleString(), parseFloat(due_to_agent).toLocaleString() ,expense ,parseFloat(net).toLocaleString()  ,actual ,remarks ,cashier ,manager ,btn]).draw();
              },
              error: function(xhr, status, error) {
                console.error('Error fetching options:', error);
              }
            });

          });

          rolling = 0;
          console.log(sub_total_rolling);

          $('.total_rolling').text(rolling);
          $('.total_due').text(total_due);
          $('.total_expense').text(total_expense);
          $('.total_actual').text(total_actual);
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