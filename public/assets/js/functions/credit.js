var credit_id;

$(document).ready(function() {
    if ($.fn.DataTable.isDataTable('#credit-tbl')) {
        $('#credit-tbl').DataTable().destroy();
    }

    var dataTable = $('#credit-tbl').DataTable({
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
        url: '/junket_credit_data', // Endpoint to fetch data
        method: 'GET',
        success: function(data) {
          dataTable.clear();

          var total_credit = 0;
          data.forEach(function(row) {
            // var status = '';
            // if (row.ACTIVE.data[0] == 1) {
            //     status = '<span class="badge bg-info">ACTIVE</span>';
            // } else {
            //     status = '<span class="badge bg-danger">INACTIVE</span>';
            // }

            total_credit = total_credit + row.AMOUNT;

            var btn = `<div class="btn-group">
            <button type="button" onclick="edit_credit(${row.credit_id}, '${row.AMOUNT}', '${row.REMARKS}', '${row.STATUS_ID}' )" class="btn btn-sm btn-alt-secondary js-bs-tooltip-enabled"
              data-bs-toggle="tooltip" aria-label="Edit" data-bs-original-title="Edit">
              <i class="fa fa-pencil-alt"></i>
            </button>
            <button type="button" onclick="archive_credit(${row.credit_id})" class="btn btn-sm btn-alt-danger js-bs-tooltip-enabled"
              data-bs-toggle="tooltip" aria-label="Archive" data-bs-original-title="Archive">
              <i class="fa fa-trash-alt"></i>
            </button>
          </div>`;

            dataTable.row.add([`${row.CODE}-${row.AGENT_CODE}-${row.GUESTNo}`,`${row.AGENT_CODE}`, `${row.account_name}`, `${row.AMOUNT}`, `${row.STATUS}`, `${row.REMARKS}`,btn]).draw();
          });
          $('.total_credit').text(`P${total_credit.toLocaleString()}`);
        },
        error: function(xhr, status, error) {
          console.error('Error fetching data:', error);
        }
      });
    }

    reloadData();

    $('#add_junket_credit').submit(function(event) {
      event.preventDefault(); 

      var formData = $(this).serialize();

        $.ajax({
          url: '/add_junket_credit',
          type: 'POST',
          data: formData,
          // processData: false, 
          // contentType: false,
          success: function(response) {
              reloadData();
              $('#modal-new-credit').modal('hide');
          },
          error: function(xhr, status, error) {
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

  
    $('#edit_junket_credit').submit(function(event) {
      event.preventDefault(); 

      var formData = $(this).serialize();
      $.ajax({
          url: '/junket_credit/' + credit_id,
          type: 'PUT',
          data: formData,
          success: function(response) {
              reloadData();
              $('#modal-edit-house-expense').modal('hide');
          },
          error: function(error) {
              console.error('Error updating user role:', error);
          }
      });
  });

});


function addCredit() {
    $('#modal-new-credit').modal('show');
    get_status();
    account_data();
}



function edit_credit(id, amount, remarks, status ) {
  $('#modal-edit-credit').modal('show');
  $('.txtAmount').val(amount);
  $('.remarks').val(remarks);

  credit_id = id;
  get_status_edit(status);

  console.log(status);

}

function archive_credit(id){
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
        url: '/junket_credit/remove/' + id,
        type: 'PUT',
        success: function(response) {
          window.location.reload();
        },
        error: function(error) {
            console.error('Error deleting junket:', error);
        }
    });
    }
})
}

function account_data() {
  $.ajax({
      url: '/account_data',
      method: 'GET',
      success: function(response) {
          var selectOptions = $('#txtAccountCode');
          selectOptions.empty(); 
          selectOptions.append($('<option>', {
            value: '',
            text: '--SELECT ACCOUNT--'
        }));
          response.forEach(function(option) {
              selectOptions.append($('<option>', {
                  value: option.account_id +'-'+option.agent_code +'-'+ option.account_firstname +' '+option.account_middlename +' '+option.account_lastname, 
                  text: option.agency_code+'-'+option.agent_code+'-'+option.GUESTNo
              }));
          });
      },
      error: function(xhr, status, error) {
          console.error('Error fetching options:', error);
      }
  });
}

$('#txtAccountCode').on('change', function() {
    var account_id = $(this).val().split('-');

    $('#agent_code').val(account_id[1]);
    $('#account_name').val(account_id[2]);
    
});
  

function get_status() {
    $.ajax({
        url: '/credit_status_data',
        method: 'GET',
        success: function(response) {
            var selectOptions = $('#txtStatus');
            selectOptions.empty(); 
            selectOptions.append($('<option>', {
              value: '',
              text: '--SELECT CREDIT STATUS--'
          }));
            response.forEach(function(option) {
                selectOptions.append($('<option>', {
                    value: option.IDNo,
                    text: option.STATUS 
                }));
            });
        },
        error: function(xhr, status, error) {
            console.error('Error fetching options:', error);
        }
    });
}

function get_status_edit(id) {
  $.ajax({
      url: '/credit_status_data',
      method: 'GET',
      success: function(response) {
          var selectOptions = $('.txtStatus');
          selectOptions.empty(); 
          selectOptions.append($('<option>', {
            selected: false,
            value: '',
            text: '--SELECT CREDIT STATUS--'
        }));
          response.forEach(function(option) {
              var selected = false;
              if(option.IDNo == id) {
                selected = true;
              }
              selectOptions.append($('<option>', {
                  selected: selected,
                  value: option.IDNo,
                  text: option.STATUS 
              }));
          });
      },
      error: function(xhr, status, error) {
          console.error('Error fetching options:', error);
      }
  });
}