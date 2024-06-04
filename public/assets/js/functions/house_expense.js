var expense_id;

$(document).ready(function() {
    if ($.fn.DataTable.isDataTable('#expense-tbl')) {
        $('#expense-tbl').DataTable().destroy();
    }

    var dataTable = $('#expense-tbl').DataTable({
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
        url: '/junket_house_expense_data', // Endpoint to fetch data
        method: 'GET',
        success: function(data) {
          dataTable.clear();

          var total_expense = 0;
          data.forEach(function(row) {
            var status = '';
            if (row.ACTIVE.data[0] == 1) {
                status = '<span class="badge bg-info">ACTIVE</span>';
            } else {
                status = '<span class="badge bg-danger">INACTIVE</span>';
            }

            total_expense = total_expense + row.AMOUNT;

            var btn = `<div class="btn-group">
            <button type="button" onclick="edit_expense(${row.expense_id}, '${row.expense_category_id}', '${row.RECEIPT_NO}', '${row.DATE_TIME}', '${row.DESCRIPTION}', '${row.AMOUNT}', '${row.OIC}' )" class="btn btn-sm btn-alt-secondary js-bs-tooltip-enabled"
              data-bs-toggle="tooltip" aria-label="Edit" data-bs-original-title="Edit">
              <i class="fa fa-pencil-alt"></i>
            </button>
            <button type="button" onclick="archive_expense(${row.expense_id})" class="btn btn-sm btn-alt-danger js-bs-tooltip-enabled"
              data-bs-toggle="tooltip" aria-label="Archive" data-bs-original-title="Archive">
              <i class="fa fa-trash-alt"></i>
            </button>
          </div>`;

            dataTable.row.add([`${row.expense_category}`,`${row.RECEIPT_NO}`, `${row.DESCRIPTION}`, `${row.AMOUNT}`, `${row.agent_name}`,status,btn]).draw();
          });
          $('.total_expense').text(`P${total_expense.toLocaleString()}`);
        },
        error: function(xhr, status, error) {
          console.error('Error fetching data:', error);
        }
      });
    }

    reloadData();

    $('#add_junket_house_expense').submit(function(event) {
      event.preventDefault(); 

      var formData = $(this).serialize();

        $.ajax({
          url: '/add_junket_house_expense',
          type: 'POST',
          data: formData,
          // processData: false, 
          // contentType: false,
          success: function(response) {
              reloadData();
              $('#modal-new-house-expense').modal('hide');
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

  
    $('#edit_junket_house_expense').submit(function(event) {
      event.preventDefault(); 

      var formData = $(this).serialize();
      $.ajax({
          url: '/junket_house_expense/' + expense_id,
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


function addHouseExpense() {
    $('#modal-new-house-expense').modal('show');

    expense_category();
    get_agent();
}


function edit_expense(id, category_id, receipt_no, datetimeval, description, amount, oic ) {
    console.log(Date.parse(datetimeval).toString('M-d-yyyy'));
  $('#modal-edit-house-expense').modal('show');
  $('#txtCategory').val(category_id);
  $('#txtReceiptNo').val(receipt_no);
  $('#txtDateandTime').val(datetimeval.toString('yyyy-mm-dd'));
  $('#txtDescription').val(description);
  $('#txtAmount').val(amount);
  $('#txtOfficerInCharge').val(oic);

  expense_id = id;

  edit_expense_category(category_id);
  edit_get_agent(oic);
}

function archive_expense(id){
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
        url: '/junket_house_expense/remove/' + id,
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

function expense_category() {
  $.ajax({
      url: '/expense_category_data',
      method: 'GET',
      success: function(response) {
          var selectOptions = $('#txtCategory');
          selectOptions.empty(); 
          selectOptions.append($('<option>', {
            value: '',
            text: '--SELECT EXPENSE CATEGORY--'
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

function get_agent() {
    $.ajax({
        url: '/agent_data',
        method: 'GET',
        success: function(response) {
            var selectOptions = $('#oic');
            selectOptions.empty(); 
            selectOptions.append($('<option>', {
              value: '',
              text: '--SELECT OFFICER IN CHARGE--'
          }));
            response.forEach(function(option) {
                selectOptions.append($('<option>', {
                    value: option.agent_id,
                    text: option.FIRSTNAME +' '+ option.MIDDLENAME +' '+ option.LASTNAME 
                }));
            });
        },
        error: function(xhr, status, error) {
            console.error('Error fetching options:', error);
        }
    });
  }

function edit_expense_category(id) {
  $.ajax({
      url: '/expense_category_data',
      method: 'GET',
      success: function(response) {
          var selectOptions = $('.txtCategory');
          selectOptions.empty(); 
          selectOptions.append($('<option>', {
              selected: false,
              value: '',
              text: '--SELECT EXPENSE CATEGORY--'
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


function edit_get_agent(id) {
    $.ajax({
        url: '/agent_data',
        method: 'GET',
        success: function(response) {
            var selectOptions = $('.txtOfficerInCharge');
            selectOptions.empty(); 
            selectOptions.append($('<option>', {
                selected: false,
                value: '',
                text: '--SELECT OFFICER-IN-CHARGE--'
            }));
            response.forEach(function(option) {
                var selected = false;
                if(option.agent_id == id) {
                  selected = true;
                }
                selectOptions.append($('<option>', {
                  selected: selected,
                  value: option.agent_id,
                  text: option.FIRSTNAME +' '+ option.MIDDLENAME +' '+ option.LASTNAME 
                }));
            });
        },
        error: function(xhr, status, error) {
            console.error('Error fetching options:', error);
        }
    });
  }


