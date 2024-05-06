
var cage_id;

$(document).ready(function() {
    if ($.fn.DataTable.isDataTable('#cage-tbl')) {
        $('#cage-tbl').DataTable().destroy();
    }

    var dataTable = $('#cage-tbl').DataTable({
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
        url: '/junket_main_cage_data', // Endpoint to fetch data
        method: 'GET',
        success: function(data) {
          dataTable.clear();
          data.forEach(function(row) {
            var status = '';
            if (row.ACTIVE == 1) {
                status = '<span class="badge bg-info">ACTIVE</span>';
            } else {
                status = '<span class="badge bg-danger">INACTIVE</span>';
            }

            var btn = `<div class="btn-group">
            <button type="button" onclick="edit_cage(${row.junket_cage_id}, '${row.CAGE_ID}', '${row.DATE_TIME}', '${row.TRANSACTION_ID}', '${row.AMOUNT}' )" class="btn btn-sm btn-alt-secondary js-bs-tooltip-enabled"
              data-bs-toggle="tooltip" aria-label="Edit" data-bs-original-title="Edit">
              <i class="fa fa-pencil-alt"></i>
            </button>
            <button type="button" onclick="archive_cage(${row.junket_cage_id})" class="btn btn-sm btn-alt-danger js-bs-tooltip-enabled"
              data-bs-toggle="tooltip" aria-label="Archive" data-bs-original-title="Archive">
              <i class="fa fa-trash-alt"></i>
            </button>
          </div>`;

            dataTable.row.add([`${row.CATEGORY}`, `${row.DATE_TIME}`, `${row.TRANSACTION}`, `${row.AMOUNT}`,status, btn]).draw();
          });
        },
        error: function(xhr, status, error) {
          console.error('Error fetching data:', error);
        }
      });
    }

    reloadData();

    $('#add_junket_main_cage').submit(function(event) {
      event.preventDefault(); 

      var formData = $(this).serialize();

        $.ajax({
          url: '/add_junket_main_cage',
          type: 'POST',
          data: formData,
          // processData: false, 
          // contentType: false,
          success: function(response) {
              reloadData();
              $('#modal-new-concierge').modal('hide');
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

  
    $('#edit_junket_main_cage').submit(function(event) {
      event.preventDefault(); 

      var formData = $(this).serialize();
      $.ajax({
          url: '/junket_main_cage/' + cage_id,
          type: 'PUT',
          data: formData,
          success: function(response) {
              reloadData();
              $('#modal-edit-concierge').modal('hide');
          },
          error: function(error) {
              console.error('Error updating user role:', error);
          }
      });
  });

});


function addMainCage() {
    $('#modal-new-main-cage').modal('show');

    cage_category();
    get_transaction();
}

function edit_cage(id, cage, date_time, transaction, amount ) {
  $('#modal-edit-main-cage').modal('show');
  $('.txtDateTime').val(date_time);
  $('.txtAmount').val(amount);

  cage_id = id;

  edit_cage_category(cage);
  edit_get_transaction(transaction);
}

function archive_cage(id){
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
        url: '/junket_main_cage/remove/' + id,
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

function cage_category() {
  $.ajax({
      url: '/cage_category_data',
      method: 'GET',
      success: function(response) {
          var selectOptions = $('#txtCategory');
          selectOptions.empty(); 
          selectOptions.append($('<option>', {
            value: '',
            text: '--SELECT CONCIERGE CATEGORY--'
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

function get_transaction() {
    $.ajax({
        url: '/transaction_type_data',
        method: 'GET',
        success: function(response) {
            var selectOptions = $('#txtTransaction');
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

function edit_cage_category(id) {
  $.ajax({
      url: '/cage_category_data',
      method: 'GET',
      success: function(response) {
          var selectOptions = $('.txtCategory');
          selectOptions.empty(); 
          selectOptions.append($('<option>', {
              selected: false,
              value: '',
              text: '--SELECT CONCIERGE CATEGORY--'
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


function edit_get_transaction(id) {
    $.ajax({
        url: '/transaction_type_data',
        method: 'GET',
        success: function(response) {
            var selectOptions = $('.txtTransaction');
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




