var capital_id;

$(document).ready(function() {
    if ($.fn.DataTable.isDataTable('#capital-tbl')) {
        $('#capital-tbl').DataTable().destroy();
    }

    var dataTable = $('#capital-tbl').DataTable({
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
        url: '/junket_capital_data', // Endpoint to fetch data
        method: 'GET',
        success: function(data) {
          dataTable.clear();

          var total_in = 0;
          var total_out = 0;

          data.forEach(function(row) {

            if(row.TRANSACTION_ID == '1') {
              total_in = total_in + row.AMOUNT;
            }
  
            if(row.TRANSACTION_ID == '2') {
              total_out = total_out + row.AMOUNT;
            }

            var status = '';
            if (row.ACTIVE == 1) {
                status = '<span class="badge bg-info">ACTIVE</span>';
            } else {
                status = '<span class="badge bg-danger">INACTIVE</span>';
            }

            var btn = `<div class="btn-group">
            <button type="button" onclick="edit_capital(${row.capital_id}, '${row.transaction_id}', '${row.category_id}', '${row.FULLNAME}', '${row.DESCRIPTION}', '${row.AMOUNT}', '${row.REMARKS}' )" class="btn btn-sm btn-alt-secondary js-bs-tooltip-enabled"
              data-bs-toggle="tooltip" aria-label="Edit" data-bs-original-title="Edit">
              <i class="fa fa-pencil-alt"></i>
            </button>
            <button type="button" onclick="archive_capital(${row.capital_id})" class="btn btn-sm btn-alt-danger js-bs-tooltip-enabled"
              data-bs-toggle="tooltip" aria-label="Archive" data-bs-original-title="Archive">
              <i class="fa fa-trash-alt"></i>
            </button>
          </div>`;

            dataTable.row.add([`${row.transaction}`,`${row.category}`, `${row.FULLNAME}`, `${row.DESCRIPTION}`, `${row.AMOUNT}`, `${row.REMARKS}`,status,btn]).draw();
          });

          $('.total_deposit').text(`P${total_in.toLocaleString()}`);
          $('.total_withdraw').text(`P${total_out.toLocaleString()}`);
          $('.total_balance').text('P'+(total_in - total_out).toLocaleString());
        },
        error: function(xhr, status, error) {
          console.error('Error fetching data:', error);
        }
      });
    }

    reloadData();

    $('#add_junket_capital').submit(function(event) {
      event.preventDefault(); 

      var formData = $(this).serialize();

        $.ajax({
          url: '/add_junket_capital',
          type: 'POST',
          data: formData,
          // processData: false, 
          // contentType: false,
          success: function(response) {
              reloadData();
              $('#modal-new-capital').modal('hide');
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

  
    $('#edit_junket_capital').submit(function(event) {
      event.preventDefault(); 

      var formData = $(this).serialize();
      $.ajax({
          url: '/junket_capital/' + capital_id,
          type: 'PUT',
          data: formData,
          success: function(response) {
              reloadData();
              $('#modal-edit-capital').modal('hide');
          },
          error: function(error) {
              console.error('Error updating user role:', error);
          }
      });
  });

});



function addCapital() {
    $('#modal-new-capital').modal('show');
    $('#txtTrans').val();
    $('#txtCategory').val();
    $('#txtFullname').val();
    $('#txtDescription').val();
    $('#txtAmount').val();
    $('#Remarks').val();
    transaction_type();
    capital_category();
}


function edit_capital(id, transaction_id, category_id, fullname, description, amount, remarks ) {
  $('#modal-edit-capital').modal('show');
  $('#txtTrans').val(transaction_id);
  $('#txtCategory').val(category_id);
  $('#txtFullname').val(fullname);
  $('#txtDescription').val(description);
  $('#txtAmount').val(amount);
  $('#Remarks').val(remarks);

  capital_id = id;

  edit_transaction_type(transaction_id);
  edit_capital_category(category_id);
}

function archive_capital(id){
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
        url: '/junket_capital/remove/' + id,
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

function transaction_type() {
  $.ajax({
      url: '/transaction_type_data',
      method: 'GET',
      success: function(response) {
          var selectOptions = $('#txtTrans');
          selectOptions.empty(); 
          selectOptions.append($('<option>', {
            value: '',
            text: '--SELECT TRANSACTION TYPE--'
        }));
          response.forEach(function(option) {
              selectOptions.append($('<option>', {
                  value: option.IDNo,
                  text: option.TRANSACTION
              }));
          });
      },
      error: function(xhr, status, error) {
          console.error('Error fetching options:', error);
      }
  });
}

function capital_category() {
    $.ajax({
        url: '/capital_category_data',
        method: 'GET',
        success: function(response) {
            var selectOptions = $('#txtCategory');
            selectOptions.empty(); 
            selectOptions.append($('<option>', {
              value: '',
              text: '--SELECT CAPITAL CATEGORY--'
          }));
            response.forEach(function(option) {
                selectOptions.append($('<option>', {
                    value: option.IDNo,
                    text: option.CATEGORY
                }));
            });
        },
        error: function(xhr, status, error) {
            console.error('Error fetching options:', error);
        }
    });
  }

function edit_transaction_type(id) {
  $.ajax({
      url: '/transaction_type_data',
      method: 'GET',
      success: function(response) {
          var selectOptions = $('.txtTrans');
          selectOptions.empty(); 
          selectOptions.append($('<option>', {
              selected: false,
              value: '',
              text: '--SELECT TRANSACTION TYPE--'
          }));
          response.forEach(function(option) {
              var selected = false;
              if(option.IDNo == id) {
                selected = true;
              }
              selectOptions.append($('<option>', {
                selected: selected,
                value: option.IDNo,
                text: option.TRANSACTION
              }));
          });
      },
      error: function(xhr, status, error) {
          console.error('Error fetching options:', error);
      }
  });
}


function edit_capital_category(id) {
    $.ajax({
        url: '/capital_category_data',
        method: 'GET',
        success: function(response) {
            var selectOptions = $('.txtCategory');
            selectOptions.empty(); 
            selectOptions.append($('<option>', {
                selected: false,
                value: '',
                text: '--SELECT CATEGORY--'
            }));
            response.forEach(function(option) {
                var selected = false;
                if(option.IDNo == id) {
                  selected = true;
                }
                selectOptions.append($('<option>', {
                  selected: selected,
                  value: option.IDNo,
                  text: option.CATEGORY
                }));
            });
        },
        error: function(xhr, status, error) {
            console.error('Error fetching options:', error);
        }
    });
  }
